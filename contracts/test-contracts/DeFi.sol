//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IQuadPassport.sol";
import "hardhat/console.sol";

contract DeFi {
    event GetAttributeEvent(bytes32 _value, uint256 _epoch);

    IQuadPassport public passport;

    constructor(address _passport) {
       passport = IQuadPassport(_passport);
    }

    function doSomething(
        bytes32 _attribute,
        address _tokenPayment
    ) public returns(bytes32,uint256) {
        uint256 paymentAmount = passport.calculatePaymentToken(_attribute, _tokenPayment, msg.sender);
        IERC20(_tokenPayment).transferFrom(msg.sender, address(this), paymentAmount);
        IERC20(_tokenPayment).approve(address(passport), paymentAmount);
        (bytes32 attrValue, uint256 epoch) = passport.getAttribute(msg.sender, 1, _attribute, _tokenPayment,1);
        emit GetAttributeEvent(attrValue, epoch);
        return (attrValue, epoch);
    }

    function doSomethingFree(
        bytes32 _attribute
    ) public returns(bytes32,uint256) {
        (bytes32 attrValue, uint256 epoch) = passport.getAttributeFree(msg.sender, 1, _attribute,1);
        emit GetAttributeEvent(attrValue, epoch);
        return (attrValue, epoch);
    }

    function doSomethingETH(bytes32 _attribute) public payable returns(bytes32, uint256) {
        uint256 paymentAmount = passport.calculatePaymentETH(_attribute, msg.sender);
        console.log("[doSomethingETH] paymentAmount", paymentAmount);
        console.log("[doSomethingETH] msg.value", msg.value);
        require(msg.value >= paymentAmount, "INSUFFICIENT_ETH");
        (bytes32 attrValue, uint256 epoch) = passport.getAttributeETH{value: paymentAmount}(msg.sender, 1, _attribute,1);
        emit GetAttributeEvent(attrValue, epoch);
        return (attrValue, epoch);
    }
}
