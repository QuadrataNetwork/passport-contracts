//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

interface IQuadReaderV2 {

    function getAttributesExcludingV2(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _excludedIssuers
    ) external payable returns(bytes32[] memory, uint256[] memory, address[] memory);

    function getAttributesV2(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    ) external payable returns(bytes32[] memory, uint256[] memory, address[] memory);

    function getAttributesIncludingOnlyV2(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _onlyIssuers
    ) external payable returns(bytes32[] memory, uint256[] memory, address[] memory);

    function calculatePaymentETH(
        bytes32 _attribute,
        address _account
    ) external view returns(uint256);

}

