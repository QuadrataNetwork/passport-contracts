// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.16;

import "hardhat/console.sol";

contract NonDelegateProxy {

    function executeRaw(
        address _target,
        bytes calldata _functionData
    ) external payable {
        (bool called,) = _target.call(_functionData);
        console.log("called: %s", called);
        if(!called) {
            console.log("EXECUTION_FAILED in NonDelegateProxy.executeRaw()");
            console.log("TARGET REVERTED FOR UNKNOWN REASON");
        }
    }
}