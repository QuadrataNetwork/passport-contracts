// SPDX-License-Identifier: MIT
pragma solidity >= 0.5.0;

import "../utility/QueryUtils.sol";

contract TestQueryUtils {
    using QueryUtils for bytes32;

    function isBusinessTrue(bytes32 _attrValue) public pure returns(bool) {
        return _attrValue.IsBusinessTrue();
    }
}
