//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../QuadPassport.sol";

contract QuadPassportV2 is QuadPassport {
    function foo() external pure returns(uint256){
        return 1337;
    }
}
