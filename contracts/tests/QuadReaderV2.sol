//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../QuadReader.sol";

contract QuadReaderV2 is QuadReader {
    function foo() external pure returns(uint256){
        return 1337;
    }
}
