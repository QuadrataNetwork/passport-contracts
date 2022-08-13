//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;

import "../QuadPassport.sol";

contract QuadPassportV2 is QuadPassport {
    function foo() external pure returns(uint256){
        return 1337;
    }
}
