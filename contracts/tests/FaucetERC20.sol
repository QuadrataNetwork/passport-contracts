// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FaucetUSDC is ERC20 {
    mapping(address => uint256) public lastMinted;

    constructor() ERC20("Faucet USDC", "FUSDC") {
    }

    /// @dev Public minting function to serve as a faucet. Mints 10 token to caller.
    function faucet() public virtual {
        require(lastMinted[msg.sender] + 6208 <= block.timestamp, 'Must wait 6208 blocks from previous mint');
        _mint(msg.sender, 10 * 10 ** 6);
        lastMinted[msg.sender] = block.timestamp;
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
