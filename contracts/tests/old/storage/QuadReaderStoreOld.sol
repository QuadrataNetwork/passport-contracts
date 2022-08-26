//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "../interfaces/IQuadPassportOld.sol";
import "../interfaces/IQuadGovernanceOld.sol";

contract QuadReaderStoreOld {

    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    IQuadGovernanceOld public governance;
    IQuadPassportOld public passport;

    struct ApplyFilterVars {
        uint256 gaps;
        uint256 delta;
        uint256 filteredIndex;
    }

}
