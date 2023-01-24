//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

interface IQuadFEUtils {
    function unsafeGetBalanceOfBulk(
        address _account,
        bytes32[] memory _attributes
    ) external view returns (bytes32[] memory attributeTypes, address[] memory issuers, uint256[] memory issuedAts);

}