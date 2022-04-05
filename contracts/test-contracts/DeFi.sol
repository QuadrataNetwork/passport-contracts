//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IQuadPassport.sol";
import "../QuadPassportReader.sol";
import "hardhat/console.sol";

contract DeFi {
    event GetAttributeEvent(bytes32 _value, uint256 _epoch);

    IQuadPassport public passport;
    QuadPassportReader public access;
    address[] public issuers;

    constructor(address _passport, QuadPassportReader _access, address[] memory _issuers) {
       passport = IQuadPassport(_passport);
       access = _access;
       issuers=  _issuers;
    }

    function doSomething(
        bytes32 _attribute,
        address _tokenPayment
    ) public returns(bytes32,uint256) {
        uint256 paymentAmount = access.calculatePaymentToken(_attribute, _tokenPayment, msg.sender);
        IERC20(_tokenPayment).transferFrom(msg.sender, address(this), paymentAmount);
        IERC20(_tokenPayment).approve(address(passport), paymentAmount);
        (bytes32[] memory attrValue, uint256[] memory epoch,) = access.getAttributesExcluding(msg.sender, 1, _attribute, _tokenPayment, issuers);
        emit GetAttributeEvent(attrValue[0], epoch[1]);
        return (attrValue[0], epoch[0]);
    }

    function doSomethingFree(
        bytes32 _attribute
    ) public returns(bytes32,uint256) {
        (bytes32[] memory attrValue, uint256[] memory epoch,) = access.getAttributesFreeExcluding(msg.sender, 1, _attribute, issuers);
        emit GetAttributeEvent(attrValue[0], epoch[0]);
        return (attrValue[0], epoch[0]);
    }

    function doSomethingETH(bytes32 _attribute) public payable returns(bytes32, uint256) {
        uint256 paymentAmount = access.calculatePaymentETH(_attribute, msg.sender);
        console.log("[doSomethingETH] paymentAmount", paymentAmount);
        console.log("[doSomethingETH] msg.value", msg.value);
        require(msg.value >= paymentAmount, "INSUFFICIENT_ETH");
        (bytes32[] memory attrValue, uint256[] memory epoch,) = access.getAttributesETHExcluding{value: paymentAmount}(msg.sender, 1, _attribute, issuers);
        emit GetAttributeEvent(attrValue[0], epoch[0]);
        return (attrValue[0], epoch[0]);
    }
}
