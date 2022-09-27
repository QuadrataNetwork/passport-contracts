//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "hardhat/console.sol";

contract SelfDestruct {

    address payable public treasury;

    constructor(address payable _treasury) {
        treasury = _treasury;
    }

    function dangerZone() external {
        console.log("CALLLED");
        //selfdestruct(treasury);
    }
}