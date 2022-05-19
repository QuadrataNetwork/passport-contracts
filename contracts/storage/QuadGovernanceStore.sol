//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IQuadPassport.sol";

contract QuadGovernanceStore {

    struct Config {
        uint256  revSplitIssuer; // 50 means 50%;
        uint256  passportVersion;
        uint256  mintPrice; // Price in $ETH
        IQuadPassport  passport;
        address  oracle;
        address  treasury;
    }

    enum IssuerStatus {
        ACTIVE,
        DEACTIVATED
    }

    struct Issuer {
        address issuer;
        IssuerStatus status;
        // TODO: should we add `bytes data;` in the struct
    }

    // Admin Functions
    bytes32[] public eligibleAttributesArray;
    mapping(uint256 => bool) public eligibleTokenId;
    mapping(bytes32 => bool) public eligibleAttributes;
    mapping(bytes32 => bool) public eligibleAttributesByDID;
    // Price in $USD (1e6 decimals)
    mapping(bytes32 => uint256) public pricePerAttribute;
    // Price in $ETH
    mapping(bytes32 => uint256) public mintPricePerAttribute;

    mapping(address => bool) public eligibleTokenPayments;
    mapping(address => address) public issuersTreasury;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant READER_ROLE = keccak256("READER_ROLE");

    Config public config;

    mapping(bytes32 => uint256) public pricePerBusinessAttribute;

    Issuer[] public issuers;
    mapping(address => uint256) internal issuerIndices;

}