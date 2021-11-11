//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0

import "./interfaces/IQuadPassport.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

contract QuadPassport is IQuadPassport, ERC1155Upgradeable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    uint256 public PASSPORT_VERSION = 1;

    uint256 public mintPrice = 0.03 ether;

    mapping(uint256 => bool) public eligibleTokenId;
    mapping(bytes32 => bool) public eligibleFields;

    mapping(bytes32 => bool) private _usedHashes;
    mapping(address => (mapping(uint256 => bytes))) public validSignatures;
    mapping(bytes32 => (mapping(address => bytes32))) private _fields;
    mapping(bytes32 => (mapping(address => uint256))) private _fieldsUint;
    mapping(bytes32 => uint256) public pricePerField;


    function initialize(address governance) public initializer {
        require(owner != address(0), "GOVERNANCE_ADDRESS_ZERO");

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
        bytes calldata _sig,
    ) external payable {
        require(msg.value == mintPrice, "INVALID_MINT_PRICE");
        require(eligibleTokenId[_id], "PASSPORT_ID_INVALID");
        require(balanceOf(_msgSender(), _id), "PASSPORT_ALREADY_EXISTS");

        _verifyIssuer(_msgSender(), _id, _quadId, _country, _issuedAt, _sig);

        validSignatures[_msgSender()][_id] = _sig;
        _fields[keccak256("COUNTRY")][_msgSender()] = _country;
        _fields[keccak256("DID")][_msgSender()] = _quadId;
        _fieldsUint[keccak256("ISSUED_TIMESTAMP")][_msgSender()] = _issuedAt;
        _safeMint(_msgSender(), _id, 1);
    }

    function linkNewPassport() external payable {

    }

    function burnPassport() external {

    }

    function _verifyIssuer(
        address _account,
        uint256 _id,
        bytes32 _quadId,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) internal {
        bytes32 h = keccak256(abi.encode(_account, _id, _quadId, _country,  _issuedAt));
        require(_usedHashes[h], "SIGNATURE_ALREADY_USED");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessagehash(h);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sig);
        require(hasRole(ISSUER_ROLE, issuer), "INVALID_ISSUER");
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
        (from == address(0) && to != address(0)) || (from != address(0) && to == address(0)),
        "ONLY_MINT_OR_BURN_TRANSFER_ALLOWED"
    );
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}

