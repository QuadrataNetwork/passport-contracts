//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "./interfaces/IQuadPassport.sol";
import "./interfaces/IQuadGovernance.sol";
import "./storage/QuadPassportStore.sol";
import "./QuadSoulbound.sol";

/// @title Quadrata Web3 Identity Passport
/// @author Fabrice Cheng, Theodore Clapp
/// @notice This represents a Quadrata NFT Passport
contract QuadPassport is IQuadPassport, UUPSUpgradeable, PausableUpgradeable, QuadSoulbound, QuadPassportStore {

    // used to prevent logic contract self destruct take over
    constructor() initializer {}

    /// @dev initializer (constructor)
    /// @param _governanceContract address of the IQuadGovernance contract
    function initialize(
        address _governanceContract
    ) public initializer {
        require(_governanceContract != address(0), "GOVERNANCE_ADDRESS_ZERO");
        governance = IQuadGovernance(_governanceContract);
        name = "Quadrata Passport";
        symbol = "QP";
    }

    /// @notice Set attributes for a Quadrata Passport (Only Individuals)
    /// @dev Only when authorized by an eligible issuer
    /// @param _config Input paramters required to authorize attributes to be set
    /// @param _sigIssuer ECDSA signature computed by an eligible issuer to authorize the mint
    /// @param _sigAccount ECDSA signature computed by an eligible EOA to prove ownership
    function setAttributes(
        AttributeSetterConfig memory _config,
        bytes calldata _sigIssuer,
        bytes calldata _sigAccount
    ) external payable override whenNotPaused {
        require(msg.value == _config.fee,  "INVALID_SET_ATTRIBUTE_FEE");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash("Welcome to Quadrata! By signing, you agree to the Terms of Service.");
        address account = ECDSAUpgradeable.recover(signedMsg, _sigAccount);
        address issuer = _setAttributesVerify(account, _config, _sigIssuer);

        _setAttributesInternal(account, _config, issuer);
    }

    /// @notice Set attributes from multiple issuers for a Quadrata Passport (Only Individuals)
    /// @dev Only when authorized by an eligible issuer
    /// @param _configs List of input paramters required to authorize attributes to be set
    /// @param _sigIssuers List of ECDSA signature computed by an eligible issuer to authorize the mint
    /// @param _sigAccounts List of ECDSA signature computed by an eligible EOA to prove ownership
    function setAttributesBulk(
        AttributeSetterConfig[] memory _configs,
        bytes[] calldata _sigIssuers,
        bytes[] calldata _sigAccounts
    ) external payable override whenNotPaused {
        require(_configs.length == _sigIssuers.length, "INVALID_BULK_ATTRIBUTES_LENGTH");
        require(_configs.length == _sigAccounts.length, "INVALID_BULK_ATTRIBUTES_LENGTH");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash("Welcome to Quadrata! By signing, you agree to the Terms of Service.");
        uint256 totalFee;

        for(uint256 i = 0; i < _configs.length; i++){
            address account = ECDSAUpgradeable.recover(signedMsg, _sigAccounts[i]);
            address issuer = _setAttributesVerify(account, _configs[i], _sigIssuers[i]);
            totalFee += _configs[i].fee;
            _setAttributesInternal(account, _configs[i], issuer);
        }
        require(msg.value == totalFee,  "INVALID_SET_ATTRIBUTE_BULK_FEE");

    }

    /// @notice Set attributes for a Quadrata Passport (only by Issuers)
    /// @param _account Address of the Quadrata Passport holder
    /// @param _config Input paramters required to set attributes
    /// @param _sigIssuer ECDSA signature computed by an eligible issuer to authorize the action
    function setAttributesIssuer(
        address _account,
        AttributeSetterConfig memory _config,
        bytes calldata _sigIssuer
    ) external payable override whenNotPaused {
        require(_account != address(0), "ACCOUNT_CANNOT_BE_ZERO");
        require(msg.value == _config.fee,  "INVALID_SET_ATTRIBUTE_FEE");

        address issuer = _setAttributesVerify(_account, _config, _sigIssuer);

        _setAttributesInternal(_account, _config, issuer);
    }

    /// @notice Internal function for `setAttributes` and `setAttributesIssuer`
    /// @param _account Address of the Quadrata Passport holder
    /// @param _config Input paramters required to set attributes
    /// @param _issuer Extracted address of ECDSA signature computed by an eligible issuer to authorize the action
    function _setAttributesInternal(
        address _account,
        AttributeSetterConfig memory _config,
        address _issuer
    ) internal {
        // Handle DID
        if(_config.did != bytes32(0)){
            require(governance.getIssuerAttributePermission(_issuer, ATTRIBUTE_DID), "ISSUER_ATTR_PERMISSION_INVALID");
            _validateDid(_account, _config.did);
            _writeAttrToStorage(
                _computeAttrKey(_account, ATTRIBUTE_DID, _config.did),
                _config.did,
                _issuer,
                _config.verifiedAt);

        }
        for (uint256 i = 0; i < _config.attrKeys.length; i++) {
            require(governance.getIssuerAttributePermission(_issuer, _config.attrTypes[i]), "ISSUER_ATTR_PERMISSION_INVALID");
            require(_config.attrTypes[i] != ATTRIBUTE_DID, "ISSUER_UPDATED_DID");

            // Verify attrKeys computation
            _verifyAttrKey(_account, _config.attrTypes[i], _config.attrKeys[i], _config.did);
            _writeAttrToStorage(
                _config.attrKeys[i],
                _config.attrValues[i],
                _issuer,
                _config.verifiedAt);

            // AVAX Subnet Allowlist Management
            if (_config.attrTypes[i] == ATTRIBUTE_AML) {
                _manageAllowList(_account);
            }
        }
        if (_config.tokenId != 0 && balanceOf(_account, _config.tokenId) == 0) {
            _mint(_account, _config.tokenId, 1);
        }
        emit SetAttributeReceipt(_account, _issuer, _config.fee);
    }

    /// @notice Internal function that validates supplied DID on updates do not change
    /// @param _account address of entity being attested to
    /// @param _did new DID value
    function _validateDid(address _account, bytes32 _did) internal view {
        Attribute[] memory dIDAttrs = _attributes[keccak256(abi.encode(_account, ATTRIBUTE_DID))];
        if(dIDAttrs.length > 0){
            require(dIDAttrs[0].value == _did, "INVALID_DID");
        }
    }

    /// @notice Internal function that writes the attribute value and issuer position to storage
    /// @param _attrKey attribute key (i.e. keccak256(address, keccak256("AML")))
    /// @param _attrValue attribute value
    /// @param _issuer address of issuer who verified attribute
    /// @param _verifiedAt timestamp of when attribute was verified at
    function _writeAttrToStorage(
        bytes32 _attrKey,
        bytes32 _attrValue,
        address _issuer,
        uint256 _verifiedAt
    ) internal {
        uint256 issuerPosition = _position[keccak256(abi.encode(_attrKey, _issuer))];
        Attribute memory attr = Attribute({
            value:  _attrValue,
            epoch: _verifiedAt,
            issuer: _issuer
        });

        if (issuerPosition == 0) {
        // Means the issuer hasn't yet attested to that attribute type
            _attributes[_attrKey].push(attr);
            _position[keccak256(abi.encode(_attrKey, _issuer))] = _attributes[_attrKey].length;
        } else {
            // Issuer already attested to that attribute - override
            _attributes[_attrKey][issuerPosition-1] = attr;
        }
    }

    /// @notice Verify that the attrKey has been correctly computed based on account and attrType
    /// @param _account Address of the Quadrata Passport holder
    /// @param _attrType bytes32 of the attribute type
    /// @param _attrKey bytes32 of the attrKey to compare against/verify
    function _verifyAttrKey(address _account, bytes32 _attrType, bytes32 _attrKey, bytes32 _did) internal view {
        bytes32 expectedAttrKey = _computeAttrKey(_account, _attrType, _did);

        require(_attrKey == expectedAttrKey, "MISMATCH_ATTR_KEY");
    }

    /// @notice Internal helper to check setAttributes process
    /// @param _account Address of the Quadrata Passport holder
    /// @param _config Input paramters required to set attributes
    /// @param _sigIssuer ECDSA signature computed by an eligible issuer to authorize the action
    /// @return address of the issuer
    function _setAttributesVerify(
        address _account,
        AttributeSetterConfig memory _config,
        bytes calldata _sigIssuer
    ) internal returns(address) {
        require(_config.tokenId == 0 || governance.eligibleTokenId(_config.tokenId), "PASSPORT_TOKENID_INVALID");
        require(_config.verifiedAt != 0, "VERIFIED_AT_CANNOT_BE_ZERO");
        require(_config.issuedAt != 0, "ISSUED_AT_CANNOT_BE_ZERO");
        require(_config.issuedAt <= block.timestamp, "INVALID_ISSUED_AT");

        require(_config.verifiedAt <= block.timestamp, "INVALID_VERIFIED_AT");
        require(block.timestamp <= _config.issuedAt + 1 days, "EXPIRED_ISSUED_AT");
        require(_config.attrKeys.length == _config.attrTypes.length, "MISMATCH_LENGTH");
        require(_config.attrKeys.length == _config.attrValues.length, "MISMATCH_LENGTH");

        // Verify signature
        bytes32 extractionHash = keccak256(
            abi.encode(
                _account,
                _config.attrKeys,
                _config.attrValues,
                _config.did,
                _config.verifiedAt,
                _config.issuedAt,
                _config.fee,
                block.chainid,
                address(this)
            )
        );
        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(extractionHash);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sigIssuer);

        bytes32 issuerMintHash = keccak256(abi.encode(extractionHash, issuer));

        require(IAccessControlUpgradeable(address(governance)).hasRole(ISSUER_ROLE, issuer), "INVALID_ISSUER");
        require(!_usedSigHashes[issuerMintHash], "SIGNATURE_ALREADY_USED");

        _usedSigHashes[issuerMintHash] = true;

        return issuer;
    }

    /// @notice Compute the attrKey for the mapping `_attributes`
    /// @param _account address of the wallet owner
    /// @param _attribute attribute type (ex: keccak256("COUNTRY"))
    /// @param _did DID of the passport (optional - could be pass as bytes32(0))
    function _computeAttrKey(address _account, bytes32 _attribute, bytes32 _did) internal view returns(bytes32) {
        if (governance.eligibleAttributes(_attribute)) {
            return keccak256(abi.encode(_account, _attribute));
        }
        if (governance.eligibleAttributesByDID(_attribute)){
            if(_did == bytes32(0)){
                Attribute[] memory dIDAttrs = _attributes[keccak256(abi.encode(_account, ATTRIBUTE_DID))];
                require(dIDAttrs.length > 0 && dIDAttrs[0].value != bytes32(0), "MISSING_DID");
                _did = dIDAttrs[0].value;

            }
            return keccak256(abi.encode(_did, _attribute));
        }

        revert("ATTRIBUTE_NOT_ELIGIBLE");
    }

    /// @notice Burn your Quadrata passport
    /// @dev Only owner of the passport
    function burnPassports() external override whenNotPaused {
        for (uint256 i = 0; i < governance.getEligibleAttributesLength(); i++) {
            bytes32 attributeType = governance.eligibleAttributesArray(i);

            bytes32 attrKey = keccak256(abi.encode(_msgSender(), attributeType));

            IQuadPassportStore.Attribute[] storage attrs = _attributes[attrKey];

            for(uint256 j = attrs.length; j > 0; j--){
                _position[keccak256(abi.encode(attrKey, attrs[j-1].issuer))] = 0;
                attrs.pop();
            }
        }

        // Revoke from AllowList
        _burnPassports(_msgSender());
        _manageAllowList(_msgSender());
    }

    /// @notice Issuer can burn an account's Quadrata passport when requested
    /// @dev Only issuer role
    /// @param _account address of the wallet to burn
    function burnPassportsIssuer(
        address _account
    ) external override whenNotPaused {
        require(IAccessControlUpgradeable(address(governance)).hasRole(ISSUER_ROLE, _msgSender()), "INVALID_ISSUER");

        bool isEmpty = true;

        // only delete attributes from issuer
        for (uint256 i = 0; i < governance.getEligibleAttributesLength(); i++) {
            bytes32 attributeType = governance.eligibleAttributesArray(i);
            bytes32 attrKey = keccak256(abi.encode(_account, attributeType));
            uint256 position = _position[keccak256(abi.encode(attrKey, _msgSender()))];
            Attribute[] storage attrs = _attributes[attrKey];
            if (position > 0) {

                // Swap last attribute position with position of attribute to delete before calling pop()
                Attribute memory attrToDelete = attrs[position-1];
                Attribute memory attrToSwap = attrs[attrs.length-1];

                _position[keccak256(abi.encode(attrKey, attrToSwap.issuer))] = position;
                _position[keccak256(abi.encode(attrKey, attrToDelete.issuer))] = 0;

                attrs[position-1] = attrToSwap;

                attrs.pop();

            }
            if (attrs.length > 0) {
                isEmpty = false;
            }
        }

        if (isEmpty)
            _burnPassports(_account);

        // Potentially revoke from AllowList
        _manageAllowList(_account);
        emit BurnPassportsIssuer(_msgSender(), _account);
    }

    /// @dev Loop through all eligible token ids and burn passports if they exist
    /// @param _account address of user
    function _burnPassports(address _account) internal {
        for (uint256 currTokenId = 1; currTokenId <= governance.getMaxEligibleTokenId(); currTokenId++){
            uint256 number = balanceOf(_account, currTokenId);
            if (number > 0){
                _burn(_account, currTokenId, number);
            }
        }
    }

    /// @dev Allow an authorized readers to get attribute information about a passport holder for a specific issuer
    /// @param _account address of user
    /// @param _attribute attribute to get respective value from
    /// @return value of attribute from issuer
    function attributes(
        address _account,
        bytes32 _attribute
    ) public view override returns (Attribute[] memory) {
        require(IAccessControlUpgradeable(address(governance)).hasRole(READER_ROLE, _msgSender()), "INVALID_READER");

        return _attributesInternal(_account, _attribute);
    }

    /// @dev Allow an authorized readers to get attribute information about a passport holder for a specific issuer
    /// @param _account address of user
    /// @param _attribute attribute to get respective value from
    /// @return value of attribute from issuer
    function _attributesInternal(
        address _account,
        bytes32 _attribute
    ) internal view returns (Attribute[] memory) {
        require(governance.eligibleAttributes(_attribute)
            || governance.eligibleAttributesByDID(_attribute),
            "ATTRIBUTE_NOT_ELIGIBLE"
        );
        bytes32 attrKey;
        if (governance.eligibleAttributes(_attribute)) {
            attrKey = keccak256(abi.encode(_account, _attribute));
        } else {
            Attribute[] memory dIDAttrs = _attributes[keccak256(abi.encode(_account, ATTRIBUTE_DID))];
            if (dIDAttrs.length == 0 || dIDAttrs[0].value == bytes32(0))
                return new Attribute[](0);
            attrKey = keccak256(abi.encode(dIDAttrs[0].value, _attribute));
        }

        return _attributes[attrKey];
    }

    /// @dev Admin function to set the new pending Governance address
    /// @notice Restricted behind a TimelockController
    /// @param _governanceContract contract address of IQuadGovernance
    function setGovernance(address _governanceContract) external override {
        require(_msgSender() == address(governance), "ONLY_GOVERNANCE_CONTRACT");
        require(_governanceContract != address(0), "GOVERNANCE_ADDRESS_ZERO");

        pendingGovernance = _governanceContract;
        emit SetPendingGovernance(pendingGovernance);
    }

    /// @dev Withdraw to an issuer's treasury
    /// @notice Restricted behind a TimelockController
    /// @param _to address an issuer's treasury
    /// @param _amount amount to withdraw
    function withdraw(address payable _to, uint256 _amount) external override whenNotPaused {
        require(
            IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, _msgSender()),
            "INVALID_ADMIN"
        );
        bool isValid = false;
        address issuer;

        address[] memory issuers = governance.getIssuers();
        for (uint256 i = 0; i < issuers.length; i++) {
            if (_to == governance.issuersTreasury(issuers[i])) {
                isValid = true;
                issuer = issuers[i];
                break;
            }
        }

        require(_to != address(0), "WITHDRAW_ADDRESS_ZERO");
        require(isValid, "WITHDRAWAL_ADDRESS_INVALID");
        require(_amount <= address(this).balance, "INSUFFICIENT_BALANCE");
        (bool sent,) = _to.call{value: _amount}("");
        require(sent, "FAILED_TO_TRANSFER_NATIVE_ETH");

        emit WithdrawEvent(issuer, _to, _amount);
    }

    /// @dev Admin function to accept and set the governance contract address
    /// @notice Restricted behind a TimelockController
    function acceptGovernance() external override {
        require(_msgSender() == pendingGovernance, "ONLY_PENDING_GOVERNANCE_CONTRACT");

        address oldGov = address(governance);
        governance = IQuadGovernance(pendingGovernance);
        pendingGovernance = address(0);

        emit GovernanceUpdated(oldGov, address(governance));
    }

    /// @dev Admin function to set Metadata URI to associate with a tokenId
    /// @param _tokenId Token Id
    /// @param _uri URI pointing to IPFS
    function setTokenURI(uint256 _tokenId, string memory _uri) external override {
        require(_msgSender() == address(governance), "ONLY_GOVERNANCE_CONTRACT");
        _setURI(_uri, _tokenId);
    }

    /// @dev Admin function to pause critical operations (emergency)
    function pause() external {
        require(
            IAccessControlUpgradeable(address(governance)).hasRole(PAUSER_ROLE, _msgSender()),
            "INVALID_PAUSER"
        );
        _pause();
    }

    /// @dev Admin function to unpause critical operations (emergency)
    function unpause() external {
        require(
            IAccessControlUpgradeable(address(governance)).hasRole(PAUSER_ROLE, _msgSender()),
            "INVALID_PAUSER"
        );
        _unpause();
    }

    /// @dev Retrieve the pause status of the contract
    function passportPaused() external view override returns(bool) {
        return paused();
    }

    function _authorizeUpgrade(address) internal view override {
        require(
            IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, _msgSender()),
            "INVALID_ADMIN"
        );
    }

    /// @dev Manage allow list based on passport holder higher AML risk scores
    /// @param _account address of the passport holder
    function _manageAllowList(address _account) internal {
        require(_account != address(this), "CANNOT_REVOKE_ALLOWLIST_QP");
        // Precompiled Allow List Contract Address
        //IAllowList allowList = IAllowList(0x0200000000000000000000000000000000000002);
        IAllowList allowList = IAllowList(0x5FbDB2315678afecb367f032d93F642f64180aa3); // Mock Deployment
        Attribute[] memory attributes = _attributesInternal(_account, ATTRIBUTE_AML);
        if (attributes.length == 0) {
            // Revoke from allow list
            allowList.setNone(_account);
            return;
        }

        uint256 maxAml = 1;
        for (uint256 i = 0; i < attributes.length; i++) {
            if (uint256(attributes[i].value) > maxAml)
                maxAml = uint256(attributes[i].value);

        }
        if (maxAml <= governance.getAllowListAMLThreshold())
            // Enable in allow list
            allowList.setEnabled(_account);
        else
            // Revoke from allow list
            allowList.setNone(_account);
    }
}
