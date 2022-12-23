//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

import "./interfaces/IQuadReader.sol";
import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadPassportStore.sol";
import "./storage/QuadSocialAttributeReaderStore.sol";

import "hardhat/console.sol";


/// @title Quadrata SocialAttributeReader
/// @notice This contract houses the logic relating to posting/querying secondary (ie. "social") attributes.
contract SocialAttributeReader is UUPSUpgradeable, QuadSocialAttributeReaderStore{
    using SafeMath for uint256;

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
            bytes memory message = abi.encodePacked("I authorize ", msg.sender, " to attest to my address ", _account);
            // bytes memory message = abi.encodePacked("I 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
            // console.log("HELP!", toString(msg.sender), toString(_account));
            bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(message);
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

    function toString(address account) public pure returns(string memory) {
        return toString(abi.encodePacked(account));
    }

    function toString(bytes memory data) public pure returns(string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

    /// @dev Checks if attribute is a primary passport attribute
    /// @param _attrName attribute name
    function _isPassportAttribute(bytes32 _attrName) public view returns(bool) {
        return governance.eligibleAttributes(_attrName) || governance.eligibleAttributesByDID(_attrName);
    }



    /// @dev Get the query fee for a getAttributes* call
    /// @param _account target wallet address
    /// @param _attribute attribute name to query
    function queryFee(address _account,  bytes32 _attribute) public view returns(uint256){
        if(_isPassportAttribute(_attribute)){
            return reader.queryFee(_account, _attribute);
        } else {
            (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_attribute);
            return interimIssuer + interimQuadrata;
        }
    }

    /// @dev Get the query fee for a getAttributesBulk* call
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

    /// @dev Purchase the attributes
    /// @param _account target wallet address
    /// @param _attribute attribute name to query
    function getAttributes(
        address _account, bytes32 _attribute
    ) external payable returns(IQuadPassportStore.Attribute[] memory attributes) {
        if(_isPassportAttribute(_attribute)){
            uint256 quadReaderFee = reader.queryFee(_account, _attribute);
            return reader.getAttributes{value: quadReaderFee}(_account, _attribute);
        }
        IQuadPassportStore.Attribute[] memory attrs = new IQuadPassportStore.Attribute[](1);
        attrs[0] = _attributeStorage[keccak256(abi.encode(_account, _attribute))];

        (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_attribute);

        funds[attrs[0].issuer] = funds[attrs[0].issuer].add(interimIssuer);
        funds[governance.treasury()] = funds[governance.treasury()].add(interimQuadrata);

        return attrs;
    }

    /// @dev Purchase the attributes
    /// @param _account target wallet address
    /// @param _attribute attribute name to query
    function getAttributesLegacy(
        address _account, bytes32 _attribute
    ) public payable returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers) {
        if(_isPassportAttribute(_attribute)){
            uint256 quadReaderFee = reader.queryFee(_account, _attribute);
            return reader.getAttributesLegacy{value: quadReaderFee}(_account, _attribute);
        }

        IQuadPassportStore.Attribute[] memory attrs = new IQuadPassportStore.Attribute[](1);
        attrs[0] = _attributeStorage[keccak256(abi.encode(_account, _attribute))];

        values = new bytes32[](1);
        epochs = new uint256[](1);
        issuers = new address[](1);

        values[0] = attrs[0].value;
        epochs[0] = attrs[0].epoch;
        issuers[0] = attrs[0].issuer;

        (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_attribute);

        funds[issuers[0]] = funds[issuers[0]].add(interimIssuer);
        funds[governance.treasury()] = funds[governance.treasury()].add(interimQuadrata);
    }

    /// @dev Purchase the attributes
    /// @param _account target wallet address
    /// @param _attributes list of attribute names to query
    function getAttributesBulkLegacy(
        address _account, bytes32[] calldata _attributes
    ) external payable returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");

        values = new bytes32[](_attributes.length);
        epochs = new uint256[](_attributes.length);
        issuers = new address[](_attributes.length);

        uint256 quadFeeCounter;
        uint256 issuerFeeCounter;
        uint256 quadReaderFeeCounter;

        uint256 quadReaderFee;

        IQuadPassportStore.Attribute memory attribute;

        for (uint256 i = 0; i < _attributes.length; i++) {
            if(_isPassportAttribute(_attributes[i])){
                quadReaderFee = reader.queryFee(_account, _attributes[i]);
                attribute = reader.getAttributes{value: quadReaderFee}(_account, _attributes[i])[0];
                values[i] = attribute.value;
                epochs[i] = attribute.epoch;
                issuers[i] = attribute.issuer;
                quadReaderFeeCounter = quadReaderFeeCounter.add(quadReaderFee);
            }else{
                attribute = _attributeStorage[keccak256(abi.encode(_account, _attributes[i]))];
                values[i] = attribute.value;
                epochs[i] = attribute.epoch;
                issuers[i] = attribute.issuer;

                (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_attributes[i]);
                quadFeeCounter = quadFeeCounter.add(interimQuadrata);
                issuerFeeCounter = issuerFeeCounter.add(interimIssuer);

                funds[attribute.issuer] = funds[attribute.issuer].add(interimIssuer);
            }
        }
        require(msg.value == quadFeeCounter.add(issuerFeeCounter).add(quadReaderFeeCounter)," INVALID_QUERY_FEE");

        funds[governance.treasury()] = funds[governance.treasury()].add(quadFeeCounter);
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
        uint256 quadReaderFeeCounter;

        uint256 quadReaderFee;

        IQuadPassportStore.Attribute[] memory attributes = new IQuadPassportStore.Attribute[](_attributes.length);

        for(uint256 i = 0; i < _attributes.length; i++){
            if(_isPassportAttribute(_attributes[i])){
                quadReaderFee = reader.queryFee(_account, _attributes[i]);
                attributes[i] = reader.getAttributes{value: quadReaderFee}(_account, _attributes[i])[0];
                quadReaderFeeCounter.add(quadReaderFee);
            } else {
                attributes[i] = _attributeStorage[keccak256(abi.encode(_account, _attributes[i]))];

                (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_attributes[i]);
                quadFeeCounter = quadFeeCounter.add(interimQuadrata);
                issuerFeeCounter = issuerFeeCounter.add(interimIssuer);
                funds[attributes[i].issuer] = funds[attributes[i].issuer].add(interimIssuer);
            }
        }
        require(msg.value == (quadFeeCounter.add(issuerFeeCounter).add(quadReaderFeeCounter)), "INVALID_FEE");

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
    /// TODO: Handle ERC20 withdrawals in case of accidents
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
