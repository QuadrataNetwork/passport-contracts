//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadPassport.sol";

contract QuadMetaPassport is UUPSUpgradeable, ERC2771Context {

    IQuadGovernance public governance;
    IQuadPassport public passport;

    constructor(address _trustedForwarder, address _governance) ERC2771Context(_trustedForwarder) {
        governance = IQuadGovernance(_governance);
    }


    function _authorizeUpgrade(address) internal view override {
        require(governance.hasRole(keccak256("GOVERNANCE_ROLE"), _msgSender()), "INVALID_ADMIN");
    }
}