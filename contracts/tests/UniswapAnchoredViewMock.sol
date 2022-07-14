//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

contract UniswapAnchoredViewMock  {

    mapping(string => uint256) public stringPrices;
    mapping(bytes32 => PriceData) public bytes32Prices;

    constructor() {

        string memory eth = "ETH";
        string memory btc = "BTC";
        string memory usdc = "USDC";
        string memory usdt = "USDT";
        string memory dai = "DAI";

        stringPrices[eth] = 1188280000;
        stringPrices[btc] = 2046730000;
        stringPrices[usdc] = 1000000;
        stringPrices[usdt] = 1000000;
        stringPrices[dai] = 1000964;

        bytes32Prices[keccak256(abi.encodePacked(eth))] = PriceData(1188280000, false);
        bytes32Prices[keccak256(abi.encodePacked(btc))] = PriceData(20467300000, false);
        bytes32Prices[keccak256(abi.encodePacked(usdc))] = PriceData(1000000, false);
        bytes32Prices[keccak256(abi.encodePacked(usdt))] = PriceData(1000000, false);
        bytes32Prices[keccak256(abi.encodePacked(dai))] = PriceData(1000964, false);

    }

    /**
     * @notice Get the official price for a symbol
     * @param symbol The symbol to fetch the price of
     * @return Price denominated in USD, with 6 decimals
     */
    function price(string memory symbol) external view returns (uint256) {
        return stringPrices[symbol];
    }

    struct PriceData {
        uint248 price;
        bool failoverActive;
    }
    function prices(bytes32 symbolHash) external view returns (PriceData memory) {
        return bytes32Prices[symbolHash];
    }
}
