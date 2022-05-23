//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../interfaces/IQuadPassport.sol";
import "../interfaces/IQuadGovernance.sol";

contract QuadPassportStore {

    struct Attribute {
        bytes32 value;
        uint256 epoch;
    }

    /// @dev MintConfig is defined to prevent 'stack frame too deep' during compilation
    /// @notice This struct is used to abstract mintPassport function parameters
    /// `account` EOA/Contract to mint the passport
    /// `tokenId` tokenId of the Passport (1 for now)
    /// `quadDID` Quadrata Decentralized Identity (raw value)
    /// `aml` keccak256 of the AML status value
    /// `country` keccak256 of the country value
    /// `isBusiness` flag identifying if a wallet is a business or individual
    /// `issuedAt` epoch when the passport has been issued by the Issuer
    struct MintConfig {
        address account;
        uint256 tokenId;
        bytes32 quadDID;
        bytes32 aml;
        bytes32 country;
        bytes32 isBusiness;
        uint256 issuedAt;
    }

    IQuadGovernance public governance;

    // Hash => bool
    mapping(bytes32 => bool) internal _usedHashes;

    // Passport attributes
    // Account => (Attribute Type => (Issuer => Attribute))
    mapping(address => mapping(bytes32 => mapping(address => Attribute))) internal _attributes;
    // DID => (AttributeType => (Issuer => Attribute(value, epoch)))
    mapping(bytes32 => mapping(bytes32 => mapping(address => Attribute))) internal _attributesByDID;

    // Account => (Attribute Type => Issuers[]))
    mapping(address => mapping (bytes32 => address[])) public issuerCache;
    // DID => (Attribute Type => Issuers[]))
    mapping(bytes32 => mapping (bytes32 => address[])) public issuerCacheByDID;

    // Accounting
    // ERC20 => Account => balance
    mapping(address => mapping(address => uint256)) internal _accountBalances;
    mapping(address => uint256) internal _accountBalancesETH;


    string public symbol;
    string public name;
}