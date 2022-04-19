//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UniswapAnchoredView  {
    /**
     * @notice Get the official price for a symbol
     * @param symbol The symbol to fetch the price of
     * @return Price denominated in USD, with 6 decimals
     */
    function price(string memory symbol) external view returns (uint) {
        if (keccak256(abi.encodePacked(symbol)) == keccak256(abi.encodePacked("ETH"))) {
            return 4000e6;
        } else {
            return 1e6;
        }
    }
}

