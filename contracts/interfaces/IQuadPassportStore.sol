//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

interface IQuadPassportStore {
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
        uint256 verifiedAt;
        uint256 issuedAt;
        uint256 fee;
    }
}
