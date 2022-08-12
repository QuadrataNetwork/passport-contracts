//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "../interfaces/IQuadPassport.sol";
import "../interfaces/IQuadGovernance.sol";

import "./QuadConstant.sol";

contract QuadPassportStore is QuadConstant {
    struct Attribute {
        bytes32 value;
        uint256 epoch;
        address issuer;
    }

    /// @dev AttributeSetterConfig contains configuration for setting attributes for a Passport holder
    /// @notice This struct is used to abstract setAttributes function parameters
    /// `attrKeys` Array of keys defined by (wallet address/DID + data Type)
    /// `attrValues` Array of attributes values
    /// `tokenId` tokenId of the Passport
    /// `issuedAt` epoch when the attribute has been attested by the Issuer
    /// `fee` Fee (in Native token) to pay the Issuer
    struct AttributeSetterConfig {
        bytes32[] attrKeys;
        bytes32[] attrValues;
        uint256 tokenId;
        uint256 issuedAt;
        uint256 fee;
    }

    IQuadGovernance public governance;
    address public pendingGovernance;

    // SignatureHash => bool
    mapping(bytes32 => bool) internal _usedSigHashes;

    string public symbol;
    string public name;

    // Key could be:
    // 1) keccak256(userAddress, keccak256(attrType))
    // 2) keccak256(DID, keccak256(attrType))
    mapping(bytes32 => Attribute[]) internal _attributes;

    // Key could be:
    // 1) keccak256(userAddress, keccak256(attrType), issuer)
    // 1) keccak256(DID, keccak256(attrType), issuer)
    mapping(bytes32 => uint256) internal _position;
}
