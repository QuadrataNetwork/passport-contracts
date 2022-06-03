//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadPassport.sol";

contract QuadMetaPassport is UUPSUpgradeable, ERC2771Context {

    IQuadGovernance public governance;
    IQuadPassport public passport;

    constructor(address _trustedForwarder, address _governance, address _passport) ERC2771Context(_trustedForwarder) {
        governance = IQuadGovernance(_governance);
        passport = IQuadPassport(_passport);
    }

    function metaMintPassport(
        IQuadPassport.MintConfig calldata config,
        bytes calldata _sigIssuer,
        bytes calldata _sigAccount
    ) external payable {
        passport.mintPassport(config, _sigIssuer, _sigAccount);
    }


    function _authorizeUpgrade(address) internal view override {
        require(governance.hasRole(keccak256("GOVERNANCE_ROLE"), _msgSender()), "INVALID_ADMIN");
    }
}