//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "./interfaces/IQuadPassport.sol";
import "./interfaces/IQuadGovernance.sol";
import "./storage/QuadPassportStore.sol";
import "./QuadSoulbound.sol";
import "hardhat/console.sol";

/// @title Quadrata Web3 Identity Passport
/// @author Fabrice Cheng, Theodore Clapp
/// @notice This represents a Quadrata NFT Passport
contract QuadPassport is IQuadPassport, UUPSUpgradeable, QuadSoulbound, QuadPassportStore {

    constructor() initializer {
        // used to prevent logic contract self destruct take over
    }

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

    fallback() external payable {}

    /// @notice Set attributes for a Quadrata Passport (Only Individuals)
    /// @notice If passing a `DID` in _config.attrTypes, make sure that it's always first in the list
    /// @dev Only when authorized by an eligible issuer
    /// @param _config Input paramters required to set attributes
    /// @param _sigIssuer ECDSA signature computed by an eligible issuer to authorize the mint
    /// @param _sigAccount (Optional) ECDSA signature computed by an eligible EOA to authorize the mint
    function setAttributes(
        AttributeSetterConfig memory _config,
        bytes calldata _sigIssuer,
        bytes calldata _sigAccount
    ) external override payable {
        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(DIGEST_TO_SIGN);
        address account = ECDSAUpgradeable.recover(signedMsg, _sigAccount);

        _setAttributesInternal(account, _config, _sigIssuer);
    }


    /// @notice Set attributes for a Quadrata Passport (only by Issuers)
    /// @param _account Address of the Quadrata Passport holder
    /// @param _config Input paramters required to set attributes
    /// @param _sigIssuer ECDSA signature computed by an eligible issuer to authorize the action
    function setAttributesIssuer(
        address _account,
        AttributeSetterConfig memory _config,
        bytes calldata _sigIssuer
    ) external payable override {
        require(IAccessControlUpgradeable(address(governance)).hasRole(ISSUER_ROLE, _msgSender()), "INVALID_ISSUER");
        require(_account != address(0), "ACCOUNT_CANNOT_BE_ZERO");

        _setAttributesInternal(_account, _config, _sigIssuer);
    }

    /// @notice Internal function for `setAttributes` and `setAttributesIssuer`
    /// @param _account Address of the Quadrata Passport holder
    /// @param _config Input paramters required to set attributes
    /// @param _sigIssuer ECDSA signature computed by an eligible issuer to authorize the action
    function _setAttributesInternal(
        address _account,
        AttributeSetterConfig memory _config,
        bytes calldata _sigIssuer
    ) internal {
        address issuer = _setAttributesVerify(_account, _config, _sigIssuer);

        // Handle DID
        if(_config.did != bytes32(0)){
            _validateDid(_account, _config.did);
            _writeAttrToStorage(
                _computeAttrKey(_account, ATTRIBUTE_DID, _config.did),
                _config.did,
                issuer,
                _config.verifiedAt);
        }

        for (uint256 i = 0; i < _config.attrKeys.length; i++) {
            // Verify attrKeys computation
            _verifyAttrKey(_account, _config.attrTypes[i], _config.attrKeys[i], _config.did);
            _writeAttrToStorage(
                _config.attrKeys[i],
                _config.attrValues[i],
                issuer,
                _config.verifiedAt);
        }

        if(balanceOf(_account, _config.tokenId) == 0)
            _mint(_account, _config.tokenId, 1);
        emit SetAttributeReceipt(_account, issuer, msg.value);
    }

    /// @notice Internal function that validates supplied DID on updates do not change
    /// @param _account address of entity being attested to
    /// @param _did new DID value
    function _validateDid(address _account, bytes32 _did) internal {
        Attribute[] memory dIDAttrs = _attributes[keccak256(abi.encode(_account, ATTRIBUTE_DID))];
        if(dIDAttrs.length > 0){
            require(dIDAttrs[0].value == _did, "CANNOT_OVERWRITE_DID");
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
            _attributes[_attrKey][issuerPosition] = attr;
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
        require(msg.value == _config.fee,  "INVALID_SET_ATTRIBUTE_FEE");
        require(governance.eligibleTokenId(_config.tokenId), "PASSPORT_TOKENID_INVALID");
        require(_config.verifiedAt != 0, "VERIFIED_AT_CANNOT_BE_ZERO");
        require(_config.issuedAt != 0, "ISSUED_AT_CANNOT_BE_ZERO");

        require(_config.verifiedAt <= block.timestamp, "INVALID_VERIFIED_AT");
        require(block.timestamp <= _config.issuedAt + 1 days, "EXPIRED_ISSUED_AT");
        require(_config.attrKeys.length == _config.attrValues.length, "MISMATCH_LENGTH");
        require(_config.attrKeys.length == _config.attrTypes.length, "MISMATCH_LENGTH");

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
                _config.tokenId,
                block.chainid
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

        require(false, "ATTRIBUTE_NOT_ELIGIBLE");
    }

    /// @notice Burn your Quadrata passport
    /// @dev Only owner of the passport
    /// @param _tokenId tokenId of the Passport (1 for now)
    function burnPassport(
        uint256 _tokenId
    ) external override {
        require(balanceOf(_msgSender(), _tokenId) >= 1, "CANNOT_BURN_ZERO_BALANCE");

        for (uint256 i = 0; i < governance.getEligibleAttributesLength(); i++) {
            bytes32 attributeType = governance.eligibleAttributesArray(i);
            delete _attributes[keccak256(abi.encode(_msgSender(), attributeType))];

            // TODO: Remove positions from _position
        }

        _burn(_msgSender(), _tokenId, 1);
    }

    /// @notice Issuer can burn an account's Quadrata passport when requested
    /// @dev Only issuer role
    /// @param _account address of the wallet to burn
    /// @param _tokenId tokenId of the Passport (1 for now)
    function burnPassportIssuer(
        address _account,
        uint256 _tokenId
    ) external override {
        require(IAccessControlUpgradeable(address(governance)).hasRole(ISSUER_ROLE, _msgSender()), "INVALID_ISSUER");
        require(balanceOf(_account, _tokenId) == 1, "CANNOT_BURN_ZERO_BALANCE");

        bool isEmpty = true;

        // only delete attributes from issuer
        for (uint256 i = 0; i < governance.getEligibleAttributesLength(); i++) {
            bytes32 attributeType = governance.eligibleAttributesArray(i);
            uint256 position = _position[keccak256(abi.encode(keccak256(abi.encode(_account, attributeType)), _msgSender()))];
            if (position > 0) {
                Attribute[] memory attrs = _attributes[keccak256(abi.encode(_account, attributeType))];
                attrs[position] = attrs[attrs.length - 1];
                // TODO: Figure out why error message
                // attrs.pop();

                // TODO: Reset positions from _position

                if (attrs.length > 0) {
                    isEmpty = false;
                }
            }
        }
        if (isEmpty)
            _burn(_account, _tokenId, 1);
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

        bytes32 attrKey = _computeAttrKey(_account, _attribute, bytes32(0));
        return _attributes[attrKey];
    }

    /// @dev Admin function to set the new pending Governance address
    /// @param _governanceContract contract address of IQuadGovernance
    function setGovernance(address _governanceContract) external override {
        require(_msgSender() == address(governance), "ONLY_GOVERNANCE_CONTRACT");
        require(_governanceContract != address(0), "GOVERNANCE_ADDRESS_ZERO");

        pendingGovernance = _governanceContract;
        emit SetPendingGovernance(pendingGovernance);
    }

    /// @dev Admin function to accept and set the governance contract address
    function acceptGovernance() external override {
        require(_msgSender() == pendingGovernance, "ONLY_PENDING_GOVERNANCE_CONTRACT");

        address oldGov = address(governance);
        governance = IQuadGovernance(pendingGovernance);
        pendingGovernance = address(0);

        emit GovernanceUpdated(oldGov, address(governance));
    }

    function _authorizeUpgrade(address) internal view override {
        require(
            IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, _msgSender()),
            "INVALID_ADMIN"
        );
    }
}

