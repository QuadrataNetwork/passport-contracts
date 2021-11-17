//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./QuadGovernance.sol";

contract QuadPassportStore {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    QuadGovernance public governance;

    struct Attribute {
        bytes32 value;
        uint256 epoch;
    }

    // Hash => bool
    mapping(bytes32 => bool) internal _usedHashes;
    // Wallet => (TokenId => Signatures)
    mapping(address => mapping(uint256 => bytes)) internal _validSignatures;

    // Passport attributes
    // Wallet => (Attribute Name => Attribute)
    mapping(address => mapping(bytes32 => Attribute)) internal _attributes;
    // Wallet => (TokenId => IssuanceEpoch)
    mapping(address => mapping(uint256 => uint256)) internal _issuedEpoch;
}

