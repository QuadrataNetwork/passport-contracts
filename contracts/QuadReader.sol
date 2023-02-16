//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

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

    /// @notice Retrieve a single attribute being issued about a wallet
    /// @param _account address of user
    /// @param _attribute attribute to get respective value from
    /// @return attribute Attribute struct (values, verifiedAt, issuer)
    function getAttribute(
        address _account, bytes32 _attribute
    ) external payable override returns(IQuadPassportStore.Attribute memory attribute) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        bool hasPreapproval = governance.preapproval(msg.sender);
        require(hasPreapproval, "CONTRACT_NOT_AUTHORIZED");

        attribute = passport.attribute(_account, _attribute);
        emit QueryEvent(_account, msg.sender, _attribute);
    }

    /// @notice Retrieve all attestations for a specific attribute being issued about a wallet
    /// @param _account address of user
    /// @param _attribute attribute to get respective value from
    /// @return attributes array of Attributes struct (values, verifiedAt, issuer)
    function getAttributes(
        address _account, bytes32 _attribute
    ) external payable override returns(IQuadPassportStore.Attribute[] memory attributes) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        bool hasPreapproval = governance.preapproval(msg.sender);
        require(hasPreapproval, "CONTRACT_NOT_AUTHORIZED");

        attributes = passport.attributes(_account, _attribute);
        emit QueryEvent(_account, msg.sender, _attribute);
    }

    /// @notice Retrieve all attestations for a specific attribute being issued about a wallet (Legacy verson)
    /// @dev For support for older version of solidity
    /// @param _account address of user
    /// @param _attribute attribute to get respective value from
    /// @return values Array of Attribute values
    /// @return epochs Array of Attribute's verifiedAt
    /// @return issuers Array of Attribute's issuers
    function getAttributesLegacy(
        address _account, bytes32 _attribute
    ) public payable override returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        bool hasPreapproval = governance.preapproval(msg.sender);
        require(hasPreapproval, "CONTRACT_NOT_AUTHORIZED");

        IQuadPassportStore.Attribute[] memory attributes = passport.attributes(_account, _attribute);
        values = new bytes32[](attributes.length);
        epochs = new uint256[](attributes.length);
        issuers = new address[](attributes.length);

        for (uint256 i = 0; i < attributes.length; i++) {
            values[i] = attributes[i].value;
            epochs[i] = attributes[i].epoch;
            issuers[i] = attributes[i].issuer;
        }
        emit QueryEvent(_account, msg.sender, _attribute);
    }

    /// @notice Retrieve all attestations for a batch of attributes being issued about a wallet
    /// @notice This will only retrieve the first available value for each attribute
    /// @param _account address of user
    /// @param _attributes List of attributes to get respective value from
    /// @return attributes array of Attributes struct (values, verifiedAt, issuer)
    function getAttributesBulk(
        address _account, bytes32[] calldata _attributes
    ) external payable override returns(IQuadPassportStore.Attribute[] memory attributes) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        bool hasPreapproval = governance.preapproval(msg.sender);
        require(hasPreapproval, "CONTRACT_NOT_AUTHORIZED");

        attributes = new IQuadPassportStore.Attribute[](_attributes.length);

        for (uint256 i = 0; i < _attributes.length; i++) {
            attributes[i] = passport.attribute(_account, _attributes[i]);
        }
        emit QueryBulkEvent(_account, msg.sender, _attributes);
    }


    /// @notice Retrieve all attestations for a batch of attributes being issued about a wallet
    /// @notice This will only retrieve the first available value for each attribute
    /// @dev For support for older version of solidity
    /// @param _account address of user
    /// @param _attributes List of attributes to get respective value from
    /// @return values Array of Attribute values
    /// @return epochs Array of Attribute's verifiedAt
    /// @return issuers Array of Attribute's issuers
    function getAttributesBulkLegacy(
        address _account, bytes32[] calldata _attributes
    ) external payable override returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        bool hasPreapproval = governance.preapproval(msg.sender);
        require(hasPreapproval, "CONTRACT_NOT_AUTHORIZED");

        values = new bytes32[](_attributes.length);
        epochs = new uint256[](_attributes.length);
        issuers = new address[](_attributes.length);

        for (uint256 i = 0; i < _attributes.length; i++) {
            IQuadPassportStore.Attribute memory attr = passport.attribute(_account, _attributes[i]);
                values[i] = attr.value;
                epochs[i] = attr.epoch;
                issuers[i] = attr.issuer;

        }
        emit QueryBulkEvent(_account, msg.sender, _attributes);
    }


    /// @dev Calculate the amount of $ETH required to call `getAttributes`
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _account account getting requested for attributes
    /// @return the amount of $ETH necessary to query the attribute
    function queryFee(
        address _account,
        bytes32 _attribute
    ) public override view returns(uint256) {
        require(governance.eligibleAttributes(_attribute)
            || governance.eligibleAttributesByDID(_attribute),
            "ATTRIBUTE_NOT_ELIGIBLE"
        );
        if(governance.preapproval(msg.sender)) {
            return 0;
        }

        IQuadPassportStore.Attribute memory businessAttr = passport.attribute(_account, ATTRIBUTE_IS_BUSINESS);

        uint256 fee = (businessAttr.value == keccak256("TRUE"))
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
        if(governance.preapproval(msg.sender)) {
            return 0;
        }
        IQuadPassportStore.Attribute memory businessAttr = passport.attribute(_account, ATTRIBUTE_IS_BUSINESS);

        uint256 fee;
        bool isBusiness = (businessAttr.value == keccak256("TRUE")) ? true : false;

        for (uint256 i = 0; i < _attributes.length; i++) {
            require(governance.eligibleAttributes(_attributes[i])
                || governance.eligibleAttributesByDID(_attributes[i]),
                "ATTRIBUTE_NOT_ELIGIBLE"
            );

            fee += isBusiness
                ?  governance.pricePerBusinessAttributeFixed(_attributes[i])
                : governance.pricePerAttributeFixed(_attributes[i]);
        }

        return fee;
    }


    /// @dev (DEPRECATED) Returns the number of attestations for an attribute about a Passport holder
    /// @param _account account getting requested for attributes
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @return the amount of existing attributes
    function balanceOf(address _account, bytes32 _attribute) public view override returns(uint256) {
       return passport.attributes(_account, _attribute).length;
    }

    /// @dev Returns the number of attestations for an attribute about a Passport holder
    /// @param _account account getting requested for attributes
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @return the amount of existing attributes
    function balancePerAttribute(address _account, bytes32 _attribute) public view returns(uint256) {
       return passport.attributes(_account, _attribute).length;
    }

    /// @dev Withdraw to  an issuer's treasury or the Quadrata treasury
    /// @notice Restricted behind a TimelockController
    /// @param _to address of either an issuer's treasury or the Quadrata treasury
    /// @param _amount amount to withdraw
    function withdraw(address payable _to, uint256 _amount) external override {
        require(
            IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender),
            "INVALID_ADMIN"
        );
        require(passport.passportPaused() == false, "Pausable: paused");
        bool isValid = false;
        address issuerOrProtocol;

        if (_to == governance.treasury()) {
            isValid = true;
            issuerOrProtocol = address(this);
        }

        if (!isValid) {
            address[] memory issuers = governance.getIssuers();
            for (uint256 i = 0; i < issuers.length; i++) {
                if (_to == governance.issuersTreasury(issuers[i])) {
                    isValid = true;
                    issuerOrProtocol = issuers[i];
                    break;
                }
            }
        }

        require(isValid, "WITHDRAWAL_ADDRESS_INVALID");
        require(_to != address(0), "WITHDRAW_ADDRESS_ZERO");
        require(_amount <= address(this).balance, "INSUFFICIENT_BALANCE");
        (bool sent,) = _to.call{value: _amount}("");
        require(sent, "FAILED_TO_TRANSFER_NATIVE_ETH");

        emit WithdrawEvent(issuerOrProtocol, _to, _amount);
    }


    function _authorizeUpgrade(address) internal view override {
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }
 }
