//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

interface IQuadFEUtils {

    /// @param _account address of user
    /// @param _attributes attributes to get respective non-value data from
    /// @return attributeTypes list of attribute names encoded as keccack256("AML") for example
    /// @return issuers list of issuers for the attribute[i]
    /// @return issuedAts list of epochs for the attribute[i]
    function unsafeGetBalanceOfBulk(
        address _account,
        bytes32[] memory _attributes
    ) external view returns (bytes32[] memory attributeTypes, address[] memory issuers, uint256[] memory issuedAts);

}