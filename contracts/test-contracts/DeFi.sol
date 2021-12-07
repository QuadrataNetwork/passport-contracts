//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IQuadPassport.sol";

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
        uint256 paymentAmount = passport.calculatePaymentToken(_attribute, _tokenPayment);
        if (paymentAmount > 0) {
            IERC20(_tokenPayment).approve(address(passport), paymentAmount);
        }
        (bytes32 attrValue, uint256 epoch) = passport.getAttribute(msg.sender, 1, _attribute, _tokenPayment);
        emit GetAttributeEvent(attrValue, epoch);
        return (attrValue, epoch);
    }

    function doSomethingETH(bytes32 _attribute) public payable returns(bytes32, uint256) {
        uint256 paymentAmount = passport.calculatePaymentETH(_attribute);
        require(msg.value >= paymentAmount, "INSUFFICIENT_ETH");
        (bytes32 attrValue, uint256 epoch) = passport.getAttributeETH{value: paymentAmount}(msg.sender, 1, _attribute);
        emit GetAttributeEvent(attrValue, epoch);
        return (attrValue, epoch);
    }

    function doSomethingBatch(
        uint256[] calldata _tokenIds,
        bytes32[] calldata _attributes,
        address _tokenPayment
    ) public returns(bytes32[] memory,uint256[] memory) {
        for (uint256 i = 0; i < _attributes.length; i++) {
            uint256 paymentAmount = passport.calculatePaymentToken(_attributes[i], _tokenPayment);
            if (paymentAmount > 0) {
                IERC20(_tokenPayment).approve(address(passport), paymentAmount);
            }
        }
        return passport.getBatchAttributes(msg.sender, _tokenIds, _attributes, _tokenPayment);
    }

    function doSomethingBatchETH(
        uint256[] calldata _tokenIds,
        bytes32[] calldata _attributes
    ) public payable returns(bytes32[] memory,uint256[] memory) {
        uint256 paymentAmountETH;
        for (uint256 i = 0; i < _attributes.length; i++)
            paymentAmountETH += passport.calculatePaymentETH(_attributes[i]);
        require(msg.value >= paymentAmountETH, "INSUFFICIENT_ETH");
        return passport.getBatchAttributesETH(msg.sender, _tokenIds, _attributes);
    }
}
