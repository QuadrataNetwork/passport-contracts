//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IQuadPassport.sol";
import "../QuadAccess.sol";
import "hardhat/console.sol";

contract DeFi {
    event GetAttributeEvent(bytes32 _value, uint256 _epoch);

    IQuadPassport public passport;
    QuadAccess public access;

    constructor(address _passport, QuadAccess _access) {
       passport = IQuadPassport(_passport);
       access = _access;
    }

    function doSomething(
        bytes32 _attribute,
        address _tokenPayment
    ) public returns(bytes32,uint256) {
        uint256 paymentAmount = access.calculatePaymentToken(_attribute, _tokenPayment, msg.sender);
        IERC20(_tokenPayment).transferFrom(msg.sender, address(this), paymentAmount);
        IERC20(_tokenPayment).approve(address(passport), paymentAmount);
        (bytes32 attrValue, uint256 epoch) = access.getAttribute(msg.sender, 1, _attribute, _tokenPayment);
        emit GetAttributeEvent(attrValue, epoch);
        return (attrValue, epoch);
    }

    function doSomethingFree(
        bytes32 _attribute
    ) public returns(bytes32,uint256) {
        (bytes32 attrValue, uint256 epoch) = access.getAttributeFree(msg.sender, 1, _attribute);
        emit GetAttributeEvent(attrValue, epoch);
        return (attrValue, epoch);
    }

    function doSomethingETH(bytes32 _attribute) public payable returns(bytes32, uint256) {
        uint256 paymentAmount = access.calculatePaymentETH(_attribute, msg.sender);
        console.log("[doSomethingETH] paymentAmount", paymentAmount);
        console.log("[doSomethingETH] msg.value", msg.value);
        require(msg.value >= paymentAmount, "INSUFFICIENT_ETH");
        (bytes32 attrValue, uint256 epoch) = access.getAttributeETH{value: paymentAmount}(msg.sender, 1, _attribute);
        emit GetAttributeEvent(attrValue, epoch);
        return (attrValue, epoch);
    }
}
