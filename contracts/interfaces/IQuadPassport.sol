//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

interface IQuadPassport is IERC1155Upgradeable {
    function mintPassport(
        uint256 _tokenId,
        bytes32 _quadDID,
        bytes32 _aml,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable;

    function setAttribute(
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable;

    function setAttributeIssuer(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt
    ) external;

    function burnPassport(
        uint256 _tokenId
    ) external;

    function getAttribute(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr
    ) external returns(bytes32, uint256);

    function getAttributeETH(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    ) external payable returns(bytes32, uint256);

    function getBatchAttributesETH(
        address _account,
        uint256[] calldata _tokenIds,
        bytes32[] calldata _attributes
    ) external payable returns(bytes32[] memory, uint256[] memory);

    function getBatchAttributes(
        address _account,
        uint256[] calldata _tokenIds,
        bytes32[] calldata _attributes,
        address _tokenAddr
    ) external returns(bytes32[] memory, uint256[] memory);

    function getPassportSignature(
        uint256 _tokenId
    ) external view returns (bytes memory);

    function setGovernance(
        address _governanceContract
    ) external;
}

