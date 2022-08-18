//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";

import "./interfaces/IQuadPassport.sol";
import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadReader.sol";
import "./interfaces/IQuadPassportStore.sol";
import "./storage/QuadReaderStore.sol";

/// @title Data Reader Contract for Quadrata Passport
/// @author Fabrice Cheng, Theodore Clapp
/// @notice All accessor functions for reading and pricing quadrata attributes

 contract QuadReader is IQuadReader, UUPSUpgradeable, QuadReaderStore {
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
    ) external payable override returns(IQuadPassportStore.Attribute[] memory attributes) {
        _getAttributesVerify(_account, _attribute);

        attributes = passport.attributes(_account, _attribute);
        uint256 fee = queryFee(_account, _attribute);
        require(msg.value == fee, "INVALID_QUERY_FEE");
        if (fee > 0) {
            uint256 feeIssuer = attributes.length == 0 ? 0 : (fee * governance.revSplitIssuer() / 1e2) / attributes.length;

            for (uint256 i = 0; i < attributes.length; i++) {
                emit QueryFeeReceipt(attributes[i].issuer, feeIssuer);
            }
            emit QueryFeeReceipt(governance.treasury(), fee - feeIssuer * attributes.length);
        }
        emit QueryEvent(_account, msg.sender, _attribute);
    }

    function getAttributesLegacy(
        address _account, bytes32 _attribute
    ) external payable override returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers) {
        _getAttributesVerify(_account, _attribute);

        IQuadPassportStore.Attribute[] memory attributes = passport.attributes(_account, _attribute);
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
            emit QueryFeeReceipt(governance.treasury(), fee - feeIssuer * attributes.length);
        }
        emit QueryEvent(_account, msg.sender, _attribute);
    }

    function getAttributesBulk(
        address _account, bytes32[] calldata _attributes
    ) external payable override returns(IQuadPassportStore.Attribute[] memory) {
        IQuadPassportStore.Attribute[] memory attributes = new IQuadPassportStore.Attribute[](_attributes.length);
        IQuadPassportStore.Attribute[] memory businessAttrs = passport.attributes(_account, ATTRIBUTE_IS_BUSINESS);
        bool isBusiness = (businessAttrs.length > 0 && businessAttrs[0].value == keccak256("TRUE")) ? true : false;

        uint256 totalFee;
        uint256 totalFeeIssuer;

        for (uint256 i = 0; i < _attributes.length; i++) {
            uint256 attrFee = isBusiness ? governance.pricePerBusinessAttributeFixed(_attributes[i]) : governance.pricePerAttributeFixed(_attributes[i]);
            totalFee += attrFee;
            _getAttributesVerify(_account, _attributes[i]);
            IQuadPassportStore.Attribute memory attr = passport.attributes(_account, _attributes[i])[0];
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
        IQuadPassportStore.Attribute[] memory businessAttrs = passport.attributes(_account, ATTRIBUTE_IS_BUSINESS);
        bool isBusiness = (businessAttrs.length > 0 && businessAttrs[0].value == keccak256("TRUE")) ? true : false;

        uint256 totalFee;
        uint256 totalFeeIssuer;

        for (uint256 i = 0; i < _attributes.length; i++) {
            uint256 attrFee = isBusiness ? governance.pricePerBusinessAttributeFixed(_attributes[i]) : governance.pricePerAttributeFixed(_attributes[i]);
            totalFee += attrFee;
            _getAttributesVerify(_account, _attributes[i]);
            IQuadPassportStore.Attribute memory attr = passport.attributes(_account, _attributes[i])[0];
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
        IQuadPassportStore.Attribute[] memory attrs = passport.attributes(_account, ATTRIBUTE_IS_BUSINESS);
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
        IQuadPassportStore.Attribute[] memory attrs = passport.attributes(_account, ATTRIBUTE_IS_BUSINESS);

        uint256 fee;
        bool isBusiness = (attrs.length > 0 && attrs[0].value == keccak256("TRUE")) ? true : false;

        for (uint256 i = 0; i < _attributes.length; i++) {
            fee += isBusiness
                ?  governance.pricePerBusinessAttributeFixed(_attributes[i])
                : governance.pricePerAttributeFixed(_attributes[i]);
        }

        return fee;
    }


    /// @dev Returns the number of attestations for an attribute about a Passport holder
    /// @param _account account getting requested for attributes
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @return the amount of existing attributes
    function balanceOf(address _account, bytes32 _attribute) public view override returns(uint256) {
       return passport.attributes(_account, _attribute).length;
    }

    /// @dev Returns boolean indicating whether an attribute has been attested to a wallet for a given issuer.
    /// @param _account account getting requested for attributes
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _issuer address of issuer
    /// @return boolean
    function hasPassportByIssuer(address _account, bytes32 _attribute, address _issuer) public view override returns(bool) {
        // Try/catch MISSING_DID for AML queries
        try passport.attributes(_account, _attribute) returns (IQuadPassportStore.Attribute[] memory attributes){
            for(uint i = 0; i < attributes.length; i++){
                if(attributes[i].issuer == _issuer){
                    return true;
                }
            }
            return false;
        } catch {
            return false;
        }
    }

    /// @dev Withdraw to  an issuer's treasury or the Quadrata treasury
    /// @param _to address of either an issuer's treasury or the Quadrata treasury
    /// @param _amount amount to withdraw
    function withdraw(address payable _to, uint256 _amount) external override {
        require(
            IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender),
            "INVALID_ADMIN"
        );
        bool isValid = false;

        if (_to == governance.treasury()) {
            isValid = true;
        }

        address[] memory issuers = governance.getIssuers();
        for (uint256 i = 0; i < issuers.length; i++) {
            if (_to == governance.issuersTreasury(issuers[i])) {
                isValid = true;
                break;
            }
        }

        require(_to != address(0), "WITHDRAW_ADDRESS_ZERO");
        require(isValid, "WITHDRAWAL_ADDRESS_INVALID");
        require(_amount <= address(this).balance, "INSUFFICIENT_BALANCE");
        (bool sent,) = _to.call{value: _amount}("");
        require(sent, "FAILED_TO_TRANSFER_NATIVE_ETH");
    }


    function _authorizeUpgrade(address) internal view override {
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }
 }
