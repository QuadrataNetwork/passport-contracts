//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IQuadGovernance {
    function mintPrice() external pure returns(uint256);
    function passportVersion() external pure returns(uint256);
    function eligibleTokenId(uint256 _tokenId) external pure returns(bool);
    function eligibleAttributes(bytes32 _attribute) external pure returns(bool);
    function pricePerAttribute(bytes32 _attribute) external pure returns(uint256);
}


