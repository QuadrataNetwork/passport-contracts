//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

contract UniswapAnchoredViewMock  {

    mapping(string => PriceData) public stringPrices;
    mapping(bytes32 => PriceData) public bytes32Prices;

    constructor() public {

        string memory eth = "ETH";
        string memory btc = "BTC";
        string memory usdc = "USDC";
        string memory usdt = "USDT";
        string memory dai = "DAI";

        stringPrices[eth] = PriceData(4000e6, false);

    }

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

    struct PriceData {
        uint248 price;
        bool failoverActive;
    }
    function prices(bytes32 symbolHash) external view returns (PriceData memory) {
        if(symbolHash == keccak256("ETH")) {
            return PriceData(4000e6, false);
        } else {
            return PriceData(1e6, false);
        }
    }
}
