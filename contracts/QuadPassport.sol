//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "./interfaces/IQuadPassport.sol";
import "./interfaces/IQuadGovernance.sol";
import "./storage/QuadGovernanceStore.sol";
import "./storage/QuadPassportStore.sol";
import "./QuadSoulbound.sol";
import "hardhat/console.sol";

/// @title Quadrata Web3 Identity Passport
/// @author Fabrice Cheng, Theodore Clapp
/// @notice This represents a Quadrata NFT Passport
contract QuadPassport is IQuadPassport, UUPSUpgradeable, QuadSoulbound, QuadPassportStore {
    event GovernanceUpdated(address indexed _oldGovernance, address indexed _governance);
    event SetPendingGovernance(address indexed _pendingGovernance);
    event SetAttributeReceipt(address indexed _account, address indexed _issuer, uint256 _fee);

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
        for (uint256 i = 0; i < _config.attrKeys.length; i++) {
            uint256 issuerPosition = _position[keccak256(abi.encode(_config.attrKeys[i], issuer))];
            Attribute memory attr = Attribute({
                value: _config.attrValues[i],
                epoch: _config.issuedAt,
                issuer: issuer
            });

            if (issuerPosition == 0) {
            // Means the issuer hasn't yet attested to that attribute type
                _attributes[_config.attrKeys[i]].push(attr);
                _position[keccak256(abi.encode(_config.attrKeys[i], issuer))] = _attributes[_config.attrKeys[i]].length;
            } else {
                // Issuer already attested to that attribute - override
                _attributes[_config.attrKeys[i]][issuerPosition] = attr;
            }
        }

        if(balanceOf(_account, _config.tokenId) == 0)
            _mint(_account, _config.tokenId, 1);
        emit SetAttributeReceipt(_account, issuer, msg.value);
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
        require(_config.issuedAt != 0, "ISSUED_AT_CANNOT_BE_ZERO");
        require(_config.issuedAt <= block.timestamp, "INVALID_ISSUED_AT");
        require(_config.attrKeys.length == _config.attrValues.length, "MISMATCH_LENGTH");

        bytes32 extractionHash = keccak256(
            abi.encode(
                _account,
                _config.attrKeys,
                _config.attrValues,
                _config.issuedAt,
                _config.fee,
                _config.tokenId,
                block.chainid
            )
        );
        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(extractionHash);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sigIssuer);
        bytes32 issuerMintHash = keccak256(abi.encode(extractionHash, issuer));

        require(!_usedSigHashes[issuerMintHash], "SIGNATURE_ALREADY_USED");
        require(IAccessControlUpgradeable(address(governance)).hasRole(ISSUER_ROLE, issuer), "INVALID_ISSUER");

        _usedSigHashes[issuerMintHash] = true;

        return issuer;
    }

    /// @notice Burn your Quadrata passport
    /// @dev Only owner of the passport
    /// @param _tokenId tokenId of the Passport (1 for now)
    function burnPassport(
        uint256 _tokenId
    ) external override {
        // require(balanceOf(_msgSender(), _tokenId) == 1, "CANNOT_BURN_ZERO_BALANCE");
        // _burn(_msgSender(), _tokenId, 1);

        // for (uint256 i = 0; i < governance.getEligibleAttributesLength(); i++) {
        //     bytes32 attributeType = governance.eligibleAttributesArray(i);
        //     for(uint256 j = 0; j < governance.getIssuersLength(); j++) {
        //         delete _attributes[_msgSender()][attributeType][governance.issuers(j).issuer];
        //     }
        // }
    }

    /// @notice Issuer can burn an account's Quadrata passport when requested
    /// @dev Only issuer role
    /// @param _account address of the wallet to burn
    /// @param _tokenId tokenId of the Passport (1 for now)
    function burnPassportIssuer(
        address _account,
        uint256 _tokenId
    ) external override {
        // require(IAccessControlUpgradeable(address(governance)).hasRole(ISSUER_ROLE, _msgSender()), "INVALID_ISSUER");
        // require(balanceOf(_account, _tokenId) == 1, "CANNOT_BURN_ZERO_BALANCE");

        // // only delete attributes from sender
        // for (uint256 i = 0; i < governance.getEligibleAttributesLength(); i++) {
        //     bytes32 attributeType = governance.eligibleAttributesArray(i);
        //     delete _attributes[_account][attributeType][_msgSender()];
        // }

        // // if another attribute is found, keep the passport, otherwise burn if all values are null
        // for (uint256 i = 0; i < governance.getEligibleAttributesLength(); i++) {
        //     bytes32 attributeType = governance.eligibleAttributesArray(i);
        //     for(uint256 j = 0; j < governance.getIssuersLength(); j++) {
        //         Attribute memory attribute = _attributes[_account][attributeType][governance.issuers(j).issuer];
        //         if(attribute.epoch != 0) {
        //             return;
        //         }
        //     }
        // }

        // _burn(_account, _tokenId, 1);
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

        bytes32 attrKey;
        if (governance.eligibleAttributes(_attribute)) {
            attrKey = keccak256(abi.encode(_account, _attribute));
        } else {
            Attribute[] memory dIDAttrs = _attributes[keccak256(abi.encode(_account, ATTRIBUTE_DID))];
            if (dIDAttrs.length == 0)
                return new Attribute[](0);
            attrKey = keccak256(abi.encode(dIDAttrs[0].value, _attribute));
        }
        return _attributes[attrKey];
    }

    /// @dev Allow an issuer's treasury or the Quadrata treasury to withdraw $ETH
    /// @param _to address of either an issuer's treasury or the Quadrata treasury
    /// @return the amount of $ETH withdrawn
    function withdraw(address payable _to) external override returns(uint256) {
       // require(_to != address(0), "WITHDRAW_ADDRESS_ZERO");
       // uint256 currentBalance = _accountBalances[_to];
       // require(currentBalance > 0, "NOT_ENOUGH_BALANCE");
       // _accountBalances[_to] = 0;
       // (bool sent,) = _to.call{value: currentBalance}("");
       // require(sent, "FAILED_TO_TRANSFER_NATIVE_ETH");
       // return currentBalance;
    }

    /// @dev Allow an issuer's treasury or the Quadrata treasury to withdraw ERC20 tokens
    /// @param _to address of either an issuer's treasury or the Quadrata treasury
    /// @param _token address of the ERC20 tokens to withdraw
    /// @return the amount of ERC20 withdrawn
    function withdrawToken(address payable _to, address _token) external override returns(uint256) {
       // require(_to != address(0), "WITHDRAW_ADDRESS_ZERO");
       // uint256 currentBalance = _accountBalancesToken[_token][_to];
       // require(currentBalance > 0, "NOT_ENOUGH_BALANCE");
       // _accountBalancesToken[_token][_to] = 0;
       //  IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_token);
       // erc20.safeTransfer(_to, currentBalance);
       // return currentBalance;
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
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
    }
}

