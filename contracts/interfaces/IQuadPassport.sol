//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "../storage/QuadPassportStore.sol";
import "./IQuadSoulbound.sol";

interface IQuadPassport is IQuadSoulbound {

    /// @notice Set attributes for a Quadrata Passport (Only Individuals)
    /// @dev Only when authorized by an eligible issuer
    /// @param _config Input paramters required to set attributes
    /// @param _sigIssuer ECDSA signature computed by an eligible issuer to authorize the mint
    /// @param _sigAccount (Optional) ECDSA signature computed by an eligible EOA to authorize the mint
    function setAttributes(
        QuadPassportStore.AttributeSetterConfig memory _config,
        bytes calldata _sigIssuer,
        bytes calldata _sigAccount
    ) external payable;

    /// @notice Set attributes for a Quadrata Passport (only by Issuers)
    /// @param _account Address of the Quadrata Passport holder
    /// @param _config Input paramters required to set attributes
    /// @param _sigIssuer ECDSA signature computed by an eligible issuer to authorize the action
    function setAttributesIssuer(
        address _account,
        QuadPassportStore.AttributeSetterConfig memory _config,
        bytes calldata _sigIssuer
    ) external payable;

    function burnPassport(uint256 _tokenId) external;

    function burnPassportIssuer(address _account, uint256 _tokenId) external;

    function setGovernance(address _governanceContract) external;

    function withdraw(address payable _to) external returns (uint256);

    function withdrawToken(address payable _to, address _token)
        external
        returns (uint256);

    function acceptGovernance() external;

    function attributes(address, bytes32) external view returns (QuadPassportStore.Attribute[] memory);
}
