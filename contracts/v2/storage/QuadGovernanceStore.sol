//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "../interfaces/IQuadPassport.sol";

import "./QuadConstant.sol";

contract QuadGovernanceStore is QuadConstant {

    struct Config {
        uint256  revSplitIssuer; // 50 means 50%;
        uint256  mintPrice; // Price in $ETH
        IQuadPassport  passport;
        address  oracle;
        address  treasury;
    }

    enum IssuerStatus {
        DEACTIVATED,
        ACTIVE
    }

    struct Issuer {
        address issuer;
        IssuerStatus status;
    }

    // Admin Functions
    bytes32[] internal _eligibleAttributesArray;
    mapping(uint256 => bool) internal _eligibleTokenId;
    mapping(bytes32 => bool) internal _eligibleAttributes;
    mapping(bytes32 => bool) internal _eligibleAttributesByDID;
    // Price in $USD (1e6 decimals)
    mapping(bytes32 => uint256) internal _pricePerAttribute;
    // Price in $ETH
    mapping(bytes32 => uint256) internal _mintPricePerAttribute;

    mapping(address => bool) public eligibleTokenPayments;
    mapping(address => address) internal _issuersTreasury;

    Config public config;

    // Price in $USD (1e6 decimals)
    mapping(bytes32 => uint256) internal _pricePerBusinessAttribute;

    Issuer[] internal _issuers;
    mapping(address => uint256) internal _issuerIndices;

    mapping(bytes32 => uint256) internal _pricePerBusinessAttributeFixed;
    mapping(bytes32 => uint256) internal _pricePerAttributeFixed;
}
