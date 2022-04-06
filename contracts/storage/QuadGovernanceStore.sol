//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../interfaces/IQuadPassport.sol";

contract QuadGovernanceStore {
    // Admin Functions
    bytes32[] public supportedAttributes;
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

    uint256 public revSplitIssuer; // 50 means 50%;
    uint256 public passportVersion;
    uint256 public mintPrice; // Price in $ETH
    IQuadPassport public passport;
    address public oracle;
    address public treasury;

    mapping(bytes32 => uint256) public pricePerBusinessAttribute;

    address[] public issuers;
    mapping(address => uint256) internal issuerIndices;

    bytes32 public constant ACCESSOR_ROLE = keccak256("ACCESSOR_ROLE");

}