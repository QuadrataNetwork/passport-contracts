//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;

import "../QuadGovernance.sol";

contract QuadGovernanceUpgrade is QuadGovernance {
    function getPriceETHV2() external pure returns (uint) {
        return 1337;
    }
}
