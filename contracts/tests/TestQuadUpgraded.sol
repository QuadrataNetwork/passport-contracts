//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TestQuadUpgraded is UUPSUpgradeable{
    bytes32 public constant TOP_ROLE = keccak256("TOP_ROLE");
    uint256 public someVal;
    bytes32 public constant MID_ROLE = keccak256("MID_ROLE");
    uint256 public someOtherVal;
    bytes32 public constant BOTTOM_ROLE = keccak256("BOTTOM_ROLE");

    function foo() external pure returns(uint256){
        return 2;
    }

    function _authorizeUpgrade(address) internal view override {
    }
}
