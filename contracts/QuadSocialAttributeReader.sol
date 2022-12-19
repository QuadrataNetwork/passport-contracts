//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";

import "./interfaces/IQuadReader.sol";
import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadPassportStore.sol";
import "./storage/QuadConstant.sol";

/// @title Quadrata SocialAttributeReader
/// @notice This contract houses the logic relating to posting/querying secondary (ie. "social") attributes.
contract SocialAttributeReader is UUPSUpgradeable, QuadConstant{
    using SafeMath for uint256;

    // keccak256(userAddress, attrType))
    mapping(bytes32 => IQuadPassportStore.Attribute) internal _attributes;
    mapping(address=>mapping(address=>mapping(bytes32 => bool))) public allowList;
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
    /// @param _attrvalue attribute value
    /// @param _targetAddr target wallet address being attested to
    function writeAttributes(bytes32 _attrName, bytes32 _attrValue, address _targetAddr) public {
        require(allowList[_targetAddr][msg.sender][_attrName]), 'NOT_ALLOWED');
        require(!_isPassportAttribute(_attrName), 'ATTR_NAME_NOT_ALLOWED');

        bytes32 attrKey = keccak256(abi.encode(_targetAddr, _attrName));

        IQuadPassportStore.Attribute memory attr = IQuadPassportStore.Attribute({
            value: _attrValue,
            epoch: block.timestamp,
            issuer: msg.sender
        });

        _attributes[attrKey] = attr;
    }

    /// @dev Checks if attribute is a primary passport attribute
    /// @param _attrName attribute name
    function _isPassportAttribute(bytes32 _attrName) public view returns(bool) {
        return governance.eligibleAttributes(_attrName) || governance.eligibleAttributesByDID(_attrName);
    }

    /// @dev Get the query fee for a getAttributes* call
    /// @param _account target wallet address
    /// @param _attrNames list of attribute names to query
    function queryFeeBulk(
        address _account,
        bytes32[] calldata _attrNames
    ) public view returns(uint256){
        uint256 fee;
        for(uint256 i = 0; i < _attrNames.length; i++){
            if(_isPassportAttribute(_attrNames[i])){
                fee = fee.add(reader.queryFee(_account, _attrNames[i]));
            } else {
                (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_attrNames[i]);
                fee = fee.add(interimIssuer.add(interimQuadrata));
            }
        }

        return fee;
    }

    /// @dev Purchase the attributes
    /// @param _account target wallet address
    /// @param _attrNames list of attribute names to query
    function getAttributesBulk(
        address _account,
        bytes32[] calldata _attrNames
    ) payable public returns(IQuadPassportStore.Attribute[] memory){
        uint256 quadrataFee;
        uint256 issuerFee;
        uint256 quadReaderFee;

        IQuadPassportStore.Attribute[] memory attributes = new IQuadPassportStore.Attribute[](_attrNames.length);

        for(uint256 i = 0; i < _attrNames.length; i++){
            if(_isPassportAttribute(_attrNames[i])){
                quadReaderFee = reader.queryFee(_account, _attrNames[i]);
                attributes[i] = reader.getAttributes{value: quadReaderFee}(_account, _attrNames[i])[0];
            } else {
                bytes32 attrKey = keccak256(abi.encode(_account, _attrNames[i]));
                attributes[i] = _attributes[attrKey];

                (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_attrNames[i]);
                issuerFee = issuerFee.add(interimIssuer);
                quadrataFee = quadrataFee.add(interimQuadrata);
            }
        }
        require(msg.value == (quadrataFee.add(issuerFee)), "INVALID_FEE");

        funds[governance.treasury()] = funds[governance.treasury()].add(quadrataFee);
        funds[_issuer] = funds[_issuer].add(issuerFee);

        return attributes;
    }

    /// @dev Calculate the fees for issuer/quadrata
    /// @param _attrName attribute name
    function calculateSocialFees(bytes32 _attrName) view internal returns (uint256 issuerFee, uint256 quadrataFee){
        if(queryFeeMap[_attrName].div(uint256(2)) > quadrataFee) {
            issuerFee = queryFeeMap[_attrName].div(uint256(2));
            quadrataFee = queryFeeMap[_attrName].sub(issuerFee);
        }else{
            issuerFee = queryFeeMap[_attrName].div(uint256(2));
            quadrataFee = quadrataFee;
        }
    }

    /// @dev Calculate the fees for issuer/quadrata
    /// @param _issuer issuer address
    /// @param _attrName attribute name
    function getAttributeKey(address _issuer, bytes32 _attrName) public view returns(bytes32){
        return keccak256(abi.encode(_issuer, _attrName));
    }

    /// @dev Allows target address to write about you
    /// @param _issuer issuer address
    /// @param _attrName attribute name
    /// @param _allow boolean to allow
    function allowance(address _addr, bytes32 _attrName, bool _allow) public {
        allowList[msg.sender][_addr][_attrName] = _allow;
    }

    /// @dev Withdraw function
    /// TODO: Gas optimization test
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

    /// @dev Auth upgrade
    function _authorizeUpgrade(address) internal view override {
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }
}
