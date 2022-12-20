//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

import "./interfaces/IQuadReader.sol";
import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadPassportStore.sol";
import "./storage/QuadConstant.sol";

import "hardhat/console.sol";


/// @title Quadrata SocialAttributeReader
/// @notice This contract houses the logic relating to posting/querying secondary (ie. "social") attributes.
contract SocialAttributeReader is UUPSUpgradeable, QuadConstant {
    using SafeMath for uint256;

    // keccak256(userAddress, attrType))
    mapping(bytes32=>IQuadPassportStore.Attribute) internal _attributeStorage;
    mapping(address=>mapping(bytes32=>bool)) public allowList;
    mapping(address=>mapping(bytes32=>bool)) public revokedAttributes;
    mapping(bytes32=>uint256) public queryFeeMap;
    mapping(address=>uint256) public funds;

    uint256 public quadrataFee;

    IQuadGovernance public governance;
    IQuadReader public reader;

    // used to prevent logic contract self destruct take over
    constructor() initializer {}

    /// @dev initializer (constructor)
    /// @param _governance contract address of the IQuadGovernance contract
    /// @param _reader contract address of the IQuadReader contract
    function initialize(
        address _governance,
        address _reader
    ) public initializer {
        require(_governance != address(0), "GOVERNANCE_ADDRESS_ZERO");
        require(_reader != address(0), "READER_ADDRESS_ZERO");

        governance = IQuadGovernance(_governance);
        reader = IQuadReader(_reader);
    }

    /// @dev Write attribute onchain
    /// @param _attrName attribute name
    /// @param _attrValue attribute value
    /// @param _account target wallet address being attested
    /// @param _sigAccount authorization signature to write to _attrName
    ///
    /// note The _sigAccount is a one-time use key (per attribute) to enable writing
    ///      to a specific _attrName. The user can revoke by calling setRevokedAttributes().
    ///      The user must call setRevokedAttributes() and set it to False for the datatype to be
    ///      writable again.
    function setAttributes(
        bytes32 _attrName, // keccak(issuerAddr|keccak(attrName))
        bytes32 _attrValue,
        address _account,
        bytes calldata _sigAccount
    ) public {
        require(!revokedAttributes[_account][_attrName], 'REVOKED_ATTRIBUTE');
        require(!_isPassportAttribute(_attrName), 'ATTR_NAME_NOT_ALLOWED');

        if(!allowList[_account][_attrName]){
            bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(_attrName);
            address account = ECDSAUpgradeable.recover(signedMsg, _sigAccount);

            require(account == _account, 'INVALID_SIGNER');

            allowList[account][_attrName] = true;
        }

        IQuadPassportStore.Attribute memory attr = IQuadPassportStore.Attribute({
            value: _attrValue,
            epoch: block.timestamp,
            issuer: msg.sender
        });

        _attributeStorage[keccak256(abi.encode(_account, _attrName))] = attr;
    }

    /// @dev Checks if attribute is a primary passport attribute
    /// @param _attrName attribute name
    function _isPassportAttribute(bytes32 _attrName) public view returns(bool) {
        return governance.eligibleAttributes(_attrName) || governance.eligibleAttributesByDID(_attrName);
    }

    /// @dev Get the query fee for a getAttributes* call
    /// @param _account target wallet address
    /// @param _attributes list of attribute names to query
    function queryFeeBulk(
        address _account,
        bytes32[] calldata _attributes
    ) public view returns(uint256){
        uint256 fee;
        for(uint256 i = 0; i < _attributes.length; i++){
            if(_isPassportAttribute(_attributes[i])){
                fee = fee.add(reader.queryFee(_account, _attributes[i]));
            } else {
                (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_attributes[i]);
                fee = fee.add(interimIssuer.add(interimQuadrata));
            }
        }

        return fee;
    }

    // TODO: Huy
    function getAttributes(
        address _account, bytes32 _attribute
    ) external payable returns(IQuadPassportStore.Attribute[] memory attributes) {
    }

    // TODO: Huy
    function getAttributesLegacy(
        address _account, bytes32 _attribute
    ) public payable returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers) {
    }

    // TODO: Huy
    function getAttributesBulkLegacy(
        address _account, bytes32[] calldata _attributes
    ) external payable returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers) {
    }

    /// @dev Purchase the attributes
    /// @param _account target wallet address
    /// @param _attributes list of attribute names to query
    function getAttributesBulk(
        address _account,
        bytes32[] calldata _attributes
    ) external payable returns(IQuadPassportStore.Attribute[] memory){
        uint256 quadFeeCounter;
        uint256 issuerFeeCounter;
        uint256 quadReaderFee;

        IQuadPassportStore.Attribute[] memory attributes = new IQuadPassportStore.Attribute[](_attributes.length);

        for(uint256 i = 0; i < _attributes.length; i++){
            if(_isPassportAttribute(_attributes[i])){
                quadReaderFee = reader.queryFee(_account, _attributes[i]);
                attributes[i] = reader.getAttributes{value: quadReaderFee}(_account, _attributes[i])[0];
            } else {
                attributes[i] = _attributeStorage[keccak256(abi.encode(_account, _attributes[i]))];

                (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_attributes[i]);
                quadFeeCounter = quadFeeCounter.add(interimQuadrata);
                issuerFeeCounter = issuerFeeCounter.add(interimIssuer);
                funds[attributes[i].issuer] = funds[attributes[i].issuer].add(interimIssuer);
            }
        }
        require(msg.value == (quadFeeCounter.add(issuerFeeCounter)), "INVALID_FEE");

        funds[governance.treasury()] = funds[governance.treasury()].add(quadFeeCounter);

        return attributes;
    }

    /// @dev Calculate the fees for issuer/quadrata
    /// @param _attrName attribute name
    function calculateSocialFees(bytes32 _attrName) view internal returns (uint256 interimIssuerFee, uint256 interimQuadFee){
        if(queryFeeMap[_attrName].div(uint256(2)) > interimQuadFee) {
            interimIssuerFee = queryFeeMap[_attrName].div(uint256(2));
            interimQuadFee = queryFeeMap[_attrName].sub(interimIssuerFee);
        }else{
            interimIssuerFee = queryFeeMap[_attrName].div(uint256(2));
            interimQuadFee = interimQuadFee;
        }
    }

    /// @dev Calculate the attribute name for issuer/quadrata
    /// @param _issuer issuer address
    /// @param _attrName attribute name
    function getAttributeKey(address _issuer, bytes32 _attrName) public view returns(bytes32){
        return keccak256(abi.encode(_issuer, _attrName));
    }

    /// @dev Withdraw function
    /// TODO: Gas optimization test - might delete this later
    function withdraw() public {
        require(funds[msg.sender] > 0, "CANNOT_WITHDRAW");
        uint256 amount = funds[msg.sender];
        funds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value:amount}("");
        require(success, "TRANSFER_FAILED");
    }

    /// @dev Set query fee on a per address per attribute basis
    /// @param _rawAttrName unhashed raw attribute name
    /// @param _amount amount to charge
    function setQueryFee(bytes32 _rawAttrName, uint256 _amount) public {
        // Uses raw attr name and hashes against msg.sender to prevent
        // bad actors from changing others' fees.
        queryFeeMap[keccak256(abi.encode(msg.sender, _rawAttrName))] = _amount;
    }

    /// @dev Set the quadrata base fee
    /// @param _amount amount to charge
    function setQuadrataFee(uint256 _amount) public {
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
        quadrataFee = _amount;
    }

    /// @dev Set the revoked attribute boolean
    /// @param _attrName attrName to change
    /// @param _status new revoked value as a boolean
    function setRevokedAttributes(bytes32 _attrName, bool _status) public {
        revokedAttributes[msg.sender][_attrName] = _status;
    }

    /// @dev Auth upgrade
    function _authorizeUpgrade(address) internal view override {
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }
}
