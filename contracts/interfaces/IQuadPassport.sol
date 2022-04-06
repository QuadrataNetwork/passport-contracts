//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ERC1155/IERC1155Upgradeable.sol";

abstract contract IQuadPassport is IERC1155Upgradeable {

    struct Attribute {
        bytes32 value;
        uint256 epoch;
        address issuer;
    }

    function mintPassport(
        address _account,
        uint256 _tokenId,
        bytes32 _quadDID,
        bytes32 _aml,
        bytes32 _country,
        bytes32 _kyb,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external virtual payable;

    function setAttribute(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external virtual payable;

    function setAttributeIssuer(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt
    ) external virtual;

    function burnPassport(uint256 _tokenId) external virtual;

    function burnPassportIssuer(address _account, uint256 _tokenId) external virtual;

    function getPassportSignature(uint256 _tokenId)
        external virtual
        view
        returns (bytes memory);

    function setGovernance(address _governanceContract) external virtual;

    function withdrawETH(address payable _to) external virtual returns (uint256);

    function withdrawToken(address payable _to, address _token)
        external virtual
        returns (uint256);


    function attributes(address, bytes32, address) external view virtual returns (Attribute memory);

    function attributesByDID(bytes32, bytes32, address) external view virtual returns (Attribute memory);

    function accountBalancesETH(address, uint256) external virtual;

    function accountBalances(address, address, uint256) external virtual;



}
