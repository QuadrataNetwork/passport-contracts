// SPDX-License-Identifier: MIT
pragma solidity >= 0.5.0;

import "../utility/QueryUtils.sol";

contract TestQueryUtils {
    using QueryUtils for bytes32;

    function IsBusinessTrue(bytes32 _attrValue) public pure returns(bool) {
        return _attrValue.IsBusinessTrue();
    }

    function IsBusinessFalse(bytes32 _attrValue) public pure returns(bool) {
        return _attrValue.IsBusinessFalse();
    }

    function CountryIsEqual(bytes32 _attrValue, string memory _expectedString) public pure returns(bool) {
        return _attrValue.CountryIsEqual(_expectedString);
    }
}
