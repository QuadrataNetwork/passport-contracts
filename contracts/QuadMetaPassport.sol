//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

import "./interfaces/IQuadPassport.sol";

contract QuadMetaPassport is ERC2771Context {

    IQuadPassport public passport;

    // Biconomy's Trusted Forwarder: 0x84a0856b038eaAd1cC7E297cF34A7e72685A8693
    // Full list for each network found here: https://docs.biconomy.io/misc/contract-addresses
    constructor(address _trustedForwarder, address _passport) ERC2771Context(_trustedForwarder) {
        passport = IQuadPassport(_passport);
    }

    /// Note: functions can only be 'meta-wrapped' if they don't use msg.sender
    /// If the desired function contains msg.sender, then QuadPassport must be upgraded
    /// with additional functions to support this wrapping.
    function metaMintPassport(
        IQuadPassport.MintConfig calldata config,
        bytes calldata _sigIssuer,
        bytes calldata _sigAccount
    ) external payable {
        passport.mintPassport(config, _sigIssuer, _sigAccount);
    }
}