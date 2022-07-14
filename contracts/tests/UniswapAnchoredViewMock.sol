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

        stringPrices[eth] = 4000e6;
        stringPrices[btc] = 20467e6;
        stringPrices[usdc] = 1e6;
        stringPrices[usdt] = 1e6;
        stringPrices[dai] = 1.00964e6;

        bytes32Prices[keccak256(abi.encodePacked(eth))] = PriceData(4000e6, false);
        bytes32Prices[keccak256(abi.encodePacked(btc))] = PriceData(20467e6, false);
        bytes32Prices[keccak256(abi.encodePacked(usdc))] = PriceData(1e6, false);
        bytes32Prices[keccak256(abi.encodePacked(usdt))] = PriceData(1e6, false);
        bytes32Prices[keccak256(abi.encodePacked(dai))] = PriceData(1.00964e6, false);

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
