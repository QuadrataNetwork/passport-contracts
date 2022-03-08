//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./QuadGovernance.sol";

contract QuadPassportStore {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    QuadGovernance public governance;

    struct Attribute {
        bytes32 value;
        uint256 epoch;
        address issuer;
    }

    // Hash => bool
    mapping(bytes32 => bool) internal _usedHashes;
    // Wallet => (TokenId => Signatures)
    mapping(address => mapping(uint256 => bytes)) internal _validSignatures;

    // (Legacy) Passport attributes
    // (Legacy) User => (Attribute Name => Attribute)
    mapping(address => mapping(bytes32 => Attribute)) internal _attributes;
    // (Legacy) DID => (AttributeType => Attribute(value, epoch))
    mapping(bytes32 => mapping(bytes32 => Attribute)) internal _attributesByDID;

    // User => (TokenId => IssuanceEpoch)
    mapping(address => mapping(uint256 => uint256)) internal _issuedEpoch;

    // Accounting
    // ERC20 => Account => balance
    mapping(address => mapping(address => uint256)) internal _accountBalances;
    mapping(address => uint256) internal _accountBalancesETH;

    // Passport attributes
    // Append This (Multiple Issuers)
    mapping(address => mapping(uint256 => mapping(bytes32 => Attribute))) internal _attributesV2;
    // Append This (Multiple Issuers)
    mapping(bytes32 => mapping(uint256 => mapping(bytes32 => Attribute))) internal _attributesByDIDV2;
}

