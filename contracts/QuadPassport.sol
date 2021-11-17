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
        uint256 _id,
        bytes32 _quadDID,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable {
        require(msg.value == governance.mintPrice(), "INVALID_MINT_PRICE");
        require(governance.eligibleTokenId(_id), "PASSPORT_ID_INVALID");
        require(balanceOf(_msgSender(), _id) == 0, "PASSPORT_ALREADY_EXISTS");

        _verifyIssuerMint(_msgSender(), _id, _quadDID, _country, _issuedAt, _sig);

        _validSignatures[_msgSender()][_id] = _sig;
        _issuedEpoch[_msgSender()][_id] = _issuedAt;
        _attributes[_msgSender()][keccak256("COUNTRY")] = Attribute({value: _country, epoch: _issuedAt});
        _attributes[_msgSender()][keccak256("DID")] = Attribute({value: _quadDID, epoch: _issuedAt});
        _mint(_msgSender(), _id, 1, "");
    }

    function setAttribute(
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable {
        require(msg.value == governance.mintPricePerAttribute(_attribute), "INVALID_ATTR_MINT_PRICE");
        require(governance.eligibleAttributes(_attribute), "FIELD_NOT_ELIGIBLE");
        _verifyIssuerSetAttr(_msgSender(), _attribute, _value, _issuedAt, _sig);
        _attributes[_msgSender()][_attribute] = Attribute({value: _value, epoch: _issuedAt});
    }

    function setAttributeIssuer(
        address _account,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt
    ) external {
        require(governance.hasRole(ISSUER_ROLE, _msgSender()), "INVALID_ISSUER");
        require(governance.eligibleAttributes(_attribute), "FIELD_NOT_ELIGIBLE");
        _attributes[_account][_attribute] = Attribute({value: _value, epoch: _issuedAt});
    }

    // function linkNewPassport() external payable {

    // }

    function burnPassport(
        uint256 _id
    ) external {
        require(balanceOf(_msgSender(), _id) == 1, "CANNOT_BURN_ZERO_BALANCE");
        _burn(_msgSender(), _id, 1);

        for (uint256 i = 0; i < governance.getSupportedAttributesLength(); i++) {
            bytes32 attributeType = governance.supportedAttributes(i);
            delete _attributes[_msgSender()][attributeType];
        }
    }

    function getAttribute(
        address _account,
        uint256 _id,
        bytes32 _attribute
    ) external view returns(Attribute memory) {
        return _getAttribute(_account, _id, _attribute);
    }

    function _getAttribute(
        address _account,
        uint256 _id,
        bytes32 _attribute
    ) internal view returns(Attribute memory) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        require(governance.eligibleTokenId(_id), "PASSPORT_ID_INVALID");
        require(balanceOf(_account, _id) == 1, "PASSPORT_DOES_NOT_EXIST");
        require(governance.eligibleAttributes(_attribute), "FIELD_NOT_ELIGIBLE");
        require(governance.pricePerAttribute(_attribute) == 0, "ATTRIBUTE_IS_REQUIRING_PAYMENT");

        return _attributes[_account][_attribute];
    }

    function getBatchAttributes(
        address _account,
        uint256[] calldata _ids,
        bytes32[] calldata _attributeValues
    ) external view returns(Attribute[] memory) {
        require(_ids.length == _attributeValues.length, "BATCH_ATTRIBUTES_ERROR_LENGTH");
        Attribute[] memory attributes = new Attribute[](_attributeValues.length);

        for (uint256 i = 0; i < _ids.length; i++) {
            Attribute memory attribute = _getAttribute(_account, _ids[i], _attributeValues[i]);
            attributes[i] = attribute;
        }

        return attributes;
    }

    function getPassportSignature(
        uint256 _id
    ) external view returns(bytes memory) {
        require(governance.eligibleTokenId(_id), "PASSPORT_ID_INVALID");
        return _validSignatures[_msgSender()][_id];
    }

    function _verifyIssuerMint(
        address _account,
        uint256 _id,
        bytes32 _quadDID,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) internal view {
        bytes32 hash = keccak256(abi.encode(_account, _id, _quadDID, _country,  _issuedAt));
        require(_usedHashes[hash], "SIGNATURE_ALREADY_USED");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(hash);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sig);
        require(governance.hasRole(ISSUER_ROLE, issuer), "INVALID_ISSUER");
    }

    function _verifyIssuerSetAttr(
        address _account,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) internal view {
        bytes32 hash = keccak256(abi.encode(_account, _attribute, _value, _issuedAt));
        require(_usedHashes[hash], "SIGNATURE_ALREADY_USED");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(hash);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sig);
        require(governance.hasRole(ISSUER_ROLE, issuer), "INVALID_ISSUER");
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
    function setGovernance(address _governanceContract) external onlyOwner {
        require(_governanceContract != address(governance), "GOVERNANCE_ALREADY_SET");
        require(_governanceContract != address(0), "GOVERNANCE_ADDRESS_ZERO");
        address oldGov = address(governance);
        governance = QuadGovernance(_governanceContract);

        emit GovernanceUpdated(oldGov, address(governance));
    }
}

