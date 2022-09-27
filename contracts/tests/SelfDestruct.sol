//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

contract SelfDestruct {
    address payable public treasury;

    constructor(address payable _treasury) {
        treasury = _treasury;
    }

    function dangerZone() external {
        selfdestruct(treasury);
    }
}