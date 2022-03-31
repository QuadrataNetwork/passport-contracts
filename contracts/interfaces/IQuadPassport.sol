//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ERC1155/IERC1155Upgradeable.sol";

interface IQuadPassport is IERC1155Upgradeable {
    function mintPassport(
        address _account,
        uint256 _tokenId,
        bytes32 _quadDID,
        bytes32 _aml,
        bytes32 _country,
        bytes32 _kyb,
        uint256 _issuedAt,
        bytes calldata _sig
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
    ) external;

    function burnPassport(uint256 _tokenId) external;

    function burnPassportIssuer(address _account, uint256 _tokenId) external;

    function getAttribute(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr,
        uint256 _issuerId
    ) external returns(bytes32, uint256);

    function getAttributeFree(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        uint256 _issuerId
    ) external view returns(bytes32, uint256);


    function getAttributeETH(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        uint256 _issuerId
    ) external payable returns(bytes32, uint256);

    function getPassportSignature(uint256 _tokenId)
        external
        view
        returns (bytes memory);

    function setGovernance(address _governanceContract) external;

    function calculatePaymentToken(
        bytes32 _attribute,
        address _tokenPayment,
        address _account
    ) external view returns (uint256);

    function calculatePaymentETH(bytes32 _attribute, address _account)
        external
        view
        returns (uint256);

    function withdrawETH(address payable _to) external returns (uint256);

    function withdrawToken(address payable _to, address _token)
        external
        returns (uint256);
}
