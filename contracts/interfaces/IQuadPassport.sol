//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

interface IQuadPassport is IERC1155Upgradeable {
    struct Attribute {
        bytes32 value;
        uint256 epoch;
    }

    function mintPassport(
        uint256 _id,
        bytes32 _quadDID,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable;

    function setAttribute(
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable;

    function setAttributeIssuer(
        address _account,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt
    ) external;

    function burnPassport(
        uint256 _id
    ) external;

    function getAttribute(
        address _account,
        uint256 _id,
        bytes32 _attribute
    ) external view returns(Attribute memory);

    function getBatchAttributes(
        address _account,
        uint256[] calldata _ids,
        bytes32[] calldata _attributeValues
    ) external view returns(Attribute[] memory);

    function getPassportSignature(
        uint256 _id
    ) external view returns (bytes memory);

    function setGovernance(
        address _governanceContract
    ) external;
}

