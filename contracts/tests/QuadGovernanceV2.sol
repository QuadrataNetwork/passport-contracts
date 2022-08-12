//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;

import "../QuadGovernance.sol";

contract QuadGovernanceV2 is QuadGovernanceV1 {
    function getPriceETHV2() external pure returns (uint) {
        return 1337;
    }
}
