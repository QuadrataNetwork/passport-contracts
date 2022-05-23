//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../interfaces/IQuadPassport.sol";
import "../interfaces/IQuadGovernance.sol";

contract QuadReaderStore {

    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    IQuadGovernance public governance;
    IQuadPassport public passport;
}