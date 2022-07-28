//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "../interfaces/IQuadPassport.sol";
import "../interfaces/IQuadGovernance.sol";

contract QuadReaderStore {

    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    IQuadGovernance public governance;
    IQuadPassport public passport;

    struct ApplyFilterVars {
        uint256 gaps;
        uint256 delta;
        uint256 filteredIndex;
    }

    bytes32[] internal _attributeCache;
    uint256[] internal _epochCache;
    address[] internal _issuerCache;

}
