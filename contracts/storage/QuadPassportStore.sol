//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../interfaces/IQuadPassport.sol";
import "../interfaces/IQuadGovernance.sol";

contract QuadPassportStore {

    struct Attribute {
        bytes32 value;
        uint256 epoch;
        address issuer;
    }


    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant READER_ROLE = keccak256("READER_ROLE");

    IQuadGovernance public governance;

    // Hash => bool
    mapping(bytes32 => bool) internal _usedHashes;
    // Wallet => (TokenId => Signatures)
    mapping(address => mapping(uint256 => bytes)) internal _validSignatures;

    // Passport attributes
    // Wallet => (Attribute Name => (Issuer => Attribute))
    mapping(address => mapping(bytes32 => mapping(address => Attribute))) internal _attributes;
    // DID => (AttributeType => (Issuer => Attribute(value, epoch)))
    mapping(bytes32 => mapping(bytes32 => mapping(address => Attribute))) internal _attributesByDID;

    // Accounting
    // ERC20 => Account => balance
    mapping(address => mapping(address => uint256)) internal _accountBalances;
    mapping(address => uint256) internal _accountBalancesETH;

}