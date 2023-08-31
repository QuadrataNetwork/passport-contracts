//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/SignatureCheckerUpgradeable.sol";

import "./interfaces/IQuadPassport.sol";
import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadReader.sol";
import "./interfaces/IQuadPassportStore.sol";
import "./storage/QuadReaderStoreV2.sol";

/// @title Data Reader Contract for Quadrata Passport
/// @author Fabrice Cheng
/// @notice All accessor functions for reading and pricing quadrata attributes
 contract QuadReader is IQuadReader, UUPSUpgradeable, QuadReaderStoreV2 {
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
        require(hasPreapproval, "SENDER_NOT_AUTHORIZED");

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
        require(hasPreapproval, "SENDER_NOT_AUTHORIZED");

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
        require(hasPreapproval, "SENDER_NOT_AUTHORIZED");

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
        require(hasPreapproval, "SENDER_NOT_AUTHORIZED");

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
        require(hasPreapproval, "SENDER_NOT_AUTHORIZED");

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


    /// @dev stub for compatibility with older versions
    function queryFee(
        address,
        bytes32
    ) public override view returns(uint256) {
        return 0;
    }

    /// @dev stub for compatibility with older versions
    function queryFeeBulk(
        address,
        bytes32[] calldata
    ) public override view returns(uint256) {
       return 0;
    }


    /// @dev (DEPRECATED) Returns the number of attestations for an attribute about a Passport holder
    /// @param _account account getting requested for attributes
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @return the amount of existing attributes
    function balanceOf(address _account, bytes32 _attribute) public view override returns(uint256) {
       return passport.attributes(_account, _attribute).length;
    }

    /// @dev (DEPRECATED) Returns the number of attestations for an attribute about a Passport holder
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

    /// @dev Returns if a user's data is greater than or equal to (GTE) a certain threshold
    /// @param _account user whose data is being checked
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("TU_CREDIT_SCORE"))
    /// @param _verifiedAt timestamp of whewn data was issued
    /// @param _threshold threshold to compare the data to
    /// @param _flashSig signature of the flash query
    /// @return true if the data is GTE to the threshold, false otherwise
    function getFlashAttributeGTE(
        address _account,
        bytes32 _attribute,
        uint256 _verifiedAt,
        uint256 _threshold,
        bytes calldata _flashSig
    ) public payable override returns(bool) {
        if (_validateFlashAttrSignature(_account, _attribute, _verifiedAt, _threshold, _flashSig, keccak256("TRUE"))) {
            return true;
        }
        if (_validateFlashAttrSignature(_account, _attribute, _verifiedAt, _threshold, _flashSig, keccak256("FALSE"))) {
            return false;
        }

        revert("INVALID_ISSUER_OR_PARAMS");
    }

    /// @dev Returns true if the signature is valid
    /// @param _account user whose data is being checked
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("TU_CREDIT_SCORE"))
    /// @param _verifiedAt timestamp of whewn data was issued
    /// @param _threshold threshold to compare the data to
    /// @param _flashSig signature of the flash query
    /// @param _expectedValue value of the flash query
    /// @return true if the signature is valid
    function _validateFlashAttrSignature(
        address _account,
        bytes32 _attribute,
        uint256 _verifiedAt,
        uint256 _threshold,
        bytes calldata _flashSig,
        bytes32 _expectedValue
    ) internal returns(bool) {
        bytes32 extractionHash = keccak256(abi.encode(_account, msg.sender, _attribute, _verifiedAt, _threshold, msg.value, _expectedValue, block.chainid));
        require(!_usedFlashSigHashes[extractionHash], "SIGNATURE_ALREADY_USED");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(extractionHash);
        (address signer, ECDSAUpgradeable.RecoverError error) = ECDSAUpgradeable.tryRecover(signedMsg, _flashSig);
        // address signer = ECDSAUpgradeable.recover(signedMsg, _flashSig);
        bool isValidERC1271SignatureNow = (
            error == ECDSAUpgradeable.RecoverError.NoError
          ) || SignatureCheckerUpgradeable.isValidERC1271SignatureNow(signer, signedMsg, _flashSig);

        if (
            isValidERC1271SignatureNow
            && IAccessControlUpgradeable(address(governance)).hasRole(ISSUER_ROLE, signer)
        ) {
            require(governance.getIssuerStatus(signer), "ISSUER_NOT_ACTIVE");
            require(governance.eligibleAttributes(_attribute), "INVALID_ATTRIBUTE");
            require(governance.getIssuerAttributePermission(signer, _attribute), "INVALID_ISSUER_ATTR_PERMISSION");

            emit FlashQueryEvent(_account, msg.sender, _attribute, msg.value);
            _usedFlashSigHashes[extractionHash] = true;
            (bool sent,) = payable(governance.issuersTreasury(signer)).call{value: msg.value}("");
            require(sent, "FAILED_TO_TRANSFER_NATIVE_ETH");
            return true;
        }
        return false;

    }

    /// @dev Returns boolean indicating whether an attribute has been attested to a wallet for a given issuer.
    /// @param _account account getting requested for attributes
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _issuer address of issuer
    /// @return boolean
    function hasPassportByIssuer(address _account, bytes32 _attribute, address _issuer) public view override returns(bool) {
        IQuadPassportStore.Attribute[] memory attributes = passport.attributes(_account, _attribute);
        for (uint256 i = 0; i < attributes.length; i++) {
            if (attributes[i].issuer == _issuer){
                return true;
            }
        }
        return false;
    }
 }
