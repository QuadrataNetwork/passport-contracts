//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DeFi.sol";
import "../interfaces/IQuadPassport.sol";

contract MockBusiness {

    DeFi public defi;

    constructor(address _defi) {
        defi = DeFi(_defi);
    }

    function doSomethingAsBusiness(bytes32 _attribute) public payable returns(bytes32,uint256) {
        return defi.doSomethingETH{value: msg.value}(_attribute);
    }

    function burn() public {
        IQuadPassport(defi.passport()).burnPassport(1);
    }
}