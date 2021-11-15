//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IQuadPassport.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract QuadPassport is IQuadPassport, ERC1155Upgradeable, AccessControlUpgradeable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    uint256 public passportVersion = 1;

    uint256 public mintPrice = 0.03 ether;
    mapping(bytes32 => bool) private _usedHashes;

    // Admin Functions
    mapping(uint256 => bool) public eligibleTokenId;
    mapping(bytes32 => bool) public eligibleAttributes;
    // Price in $USD (1e2 decimals)
    mapping(bytes32 => uint256) public pricePerAttribute;
    bytes32[] public supportedAttributes;

    // Passport attributes
    mapping(address => mapping(uint256 => bytes)) private _validSignatures;
    mapping(bytes32 => mapping(address => bytes32)) private _attributes;
    mapping(bytes32 => mapping(address => uint256)) private _attributesUint;


    function initialize(address governance) public initializer {
        require(governance != address(0), "GOVERNANCE_ADDRESS_ZERO");

        eligibleTokenId[1] = true;   // INITIAL PASSPORT_ID
        _setupRole(GOVERNANCE_ROLE, governance);
        _setRoleAdmin(GOVERNANCE_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(PAUSER_ROLE, GOVERNANCE_ROLE);
        _setRoleAdmin(ISSUER_ROLE, GOVERNANCE_ROLE);
    }

    function mintPassport(
        uint256 _id,
        bytes32 _quadId,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable {
        require(msg.value == mintPrice, "INVALID_MINT_PRICE");
        require(eligibleTokenId[_id], "PASSPORT_ID_INVALID");
        require(balanceOf(_msgSender(), _id) == 0, "PASSPORT_ALREADY_EXISTS");

        _verifyIssuer(_msgSender(), _id, _quadId, _country, _issuedAt, _sig);

        _validSignatures[_msgSender()][_id] = _sig;
        _attributes[keccak256("COUNTRY")][_msgSender()] = _country;
        _attributes[keccak256("DID")][_msgSender()] = _quadId;
        _attributesUint[keccak256("ISSUED_TIMESTAMP")][_msgSender()] = _issuedAt;
        _mint(_msgSender(), _id, 1, "");
    }

    // function linkNewPassport() external payable {

    // }

    function burnPassport(
        uint256 _id
    ) external {
        require(balanceOf(_msgSender(), _id) == 1, "CANNOT_BURN_ZERO_BALANCE");
        _burn(_msgSender(), _id, 1);

        for (uint256 i = 0; i < supportedAttributes.length; i++) {
           _attributes[supportedAttributes[i]][_msgSender()] = bytes32(0);
           _attributesUint[supportedAttributes[i]][_msgSender()] = 0;
        }
    }

    function getAttribute(
        address _account,
        uint256 _id,
        bytes32 _attribute
    ) external view returns(bytes32) {
        return _getAttribute(_account, _id, _attribute);
    }

    function _getAttribute(
        address _account,
        uint256 _id,
        bytes32 _attribute
    ) internal view returns(bytes32) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        require(eligibleTokenId[_id], "PASSPORT_ID_INVALID");
        require(balanceOf(_account, _id) == 1, "PASSPORT_DOES_NOT_EXIST");
        require(eligibleAttributes[_attribute], "FIELD_NOT_ELIGIBLE");
        require(pricePerAttribute[_attribute] == 0, "ATTRIBUTE_IS_REQUIRING_PAYMENT");

        return _attributes[_attribute][_account];
    }

    function getBatchAttributes(
        address _account,
        uint256[] calldata _ids,
        bytes32[] calldata _attributeValues
    ) external view returns(bytes32[] memory) {
        require(_ids.length == _attributeValues.length, "BATCH_ATTRIBUTES_ERROR_LENGTH");
        bytes32[] memory attributes = new bytes32[](_attributeValues.length);

        for (uint256 i = 0; i < _ids.length; i++) {
            bytes32 attribute = _getAttribute(_account, _ids[i], _attributeValues[i]);
            attributes[i] = attribute;
        }

        return attributes;
    }

    function _verifyIssuer(
        address _account,
        uint256 _id,
        bytes32 _quadId,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) internal view {
        bytes32 hash = keccak256(abi.encode(_account, _id, _quadId, _country,  _issuedAt));
        require(_usedHashes[hash], "SIGNATURE_ALREADY_USED");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(hash);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sig);
        require(hasRole(ISSUER_ROLE, issuer), "INVALID_ISSUER");
    }

    function getPassportSignature(
        uint256 _id
    ) external view returns (bytes memory) {
        require(eligibleTokenId[_id], "PASSPORT_ID_INVALID");
        return _validSignatures[_msgSender()][_id];
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
        "ONLY_MINT_OR_BURN_TRANSFER_ALLOWED"
    );
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Upgradeable, AccessControlUpgradeable, IERC165Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

