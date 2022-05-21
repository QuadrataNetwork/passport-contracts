//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IQuadPassport.sol";
import "../interfaces/IQuadGovernance.sol";

contract QuadPassportStore {

    struct Attribute {
        bytes32 value;
        uint256 epoch;
        address issuer;
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


    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant READER_ROLE = keccak256("READER_ROLE");

    IQuadGovernance public governance;

    // Hash => bool
    mapping(bytes32 => bool) internal _usedHashes;

    // Passport attributes
    // Wallet => (Attribute Name => (Attribute[]))
    mapping(address => mapping(bytes32 => Attribute[])) internal _attributesBundle;
    // DID => (AttributeType => (Attribute[]))
    mapping(bytes32 => mapping(bytes32 => Attribute[])) internal _attributesByDIDBundle;

    // Accounting
    // ERC20 => Account => balance
    mapping(address => mapping(address => uint256)) internal _accountBalances;
    mapping(address => uint256) internal _accountBalancesETH;


    string public symbol;
    string public name;
}