//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "../interfaces/IQuadPassport.sol";
import "../interfaces/IQuadGovernance.sol";

import "./QuadConstant.sol";

contract QuadReaderStore is QuadConstant{
    IQuadGovernance public governance;
    IQuadPassport public passport;

    struct ApplyFilterVars {
        uint256 gaps;
        uint256 delta;
        uint256 filteredIndex;
    }

}
