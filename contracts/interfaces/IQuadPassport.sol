//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ERC1155/IERC1155Upgradeable.sol";
import "../storage/QuadPassportStore.sol";

interface IQuadPassport is IERC1155Upgradeable {

    function mintPassport(
        QuadPassportStore.MintConfig calldata config,
        bytes calldata _sigIssuer,
        bytes calldata _sigAccount
    ) external payable;

    function setAttribute(
        address _account,
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
    ) external ;

    function burnPassport(uint256 _tokenId) external;

    function burnPassportIssuer(address _account, uint256 _tokenId) external;

    function setGovernance(address _governanceContract) external;

    function withdrawETH(address payable _to) external returns (uint256);

    function withdrawToken(address payable _to, address _token)
        external
        returns (uint256);


    function getBundle(
        address _account,
        bytes32 _attribute
    ) external view returns (QuadPassportStore.Attribute[] memory);

    function getBundleByDID(
        bytes32 _dID,
        bytes32 _attribute
    ) external view returns (QuadPassportStore.Attribute[] memory);

    function increaseAccountBalanceETH(address, uint256) external;

    function increaseAccountBalance(address, address, uint256) external;



}
