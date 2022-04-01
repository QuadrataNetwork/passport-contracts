//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;


import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "./ERC1155/ERC1155Upgradeable.sol";
import "./QuadPassportStore.sol";
import "./interfaces/IQuadPassport.sol";

/// @title Quadrata Web3 Identity Passport
/// @author Fabrice Cheng
/// @notice This represents wallet accounts Web3 Passport
/// @dev Passport extended the ERC1155 standard with restrictions on transfers
contract QuadPassport is IQuadPassport, ERC1155Upgradeable, UUPSUpgradeable, QuadPassportStore {
    event GovernanceUpdated(address _oldGovernance, address _governance);

    /// @dev initializer (constructor)
    /// @param _governanceContract address of the QuadGovernance contract
    /// @param _uri URI of the Quadrata Passport
    function initialize(
        address _governanceContract,
        string memory _uri
    ) public initializer {
        require(_governanceContract != address(0), "GOVERNANCE_ADDRESS_ZERO");
        __ERC1155_init(_uri);
        governance = QuadGovernance(_governanceContract);
    }

    /// @dev Overwitten to prevent reverts when a contract is missing `onERC1155BatchReceived` and receiving a passport
    function _doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {}

    /// @dev Overwitten to prevent reverts when a contract is missing `onERC1155Received` and receiving a passport
    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override {}


    /// @notice Claim and mint a wallet account Quadrata Passport
    /// @dev Only when authorized by an eligible issuer
    /// @param _account EOA/Contract to mint the passport
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _quadDID Quadrata Decentralized Identity (raw value)
    /// @param _aml keccak256 of the AML status value
    /// @param _country keccak256 of the country value
    /// @param _isBusiness flag identifying if a wallet is a business or individual
    /// @param _issuedAt epoch when the passport has been issued by the Issuer
    /// @param _sig ECDSA signature computed by an eligible issuer to authorize the mint
    function mintPassport(
        address _account,
        uint256 _tokenId,
        bytes32 _quadDID,
        bytes32 _aml,
        bytes32 _country,
        bytes32 _isBusiness,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable override {
        require(msg.value == governance.mintPrice(), "INVALID_MINT_PRICE");
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");

        if(_isBusiness == keccak256("FALSE"))
            require(_account.code.length == 0, "NON-BUSINESS_MUST_BE_EOA");

        (bytes32 hash, address issuer) = _verifyIssuerMint(_account, _tokenId, _quadDID, _aml, _country,_isBusiness, _issuedAt, _sig);

        _accountBalancesETH[governance.issuersTreasury(issuer)] += governance.mintPrice();
        _usedHashes[hash] = true;
        _validSignatures[_msgSender()][_tokenId] = _sig;
        _issuedEpoch[_msgSender()][_tokenId] = _issuedAt;
        _attributes[_msgSender()][keccak256("COUNTRY")][issuer] = Attribute({value: _country, epoch: _issuedAt, issuer: issuer});
        _attributes[_msgSender()][keccak256("DID")][issuer] = Attribute({value: _quadDID, epoch: _issuedAt, issuer: issuer});
        _attributesByDID[_quadDID][keccak256("AML")][issuer] = Attribute({value: _aml, epoch: _issuedAt, issuer: issuer});

        if(balanceOf(_msgSender(), _tokenId) == 0)
            _mint(_msgSender(), _tokenId, 1, "");
    }

    /// @notice Update or set a new attribute for your existing passport
    /// @dev Only when authorized by an eligible issuer
    /// @param _account the account to be updated
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _value keccak256 of the value of the attribute (ex: keccak256("FRANCE"))
    /// @param _issuedAt epoch when the operation has been authorized by the Issuer
    /// @param _sig ECDSA signature computed by an eligible issuer to authorize the operation
    function setAttribute(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable override {
        require(msg.value == governance.mintPricePerAttribute(_attribute), "INVALID_ATTR_MINT_PRICE");
        (bytes32 hash, address issuer) = _verifyIssuerSetAttr(_msgSender(), _tokenId, _attribute, _value, _issuedAt, _sig);
        _accountBalancesETH[governance.issuersTreasury(issuer)] += governance.mintPricePerAttribute(_attribute);
        _usedHashes[hash] = true;
        _setAttributeInternal(_account, _tokenId, _attribute, _value, _issuedAt, issuer);
    }

    /// @notice (only Issuer) Update or set a new attribute for an existing passport
    /// @dev Only issuer role
    /// @param _account address of the wallet to update
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _value keccak256 of the value of the attribute (ex: keccak256("FRANCE"))
    /// @param _issuedAt epoch when the operation has been authorized by the Issuer
    function setAttributeIssuer(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt
    ) external override {
        require(governance.hasRole(ISSUER_ROLE, _msgSender()), "INVALID_ISSUER");
        _setAttributeInternal(_account, _tokenId, _attribute, _value, _issuedAt, _msgSender());
    }

    function _setAttributeInternal(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        address _issuer
    ) internal {
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(balanceOf(_account, _tokenId) == 1, "PASSPORT_DOES_NOT_EXIST");
        require(_attribute != keccak256("DID"), "MUST_BURN_AND_MINT");
        require(governance.eligibleAttributes(_attribute)
            || governance.eligibleAttributesByDID(_attribute),
            "ATTRIBUTE_NOT_ELIGIBLE"
        );

        if (governance.eligibleAttributes(_attribute)) {
            _attributes[_account][_attribute][_issuer] = Attribute({
                value: _value,
                epoch: _issuedAt,
                issuer: _issuer
            });
        } else {
            // Attribute grouped by DID
            bytes32 dID = _attributes[_account][keccak256("DID")][_issuer].value;
            require(dID != bytes32(0), "DID_NOT_FOUND");
            _attributesByDID[dID][_attribute][_issuer] = Attribute({
                value: _value,
                epoch: _issuedAt,
                issuer: _issuer
            });
        }
    }

    /// @notice Burn your Quadrata passport
    /// @dev Only owner of the passport
    /// @param _tokenId tokenId of the Passport (1 for now)
    function burnPassport(
        uint256 _tokenId
    ) external override {
        require(balanceOf(_msgSender(), _tokenId) == 1, "CANNOT_BURN_ZERO_BALANCE");
        _burn(_msgSender(), _tokenId, 1);

        for (uint256 i = 0; i < governance.getSupportedAttributesLength(); i++) {
            for(uint256 j = 1; j < governance.getIssuersLength(); j++) {
                bytes32 attributeType = governance.supportedAttributes(i);
                delete _attributes[_msgSender()][attributeType][governance.issuers(j)];
            }
        }
    }

    /// @notice Issuer can burn an account's Quadrata passport when requested
    /// @dev Only issuer role
    /// @param _account address of the wallet to burn
    /// @param _tokenId tokenId of the Passport (1 for now)
    function burnPassportIssuer(
        address _account,
        uint256 _tokenId
    ) external override {
        require(governance.hasRole(ISSUER_ROLE, _msgSender()), "INVALID_ISSUER");
        require(balanceOf(_account, _tokenId) == 1, "CANNOT_BURN_ZERO_BALANCE");
        _burn(_account, _tokenId, 1);

        // TODO: Just delete attributes issued from sender
        // TODO: Only call _burn if all attribute are default value
        for (uint256 i = 0; i < governance.getSupportedAttributesLength(); i++) {
            for(uint256 j = 1; j < governance.getIssuersLength(); j++) {
                bytes32 attributeType = governance.supportedAttributes(i);
                delete _attributes[_msgSender()][attributeType][governance.issuers(j)];
            }
        }
    }

    /// @notice Query the value of an attribute for a passport holder (pay with ETH)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @return the value of the attribute
    function getAttributeETH(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    ) external payable override returns(bytes32, uint256) {
        Attribute memory attribute = _getAttributeInternal(_account, _tokenId, _attribute, governance.issuers(0));
        _doETHPayment(_attribute, attribute.issuer, _account);
        return (attribute.value, attribute.epoch);
    }

    /// @notice Query the value of an attribute for a passport holder (free)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @return the value of the attribute
    function getAttributeFree(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    ) external view override returns(bytes32, uint256) {
        require(governance.pricePerAttribute(_attribute) == 0, "ATTRIBUTE_NOT_FREE");
        Attribute memory attribute = _getAttributeInternal(_account, _tokenId, _attribute, governance.issuers(0));
        return (attribute.value, attribute.epoch);
    }

    /// @notice Query the value of an attribute for a passport holder (payable with ERC20)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenAddr address of the ERC20 token to use as a payment
    /// @return the value of the attribute
    function getAttribute(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr
    ) external override returns(bytes32, uint256) {
        Attribute memory attribute = _getAttributeInternal(_account, _tokenId, _attribute,governance.issuers(0));
        _doTokenPayment(_attribute, _tokenAddr, attribute.issuer, _account);
        return (attribute.value, attribute.epoch);
    }

    function getAttributes(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr,
        address[] calldata _exclusions
    ) external returns(bytes32[] memory, uint256[] memory, address[] memory) {
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _getAttributesInternal(_account, _tokenId, _attribute, _exclusions);

        return (attributes, epochs, issuers);
    }

    function _hasIssuer(
        address issuer,
        address[] memory issuers
    ) internal pure returns(bool) {
        for(uint256 i = 0; i < issuers.length; i++) {
            if(issuer == issuers[i])
                return true;
        }
        return false;
    }

    function _hasValidAttribute(
        bytes32[] memory attributes
    ) internal pure returns(bool) {
        for(uint256 i = 0; i < attributes.length; i++) {
            if(attributes[i] != bytes32(0))
                return true;
        }
        return false;
    }

    function _getIncludedIssuers(
        address[] calldata _exclusions
    ) internal view returns(address[] memory) {
        address[] memory issuers  = new address[](governance.getIssuersLength());

        uint256 continuations = 0;
        for(uint256 i = 0; i < governance.getIssuersLength(); i++) {
            if(_hasIssuer(governance.issuers(i), _exclusions)) {
                continuations++;
                continue;
            }

            issuers[i] = governance.issuers(i);
        }

        // close the gap(s)
        uint256 newLength = governance.getIssuersLength() - continuations;

        address[] memory newIssuers  = new address[](newLength);
        uint256 formattedIndex = 0;
        for(uint256 i = 0; i < issuers.length; i++) {
            if(issuers[i] == address(0)){
                continue;
            }

            newIssuers[formattedIndex++] = issuers[i];
        }



        return issuers;
    }

    function _filterAttributes(
        address _account,
        bytes32 _attribute,
        address[] calldata _exclusions,
        bool groupByDID
    ) internal view returns (bytes32[] memory, uint256[] memory, address[] memory) {
        (address[] memory issuers)  = _getIncludedIssuers(_exclusions);

        bytes32[] memory attributes = new bytes32[](issuers.length);
        uint256[] memory epochs = new uint256[](issuers.length);

        Attribute memory attribute;

        for(uint256 i = 0; i < issuers.length; i++) {
            if(groupByDID) {
                bytes32 dID = _attributes[_account][keccak256("DID")][issuers[i]].value;
                if(dID != bytes32(0)) {
                    continue;
                }

                attribute = _attributesByDID[dID][_attribute][issuers[i]];
                attributes[i] = attribute.value;
                epochs[i] = attribute.epoch;
                continue;
            }


            attribute =_attributes[_account][_attribute][issuers[i]];
            attributes[i] = attribute.value;
            epochs[i] = attribute.epoch;
        }

        if(groupByDID) {
            require(_hasValidAttribute(attributes), "DIDS_NOT_FOUND");
        }

        return (
            attributes,
            epochs,
            issuers
        );
    }

    function _getAttributesInternal(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _exclusions
    ) internal view returns(bytes32[] memory, uint256[] memory, address[] memory) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(balanceOf(_account, _tokenId) == 1, "PASSPORT_DOES_NOT_EXIST");
        require(governance.eligibleAttributes(_attribute)
            || governance.eligibleAttributesByDID(_attribute),
            "ATTRIBUTE_NOT_ELIGIBLE"

        );


        if (governance.eligibleAttributes(_attribute)) {
            return _filterAttributes(_account, _attribute, _exclusions,false);
        }

        // Attribute grouped by DID
        return _filterAttributes(_account, _attribute, _exclusions, true);

    }

    function _getAttributeInternal(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _issuer
    ) internal view returns(Attribute memory) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(balanceOf(_account, _tokenId) == 1, "PASSPORT_DOES_NOT_EXIST");
        require(governance.eligibleAttributes(_attribute)
            || governance.eligibleAttributesByDID(_attribute),
            "ATTRIBUTE_NOT_ELIGIBLE"

        );
        if (governance.eligibleAttributes(_attribute)) {
            return _attributes[_account][_attribute][_issuer];
        }

        // Attribute grouped by DID
        bytes32 dID = _attributes[_account][keccak256("DID")][_issuer].value;
        require(dID != bytes32(0), "DID_NOT_FOUND");
        return _attributesByDID[dID][_attribute][_issuer];
    }

    /// @dev Retrieve a signature for an existing passport minted (to be used across chain)
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @return the signaure allowing the mint of the passport
    function getPassportSignature(
        uint256 _tokenId
    ) external view override returns(bytes memory) {
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        return _validSignatures[_msgSender()][_tokenId];
    }

    function _verifyIssuerMint(
        address _account,
        uint256 _tokenId,
        bytes32 _quadDID,
        bytes32 _aml,
        bytes32 _country,
        bytes32 _isBusiness,
        uint256 _issuedAt,
        bytes calldata _sig
    ) internal view returns(bytes32,address){
        bytes32 hash = keccak256(abi.encode(_account, _tokenId, _quadDID, _aml, _country, _isBusiness, _issuedAt));

        require(!_usedHashes[hash], "SIGNATURE_ALREADY_USED");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(hash);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sig);
        require(governance.hasRole(ISSUER_ROLE, issuer), "INVALID_ISSUER");

        return (hash, issuer);
    }

    function _verifyIssuerSetAttr(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) internal view returns(bytes32,address) {
        bytes32 hash = keccak256(abi.encode(_account, _tokenId, _attribute, _value, _issuedAt));

        require(!_usedHashes[hash], "SIGNATURE_ALREADY_USED");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(hash);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sig);
        require(governance.hasRole(ISSUER_ROLE, issuer), "INVALID_ISSUER");

        return (hash, issuer);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155Upgradeable) {
    require(
        (from == address(0) && to != address(0))
        || (from != address(0) && to == address(0)),
        "ONLY_MINT_OR_BURN_ALLOWED"
    );
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Upgradeable, IERC165Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _doETHPayment(
        bytes32 _attribute,
        address _issuer,
        address _account
    ) internal {
        uint256 amountETH = calculatePaymentETH(_attribute, _account);
        if (amountETH > 0) {
            require(
                 msg.value == amountETH,
                "INSUFFICIENT_PAYMENT_AMOUNT"
            );
            uint256 amountIssuer = amountETH * governance.revSplitIssuer() / 1e2;
            uint256 amountProtocol = amountETH - amountIssuer;
            _accountBalancesETH[governance.issuersTreasury(_issuer)] += amountIssuer;
            _accountBalancesETH[governance.treasury()] += amountProtocol;
        }
    }

    function _doTokenPayment(
        bytes32 _attribute,
        address _tokenPayment,
        address _issuer,
        address _account
    ) internal {
        uint256 amountToken = calculatePaymentToken(_attribute, _tokenPayment, _account);
        if (amountToken > 0) {
            IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_tokenPayment);
            require(
                erc20.transferFrom(_msgSender(), address(this), amountToken),
                "INSUFFICIENT_PAYMENT_ALLOWANCE"
            );
            uint256 amountIssuer = amountToken * governance.revSplitIssuer() / 10 ** 2;
            uint256 amountProtocol = amountToken - amountIssuer;
            _accountBalances[_tokenPayment][governance.issuersTreasury(_issuer)] += amountIssuer;
            _accountBalances[_tokenPayment][governance.treasury()] += amountProtocol;
        }
    }

    /// @dev Allow an issuer's treasury or the Quadrata treasury to withdraw $ETH
    /// @param _to address of either an issuer's treasury or the Quadrata treasury
    /// @return the amount of $ETH withdrawn
    function withdrawETH(address payable _to) external override returns(uint256) {
       require(_to != address(0), "WITHDRAW_ADDRESS_ZERO");
       uint256 currentBalance = _accountBalancesETH[_to];
       require(currentBalance > 0, "NOT_ENOUGH_BALANCE");
       _accountBalancesETH[_to] = 0;
       require(_to.send(currentBalance), "FAILED_TO_TRANSFER_NATIVE_ETH");
       return currentBalance;
    }

    /// @dev Allow an issuer's treasury or the Quadrata treasury to withdraw ERC20 tokens
    /// @param _to address of either an issuer's treasury or the Quadrata treasury
    /// @param _token address of the ERC20 tokens to withdraw
    /// @return the amount of ERC20 withdrawn
    function withdrawToken(address payable _to, address _token) external override returns(uint256) {
       require(_to != address(0), "WITHDRAW_ADDRESS_ZERO");
       uint256 currentBalance = _accountBalances[_token][_to];
       require(currentBalance > 0, "NOT_ENOUGH_BALANCE");
       _accountBalances[_token][_to] = 0;
        IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_token);
       require(erc20.transfer(_to, currentBalance), "FAILED_TO_TRANSFER_ERC_20");
       return currentBalance;
    }

    /// @dev Calculate the amount of token required to call `getAttribute`
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _tokenPayment address of the ERC20 tokens to use as payment
    /// @param _account account getting requested for attributes
    /// @return the amount of ERC20 necessary to query the attribute
    function calculatePaymentToken(
        bytes32 _attribute,
        address _tokenPayment,
        address _account
    ) public view override returns(uint256) {
        IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_tokenPayment);
        uint256 tokenPrice = governance.getPrice(_tokenPayment);
        // TODO: Do we always  want to get IS_BUSINESS from Spring Labs?
        uint256 price = _attributes[_account][keccak256("IS_BUSINESS")][governance.issuers(0)].value == keccak256("TRUE") ? governance.pricePerBusinessAttribute(_attribute) : governance.pricePerAttribute(_attribute);
        // Convert to Token Decimal
        uint256 amountToken = (price * (10 ** (erc20.decimals())) / tokenPrice) ;
        return amountToken;
    }

    /// @dev Calculate the amount of $ETH required to call `getAttributeETH`
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _account account getting requested for attributes
    /// @return the amount of $ETH necessary to query the attribute
    function calculatePaymentETH(
        bytes32 _attribute,
        address _account
    ) public view override returns(uint256) {
        uint256 tokenPrice = governance.getPriceETH();
        // TODO: Do we always  want to get IS_BUSINESS from Spring Labs?
        uint256 price = _attributes[_account][keccak256("IS_BUSINESS")][governance.issuers(0)].value == keccak256("TRUE") ? governance.pricePerBusinessAttribute(_attribute) : governance.pricePerAttribute(_attribute);
        uint256 amountETH = (price * 1e18 / tokenPrice) ;
        return amountETH;
    }

    /// @dev Admin function to set the address of the QuadGovernance contract
    /// @param _governanceContract contract address of QuadGovernance
    function setGovernance(address _governanceContract) external override {
        require(_msgSender() == address(governance), "ONLY_GOVERNANCE_CONTRACT");
        require(_governanceContract != address(governance), "GOVERNANCE_ALREADY_SET");
        require(_governanceContract != address(0), "GOVERNANCE_ADDRESS_ZERO");
        address oldGov = address(governance);
        governance = QuadGovernance(_governanceContract);

        emit GovernanceUpdated(oldGov, address(governance));
    }

    function _authorizeUpgrade(address) internal view override {
        require(governance.hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
    }
}

