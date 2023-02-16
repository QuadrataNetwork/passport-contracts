// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.16;

import "../QuadGovernance.sol";

contract QuadGovernanceTestnet is QuadGovernance {
    function preapproval(address) public view override returns(bool) {
        return true;
    }
}