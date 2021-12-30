//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../QuadGovernance.sol";

contract QuadGovernanceV2 is QuadGovernance {
    function getPriceETHV2() external pure returns (uint) {
        return 1337;
    }
}
