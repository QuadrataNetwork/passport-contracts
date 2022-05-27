// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FaucetERC20 is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_){
        _decimals = decimals_;
    }

    /// @dev Public faucet minting function for anyone to call and mints 10 tokens for testing/integration.
    function faucetMint() public virtual {
        _mint(msg.sender, 10 * 10 ** _decimals);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
