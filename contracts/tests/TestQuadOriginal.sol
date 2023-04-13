//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TestQuadOriginal is UUPSUpgradeable{
    uint256 public someVal;
    uint256 public someOtherVal;

    function initialize() public initializer {
        someVal = 69;
        someOtherVal = 1337;
    }

    function foo() external pure returns(uint256){
        return 1;
    }

    function _authorizeUpgrade(address) internal view override {
    }
}
