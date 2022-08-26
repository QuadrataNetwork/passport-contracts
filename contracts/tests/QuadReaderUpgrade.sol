//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "../QuadReader.sol";

contract QuadReaderUpgrade is QuadReader {
    function foo() external pure returns(uint256){
        return 1337;
    }
}
