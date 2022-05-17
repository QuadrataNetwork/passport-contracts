// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FaucetERC20 is ERC20 {
    constructor() ERC20("Faucet USD", "USDF") {
    }

    /// @dev Public faucet minting function for anyone to call and mints 10 tokens for testing/integration.
    function faucetMint() public virtual {
        _mint(msg.sender, 10 * 10 ** 6);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
