//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "./QuadPassportStore.sol";

contract QuadPassport is ERC1155Upgradeable, OwnableUpgradeable, QuadPassportStore {
    event GovernanceUpdated(address _oldGovernance, address _governance);

    function initialize(
        address _governanceContract,
        string memory _uri
    ) public initializer {
        require(_governanceContract != address(0), "GOVERNANCE_ADDRESS_ZERO");
        __ERC1155_init(_uri);
        governance = QuadGovernance(_governanceContract);
    }

    function mintPassport(
        uint256 _tokenId,
        bytes32 _quadDID,
        bytes32 _aml,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable {
        require(msg.value == governance.mintPrice(), "INVALID_MINT_PRICE");
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(balanceOf(_msgSender(), _tokenId) == 0, "PASSPORT_ALREADY_EXISTS");

        bytes32 hash = _verifyIssuerMint(_msgSender(), _tokenId, _quadDID, _aml, _country, _issuedAt, _sig);

        _usedHashes[hash] = true;
        _validSignatures[_msgSender()][_tokenId] = _sig;
        _issuedEpoch[_msgSender()][_tokenId] = _issuedAt;
        _attributes[_msgSender()][keccak256("COUNTRY")] = Attribute({value: _country, epoch: _issuedAt});
        _attributes[_msgSender()][keccak256("DID")] = Attribute({value: _quadDID, epoch: _issuedAt});
        _attributesByDID[_quadDID][keccak256("AML")] = Attribute({value: _aml, epoch: _issuedAt});
        _mint(_msgSender(), _tokenId, 1, "");
    }

    function setAttribute(
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable {
        require(msg.value == governance.mintPricePerAttribute(_attribute), "INVALID_ATTR_MINT_PRICE");
        bytes32 hash = _verifyIssuerSetAttr(_msgSender(), _tokenId, _attribute, _value, _issuedAt, _sig);

        _usedHashes[hash] = true;
        _setAttributeInternal(_msgSender(), _tokenId, _attribute, _value, _issuedAt);
    }

    function setAttributeIssuer(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt
    ) external {
        require(governance.hasRole(ISSUER_ROLE, _msgSender()), "INVALID_ISSUER");

        _setAttributeInternal(_account, _tokenId, _attribute, _value, _issuedAt);
    }

    function _setAttributeInternal(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt
    ) internal {
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(balanceOf(_account, _tokenId) == 1, "PASSPORT_DOES_NOT_EXISTS");
        require(governance.eligibleAttributes(_attribute), "FIELD_NOT_ELIGIBLE");
        _attributes[_account][_attribute] = Attribute({value: _value, epoch: _issuedAt});
    }

    function setAttributeByDID(
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable {
        require(msg.value == governance.mintPricePerAttribute(_attribute), "INVALID_ATTR_MINT_PRICE");
        bytes32 hash = _verifyIssuerSetAttr(_msgSender(), _tokenId, _attribute, _value, _issuedAt, _sig);
        _usedHashes[hash] = true;

        _setAttributeByDIDInternal(_msgSender(), _tokenId, _attribute, _value, _issuedAt);
    }


    function setAttributeByDIDIssuer(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt
    ) external {
        require(governance.hasRole(ISSUER_ROLE, _msgSender()), "INVALID_ISSUER");

        _setAttributeByDIDInternal(_account, _tokenId, _attribute, _value, _issuedAt);
    }

    function _setAttributeByDIDInternal(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt
    ) internal {
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(balanceOf(_account, _tokenId) == 1, "PASSPORT_DOES_NOT_EXISTS");
        require(governance.eligibleAttributes(_attribute), "FIELD_NOT_ELIGIBLE");
        bytes32 dID = _attributes[_account][keccak256("DID")].value;
        require(dID != bytes32(0), "DID_NOT_FOUND");
        _attributesByDID[dID][_attribute] = Attribute({value: _value, epoch: _issuedAt});
    }

    // function linkNewPassport() external payable {

    // }

    function burnPassport(
        uint256 _tokenId
    ) external {
        require(balanceOf(_msgSender(), _tokenId) == 1, "CANNOT_BURN_ZERO_BALANCE");
        _burn(_msgSender(), _tokenId, 1);

        for (uint256 i = 0; i < governance.getSupportedAttributesLength(); i++) {
            bytes32 attributeType = governance.supportedAttributes(i);
            delete _attributes[_msgSender()][attributeType];
        }
    }

    function getAttribute(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    ) external view returns(Attribute memory) {
        require(governance.pricePerAttribute(_attribute) == 0, "ATTRIBUTE_IS_REQUIRING_PAYMENT");
        return _getAttribute(_account, _tokenId, _attribute);
    }

    function getAttributePayableETH(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    ) external payable returns(Attribute memory) {
        require(governance.pricePerAttribute(_attribute) == msg.value, "ATTRIBUTE_PAYMENT_INVALID");
        return _getAttribute(_account, _tokenId, _attribute);
    }

    function getBatchAttributes(
        address _account,
        uint256[] calldata _tokenIds,
        bytes32[] calldata _attributes
    ) external view returns(Attribute[] memory) {
        require(_tokenIds.length == _attributes.length, "BATCH_ATTRIBUTES_ERROR_LENGTH");
        Attribute[] memory attributeResults = new Attribute[](_attributes.length);

        for (uint256 i = 0; i < _tokenIds.length; i++) {
            require(governance.pricePerAttribute(_attributes[i]) == 0, "ATTRIBUTE_IS_REQUIRING_PAYMENT");
            Attribute memory attribute = _getAttribute(_account, _tokenIds[i], _attributes[i]);
            attributeResults[i] = attribute;
        }

        return attributeResults;
    }

    function getBatchAttributesPayableETH(
        address _account,
        uint256[] calldata _tokenIds,
        bytes32[] calldata _attributes
    ) external payable returns(Attribute[] memory) {
        require(_tokenIds.length == _attributes.length, "BATCH_ATTRIBUTES_ERROR_LENGTH");
        Attribute[] memory attributeResults = new Attribute[](_attributes.length);
        uint256 totalCost;

        for (uint256 i = 0; i < _tokenIds.length; i++) {
            Attribute memory attribute = _getAttribute(_account, _tokenIds[i], _attributes[i]);
            attributeResults[i] = attribute;
            totalCost += governance.pricePerAttribute(_attributes[i]);
        }
        require(msg.value == totalCost, "ATTRIBUTE_PAYMENT_INVALID");

        return attributeResults;
    }

    // TODO: Payment in native Token

    function _getAttribute(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    ) internal view returns(Attribute memory) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(balanceOf(_account, _tokenId) == 1, "PASSPORT_DOES_NOT_EXIST");
        require(governance.eligibleAttributes(_attribute), "FIELD_NOT_ELIGIBLE");

        return _attributes[_account][_attribute];
    }

    // TODO: Get Payable Attributes

    function getPassportSignature(
        uint256 _tokenId
    ) external view returns(bytes memory) {
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        return _validSignatures[_msgSender()][_tokenId];
    }

    function _verifyIssuerMint(
        address _account,
        uint256 _tokenId,
        bytes32 _quadDID,
        bytes32 _aml,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) internal view returns(bytes32){
        bytes32 hash = keccak256(abi.encode(_account, _tokenId, _quadDID, _aml, _country,  _issuedAt));
        require(!_usedHashes[hash], "SIGNATURE_ALREADY_USED");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(hash);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sig);
        require(governance.hasRole(ISSUER_ROLE, issuer), "INVALID_ISSUER");

        return hash;
    }

    function _verifyIssuerSetAttr(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) internal view returns(bytes32) {
        bytes32 hash = keccak256(abi.encode(_account, _tokenId, _attribute, _value, _issuedAt));
        require(!_usedHashes[hash], "SIGNATURE_ALREADY_USED");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(hash);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sig);
        require(governance.hasRole(ISSUER_ROLE, issuer), "INVALID_ISSUER");

        return hash;
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

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Admin function
    function setGovernance(address _governanceContract) external {
        require(_msgSender() == address(governance), "ONLY_GOVERNANCE_CONTRACT");
        require(_governanceContract != address(governance), "GOVERNANCE_ALREADY_SET");
        require(_governanceContract != address(0), "GOVERNANCE_ADDRESS_ZERO");
        address oldGov = address(governance);
        governance = QuadGovernance(_governanceContract);

        emit GovernanceUpdated(oldGov, address(governance));
    }
}

