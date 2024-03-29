//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./interfaces/IQuadReader.sol";
import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadPassportStore.sol";
import "./storage/QuadFlexKitStore.sol";

/// @title QuadFlexKit
/// @notice This contract houses the logic relating to posting/querying secondary (ie. "social") attributes.
contract QuadFlexKit is UUPSUpgradeable, ReentrancyGuardUpgradeable, QuadFlexKitStore{
    event WriteEvent(address indexed _account, address indexed _caller, bytes32 _attribute);
    event QueryEvent(address indexed _account, address indexed _caller, bytes32 _attribute);
    event WithdrawEvent(address indexed _caller, uint256 _fee);

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
    /// @param _issuerAndAttr attribute name
    /// @param _attrValue attribute value
    /// @param _account target wallet address being attested
    /// @param _sigAccount authorization signature to write to _attrName
    ///
    /// @notice The _sigAccount is a one-time use key (per attribute) to enable writing
    ///      to a specific _attrName. The user can revoke by calling setRevokedAttributes().
    ///      The user must call setRevokedAttributes() and set it to False for the datatype to be
    ///      writable again.
    function setAttributes(
        bytes32 _issuerAndAttr, // keccak(issuerAddr|keccak(attrName))
        bytes32 _attrValue,
        address _account,
        bytes calldata _sigAccount
    ) public {
        require(!revokedAttributes[_account][_issuerAndAttr], 'REVOKED_ATTRIBUTE');
        require(!_isPassportAttribute(_issuerAndAttr), 'ATTR_NAME_NOT_ALLOWED');

        if(!allowList[_account][_issuerAndAttr]){
            bytes memory message = abi.encodePacked("I authorize ", Strings.toHexString(uint256(uint160(msg.sender)), 20), " to attest to my address ", Strings.toHexString(uint256(uint160(_account)), 20));

            bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(message);
            address account = ECDSAUpgradeable.recover(signedMsg, _sigAccount);

            require(account == _account, 'INVALID_SIGNER');

            allowList[account][_issuerAndAttr] = true;
        }

        IQuadPassportStore.Attribute memory attr = IQuadPassportStore.Attribute({
            value: _attrValue,
            epoch: block.timestamp,
            issuer: msg.sender
        });

        _attributeStorage[_issuerAndAttr] = attr;

        emit WriteEvent(_account, msg.sender, _issuerAndAttr);
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
            if(_attributeStorage[_attribute].issuer == address(0)){
                return quadrataFee;
            }
            return (queryFeeMap[_attribute] + quadrataFee);
        }
    }

    /// @dev Get the query fee for a getAttributesBulk* call
    /// @param _account target wallet address
    /// @param _attributes list of attribute names to query
    function queryFeeBulk(
        address _account,
        bytes32[] calldata _attributes
    ) public view returns(uint256 fee){
        for(uint256 i = 0; i < _attributes.length; i++){
            if(_isPassportAttribute(_attributes[i])){
                fee += reader.queryFee(_account, _attributes[i]);
            } else {
                if(_attributeStorage[_attributes[i]].issuer != address(0)){
                    fee += queryFeeMap[_attributes[i]];
                }
                fee += quadrataFee;
            }
        }
    }

    /// @dev Purchase the attributes
    /// @param _account target wallet address
    /// @param _attribute attribute name to query
    function getAttributes(
        address _account, bytes32 _attribute
    ) external payable nonReentrant returns(IQuadPassportStore.Attribute[] memory attributes) {
        if(_isPassportAttribute(_attribute)){
            uint256 quadReaderFee = reader.queryFee(_account, _attribute);
            require(msg.value == quadReaderFee, "INVALID_FEE");

            return reader.getAttributes{value: quadReaderFee}(_account, _attribute);
        }
        IQuadPassportStore.Attribute[] memory attrs = new IQuadPassportStore.Attribute[](1);
        attrs[0] = _attributeStorage[_attribute];

        require(msg.value == (queryFeeMap[_attribute] + quadrataFee), "INVALID_FEE");

        funds[attrs[0].issuer] +=  queryFeeMap[_attribute];
        funds[governance.treasury()] += quadrataFee;

        emit QueryEvent(_account, msg.sender, _attribute);

        return attrs;
    }

    /// @dev Purchase the attributes
    /// @param _account target wallet address
    /// @param _attribute attribute name to query
    function getAttributesLegacy(
        address _account, bytes32 _attribute
    ) public payable nonReentrant returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers) {
        if(_isPassportAttribute(_attribute)){
            uint256 quadReaderFee = reader.queryFee(_account, _attribute);
            require(msg.value == quadReaderFee, "INVALID_FEE");

            return reader.getAttributesLegacy{value: quadReaderFee}(_account, _attribute);
        }

        IQuadPassportStore.Attribute[] memory attrs = new IQuadPassportStore.Attribute[](1);
        attrs[0] = _attributeStorage[_attribute];

        values = new bytes32[](1);
        epochs = new uint256[](1);
        issuers = new address[](1);

        values[0] = attrs[0].value;
        epochs[0] = attrs[0].epoch;
        issuers[0] = attrs[0].issuer;

        if(issuers[0] == address(0)){
            require(msg.value == quadrataFee, "INVALID_FEE");
            funds[governance.treasury()] += quadrataFee;
        } else {
            require(msg.value == (queryFeeMap[_attribute]+quadrataFee), "INVALID_FEE");
            funds[issuers[0]] += queryFeeMap[_attribute];
            funds[governance.treasury()] += quadrataFee;
        }

        emit QueryEvent(_account, msg.sender, _attribute);
    }

    /// @dev Purchase the attributes
    /// @param _account target wallet address
    /// @param _attributes list of attribute names to query
    function getAttributesBulkLegacy(
        address _account, bytes32[] calldata _attributes
    ) external payable nonReentrant returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers) {
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
                quadReaderFeeCounter += quadReaderFee;
            }else{
                attribute = _attributeStorage[_attributes[i]];
                values[i] = attribute.value;
                epochs[i] = attribute.epoch;
                issuers[i] = attribute.issuer;

                quadFeeCounter += quadrataFee;
                if(issuers[0] != address(0)){
                    issuerFeeCounter +=  queryFeeMap[_attributes[i]];
                    funds[attribute.issuer] += queryFeeMap[_attributes[i]];
                }
            }
            emit QueryEvent(_account, msg.sender, _attributes[i]);
        }
        require(msg.value == (quadFeeCounter + issuerFeeCounter + quadReaderFeeCounter), "INVALID_FEE");
        funds[governance.treasury()] += quadFeeCounter;
    }

    /// @dev Purchase the attributes
    /// @param _account target wallet address
    /// @param _attributes list of attribute names to query
    function getAttributesBulk(
        address _account,
        bytes32[] calldata _attributes
    ) external payable nonReentrant returns(IQuadPassportStore.Attribute[] memory){
        uint256 quadFeeCounter;
        uint256 issuerFeeCounter;
        uint256 quadReaderFeeCounter;

        uint256 quadReaderFee;

        IQuadPassportStore.Attribute[] memory attributes = new IQuadPassportStore.Attribute[](_attributes.length);

        for(uint256 i = 0; i < _attributes.length; i++){
            if(_isPassportAttribute(_attributes[i])){
                quadReaderFee = reader.queryFee(_account, _attributes[i]);
                attributes[i] = reader.getAttributes{value: quadReaderFee}(_account, _attributes[i])[0];
                quadReaderFeeCounter += quadReaderFee;
            } else {
                attributes[i] = _attributeStorage[_attributes[i]];

                quadFeeCounter += quadrataFee;

                if(attributes[i].issuer != address(0)){
                    issuerFeeCounter += queryFeeMap[_attributes[i]];
                    funds[attributes[i].issuer] += queryFeeMap[_attributes[i]];
                }
            }
            emit QueryEvent(_account, msg.sender, _attributes[i]);
        }
        require(msg.value == (quadFeeCounter + issuerFeeCounter + quadReaderFeeCounter), "INVALID_FEE");

        funds[governance.treasury()] += quadFeeCounter;
        return attributes;
    }

    /// @dev Calculate the attribute name for issuer/quadrata
    /// @param _issuer issuer address
    /// @param _attrName attribute name
    function getAttributeKey(address _issuer, bytes32 _attrName) public pure returns(bytes32){
        return keccak256(abi.encode(_issuer, _attrName));
    }

    /// @dev Withdraw function
    function withdraw() public {
        require(funds[msg.sender] > 0, "CANNOT_WITHDRAW");
        uint256 amount = funds[msg.sender];
        funds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value:amount}("");

        require(success, "TRANSFER_FAILED");

        emit WithdrawEvent(msg.sender, amount);
    }

    /// @dev Set query fee on a per address per attribute basis
    /// @param _rawAttrName unhashed raw attribute name
    /// @param _amount amount to charge
    function setQueryFee(bytes32 _rawAttrName, uint256 _amount) public {
        // Uses raw attr name and hashes against msg.sender to prevent
        // bad actors from changing others' fees.
        queryFeeMap[getAttributeKey(msg.sender, _rawAttrName)] = _amount;
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
