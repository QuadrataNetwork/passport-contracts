//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "../storage/QuadPassportStore.sol";

interface IQuadReader {
    function queryFee(
        address _account,
        bytes32 _attribute
    ) external view returns(uint256);

    function queryFeeBulk(
        address _account,
        bytes32[] calldata _attributes
    ) external view returns(uint256);

    function getAttributes(
        address _account, bytes32 _attribute
    ) external payable returns(QuadPassportStore.Attribute[] memory attributes);

    function getAttributesLegacy(
        address _account, bytes32 _attribute
    ) external payable returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers);

    function getAttributesBulk(
        address _account, bytes32[] calldata _attributes
    ) external payable returns(QuadPassportStore.Attribute[] memory);

    function getAttributesBulkLegacy(
        address _account, bytes32[] calldata _attributes
    ) external payable returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers);
}
