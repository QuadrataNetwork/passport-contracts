//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";

import "./interfaces/IQuadPassport.sol";
import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadReader.sol";
import "./storage/QuadReaderStore.sol";
import "./storage/QuadPassportStore.sol";
import "./storage/QuadGovernanceStore.sol";
import "hardhat/console.sol";

/// @title Data Reader Contract for Quadrata Passport
/// @author Fabrice Cheng, Theodore Clapp
/// @notice All accessor functions for reading and pricing quadrata attributes

 contract QuadReader is IQuadReader, UUPSUpgradeable, ReentrancyGuardUpgradeable, QuadReaderStore {
     using SafeERC20Upgradeable for IERC20MetadataUpgradeable;

     event QueryEvent(address indexed _account, address indexed _caller, bytes32 _attribute);
     event QueryBulkEvent(address indexed _account, address indexed _caller, bytes32[] _attributes);
     event QueryFeeReceipt(address indexed _issuer, uint256 _fee);

    constructor() initializer {
        // used to prevent logic contract self destruct take over
    }

    /// @dev initializer (constructor)
    /// @param _governance address of the IQuadGovernance contract
    /// @param _passport address of the IQuadPassport contract
    function initialize(
        address _governance,
        address _passport
    ) public initializer {
        require(_governance != address(0), "GOVERNANCE_ADDRESS_ZERO");
        require(_passport != address(0), "PASSPORT_ADDRESS_ZERO");

        governance = IQuadGovernance(_governance);
        passport = IQuadPassport(_passport);
    }

    function getAttributes(
        address _account, bytes32 _attribute
    ) external payable override returns(QuadPassportStore.Attribute[] memory attributes) {
        _getAttributesVerify(_account, _attribute);

        attributes = passport.attributes(_account, _attribute);
        uint256 fee = queryFee(_account, _attribute);
        require(msg.value == fee, "INVALID_QUERY_FEE");
        if (fee > 0) {
            uint256 feeIssuer = attributes.length == 0 ? 0 : (fee * governance.revSplitIssuer() / 1e2) / attributes.length;

            for (uint256 i = 0; i < attributes.length; i++) {
                emit QueryFeeReceipt(attributes[i].issuer, feeIssuer);
            }
            emit QueryFeeReceipt(governance.treasury(), fee - feeIssuer);
        }
        emit QueryEvent(_account, msg.sender, _attribute);
    }

    function getAttributesLegacy(
        address _account, bytes32 _attribute
    ) external payable override returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers) {
        _getAttributesVerify(_account, _attribute);

        QuadPassportStore.Attribute[] memory attributes = passport.attributes(_account, _attribute);
        values = new bytes32[](attributes.length);
        epochs = new uint256[](attributes.length);
        issuers = new address[](attributes.length);

        uint256 fee = queryFee(_account, _attribute);
        require(msg.value == fee, "INVALID_QUERY_FEE");

        if (fee > 0) {
            uint256 feeIssuer = attributes.length == 0 ? 0 : (fee * governance.revSplitIssuer() / 1e2) / attributes.length;

            for (uint256 i = 0; i < attributes.length; i++) {
                values[i] = attributes[i].value;
                epochs[i] = attributes[i].epoch;
                issuers[i] = attributes[i].issuer;
                emit QueryFeeReceipt(attributes[i].issuer, feeIssuer);
            }
            emit QueryFeeReceipt(governance.treasury(), fee - feeIssuer);
        }
        emit QueryEvent(_account, msg.sender, _attribute);
    }

    function getAttributesBulk(
        address _account, bytes32[] calldata _attributes
    ) external payable override returns(QuadPassportStore.Attribute[] memory) {
        QuadPassportStore.Attribute[] memory attributes = new QuadPassportStore.Attribute[](_attributes.length);
        QuadPassportStore.Attribute[] memory businessAttrs = passport.attributes(_account, ATTRIBUTE_IS_BUSINESS);
        bool isBusiness = (businessAttrs.length > 0 && businessAttrs[0].value == keccak256("TRUE")) ? true : false;

        uint256 totalFee;
        uint256 totalFeeIssuer;

        for (uint256 i = 0; i < _attributes.length; i++) {
            uint256 attrFee = isBusiness ? governance.pricePerBusinessAttributeFixed(_attributes[i]) : governance.pricePerAttributeFixed(_attributes[i]);
            totalFee += attrFee;
            _getAttributesVerify(_account, _attributes[i]);
            QuadPassportStore.Attribute memory attr = passport.attributes(_account, _attributes[i])[0];
            attributes[i] = attr;

            uint256 feeIssuer = attrFee * governance.revSplitIssuer() / 1e2;
            totalFeeIssuer += feeIssuer;
            emit QueryFeeReceipt(governance.issuersTreasury(attr.issuer), feeIssuer);
        }
        require(msg.value == totalFee," INVALID_QUERY_FEE");
        emit QueryFeeReceipt(governance.treasury(), totalFee - totalFeeIssuer);
        emit QueryBulkEvent(_account, msg.sender, _attributes);

        return attributes;
    }


    function getAttributesBulkLegacy(
        address _account, bytes32[] calldata _attributes
    ) external payable override returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers) {
        values = new bytes32[](_attributes.length);
        epochs = new uint256[](_attributes.length);
        issuers = new address[](_attributes.length);
        QuadPassportStore.Attribute[] memory businessAttrs = passport.attributes(_account, ATTRIBUTE_IS_BUSINESS);
        bool isBusiness = (businessAttrs.length > 0 && businessAttrs[0].value == keccak256("TRUE")) ? true : false;

        uint256 totalFee;
        uint256 totalFeeIssuer;

        for (uint256 i = 0; i < _attributes.length; i++) {
            uint256 attrFee = isBusiness ? governance.pricePerBusinessAttributeFixed(_attributes[i]) : governance.pricePerAttributeFixed(_attributes[i]);
            totalFee += attrFee;
            _getAttributesVerify(_account, _attributes[i]);
            QuadPassportStore.Attribute memory attr = passport.attributes(_account, _attributes[i])[0];
            values[i] = attr.value;
            epochs[i] = attr.epoch;
            issuers[i] = attr.issuer;

            uint256 feeIssuer = attrFee * governance.revSplitIssuer() / 1e2;
            totalFeeIssuer += feeIssuer;
            emit QueryFeeReceipt(governance.issuersTreasury(attr.issuer), feeIssuer);
        }
        require(msg.value == totalFee," INVALID_QUERY_FEE");
        emit QueryFeeReceipt(governance.treasury(), totalFee - totalFeeIssuer);
        emit QueryBulkEvent(_account, msg.sender, _attributes);
    }

    /// @notice safty checks for all getAttribute functions
    /// @param _account address of the passport holder to query
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    function _getAttributesVerify(
        address _account,
        bytes32 _attribute
    ) internal view {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        require(passport.balanceOf(_account, 1) == 1, "PASSPORT_DOES_NOT_EXIST");
        require(governance.eligibleAttributes(_attribute)
            || governance.eligibleAttributesByDID(_attribute),
            "ATTRIBUTE_NOT_ELIGIBLE"
        );
    }


    /// @dev Calculate the amount of $ETH required to call `getAttributes`
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _account account getting requested for attributes
    /// @return the amount of $ETH necessary to query the attribute
    function queryFee(
        address _account,
        bytes32 _attribute
    ) public override view returns(uint256) {
        QuadPassportStore.Attribute[] memory attrs = passport.attributes(_account, ATTRIBUTE_IS_BUSINESS);
        uint256 fee = (attrs.length > 0 && attrs[0].value == keccak256("TRUE"))
            ? governance.pricePerBusinessAttributeFixed(_attribute)
            : governance.pricePerAttributeFixed(_attribute);

        return fee;
    }

    /// @dev Calculate the amount of $ETH required to call `getAttributesBulk`
    /// @param _attributes Array of keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _account account getting requested for attributes
    /// @return the amount of $ETH necessary to query the attribute
    function queryFeeBulk(
        address _account,
        bytes32[] calldata _attributes
    ) public override view returns(uint256) {
        QuadPassportStore.Attribute[] memory attrs = passport.attributes(_account, ATTRIBUTE_IS_BUSINESS);

        uint256 fee;
        bool isBusiness = (attrs.length > 0 && attrs[0].value == keccak256("TRUE")) ? true : false;

        for (uint256 i = 0; i < _attributes.length; i++) {
            fee += isBusiness
                ?  governance.pricePerBusinessAttributeFixed(_attributes[i])
                : governance.pricePerAttributeFixed(_attributes[i]);
        }

        return fee;
    }

    function _authorizeUpgrade(address) internal view override {
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }
 }
