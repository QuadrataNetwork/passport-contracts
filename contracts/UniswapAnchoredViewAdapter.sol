//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;
pragma experimental ABIEncoderV2;

import "./interfaces/IUniswapAnchoredView.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract UniswapAnchoredViewAdapter {
    /// @notice Emitted when a UniswapAnchoredView pointer changes
    event NewUniswapAnchoredView(address oldUAV, address newUAV);

    /// @notice Emitted when the targetDecimals changes
    event NewTargetDecimals(uint256 oldTargetDecimals, uint256 newTargetDecimals);

    /// @notice Emitted when the priceDecimals changes
    event NewPriceDecimals(uint256 oldPriceDecimals, uint256 newPriceDecimals);

    /// @notice Emitted when the an AdaptedSymbol changes
    event UpdateAdapatedSymbol(string key, string newValue, string oldValue);

    // the 3rd party price feed
    IUniswapAnchoredView public uav;

    // deployer
    address public admin;

    // precison given to us from 3rd party price feed
    uint256 public priceDecimals;

    // precison needed for our comptroller
    uint256 public targetDecimals;

    // used to transform symbols
    mapping(string => string) public adaptedSymbols;

    using SafeMath for uint256;

    /**
     * @notice create and set default values
     * @param _uav new pointer to price feed
     */
    constructor(address _admin, IUniswapAnchoredView _uav) {
        uav = _uav;
        admin = _admin;
        priceDecimals = 6;
        targetDecimals = 6;

        adaptedSymbols["WETH"] = "ETH";
        adaptedSymbols["WBTC"] = "BTC";

        adaptedSymbols["USDC"] = "USDC";
        adaptedSymbols["USDT"] = "USDT";
        adaptedSymbols["DAI"] = "DAI";
    }

    /**
     * @notice scale the 3rd party price feed value into something useable for our comptroller
     * @param value the data to be scaled
     * @return useable data for comptroller
     */
    function scalePriceInternal(uint256 value) internal view returns (uint256) {
        if(targetDecimals == priceDecimals) {
            return value;
        }
        int256 mantissa = int256(targetDecimals) - int256(priceDecimals);
        bool signed = mantissa > 0;
        if (!signed) {
            mantissa *= -1;
        }

        if (signed) {
            value = value.mul(uint256(10) ** uint256(mantissa));
        } else {
            value = value.div(uint256(10) ** uint256(mantissa));
        }
        return uint256(value);
    }

    /**
     * @notice Get the underlying price of a cToken asset
     * @param symbol The symbol to get the price of
     * @return The underlying asset price mantissa (scaled by 1e18).
     *  Zero means the price is unavailable.
     */
    function _getAdaptedPrice(string calldata symbol) internal view returns (uint256) {
        return scalePriceInternal(uav.price(adaptedSymbols[symbol]));
    }

    function price(string calldata symbol) public view returns (uint256) {
        return _getAdaptedPrice(symbol);
    }

    /**
     * @notice UAV setter: the 3rd party price feed
     * @param _uav new pointer to price feed
     */
    function setUniswapAnchoredView(address _uav) public {
        require(msg.sender == admin, "INVALID_USER");

        emit NewUniswapAnchoredView(address(uav), _uav);
        uav = IUniswapAnchoredView(_uav);
    }

    /**
     * @notice target setter: precison given to us from 3rd party price feed
     * @param _target new target
     */
    function setTargetDecimals(uint256 _target) public {
        require(msg.sender == admin, "INVALID_USER");
        require(_target != 0, "VALUE_CANNOT_BE_0");

        emit NewTargetDecimals(targetDecimals, _target);
        targetDecimals = _target;
    }

    /**
     * @notice price setter: precison needed for our comptroller
     * @param _priceDecimals new comptroller requirement
     */
    function setPriceDecimals(uint256 _priceDecimals) public {
        require(msg.sender == admin, "INVALID_USER");
        require(_priceDecimals != 0, "VALUE_CANNOT_BE_0");

        emit NewPriceDecimals(priceDecimals, _priceDecimals);
        priceDecimals = _priceDecimals;
    }

    function updateAdaptedSymbol(string calldata symbol, string calldata adaptedSymbol) public {
        require(msg.sender == admin, "INVALID_USER");
        require(keccak256(bytes(adaptedSymbol)) != keccak256(bytes("")), "ADAPTED_SYMBOL_EMPTY");

        emit UpdateAdapatedSymbol(symbol, adaptedSymbol, adaptedSymbols[symbol]);

        adaptedSymbols[symbol] = adaptedSymbol;
    }
}
