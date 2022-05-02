//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IQuadPassport.sol";
import "../QuadReader.sol";
import "hardhat/console.sol";

contract DeFi {
    event GetAttributeEvent(bytes32 _value, uint256 _epoch);
    event GetAttributeEvents(bytes32[] _attributes, uint256[] _epochs);

    IQuadPassport public passport;
    QuadReader public reader;

    constructor(address _passport, QuadReader _reader) {
       passport = IQuadPassport(_passport);
       reader = _reader;
    }

    /**
        Legacy Do Somethings: still useful for many tests where there's only 1 issuer
     */
    function doSomething(
        bytes32 _attribute,
        address _tokenPayment
    ) public returns(bytes32,uint256) {
        uint256 paymentAmount = reader.calculatePaymentToken(_attribute, _tokenPayment, msg.sender);
        IERC20(_tokenPayment).transferFrom(msg.sender, address(this), paymentAmount);
        IERC20(_tokenPayment).approve(address(reader), paymentAmount);
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributesExcluding(msg.sender, 1, _attribute, _tokenPayment, new address[](0));
        emit GetAttributeEvent(attrValue[0], epoch[0]);
        return (attrValue[0], epoch[0]);
    }

    function doSomethingFree(
        bytes32 _attribute
    ) public returns(bytes32,uint256) {
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributesFreeExcluding(msg.sender, 1, _attribute, new address[](0));
        emit GetAttributeEvent(attrValue[0], epoch[0]);
        return (attrValue[0], epoch[0]);
    }

    function doSomethingETH(bytes32 _attribute) public payable returns(bytes32, uint256) {
        uint256 paymentAmount = reader.calculatePaymentETH(_attribute, msg.sender);
        require(msg.value >= paymentAmount, "INSUFFICIENT_ETH");
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributesETHExcluding{value: paymentAmount}(msg.sender, 1, _attribute, new address[](0));
        emit GetAttributeEvent(attrValue[0], epoch[0]);
        return (attrValue[0], epoch[0]);
    }


    /**
        Do Something (Excluding)
    */
    function doSomethingExcluding(
        bytes32 _attribute,
        address _tokenPayment,
        address[] calldata _excludedIssuers
    ) public returns(bytes32[] memory, uint256[] memory) {
        uint256 paymentAmount = reader.calculatePaymentToken(_attribute, _tokenPayment, msg.sender);
        IERC20(_tokenPayment).transferFrom(msg.sender, address(this), paymentAmount);
        IERC20(_tokenPayment).approve(address(reader), paymentAmount);
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributesExcluding(msg.sender, 1, _attribute, _tokenPayment, _excludedIssuers);
        emit GetAttributeEvents(attrValue, epoch);
        return (attrValue, epoch);
    }


    function doSomethingFreeExcluding(
        bytes32 _attribute,
        address[] calldata _excludedIssuers
    ) public returns(bytes32[] memory, uint256[] memory) {
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributesFreeExcluding(msg.sender, 1, _attribute, _excludedIssuers);
        emit GetAttributeEvents(attrValue, epoch);
        return (attrValue, epoch);
    }

    function doSomethingETHExcluding(
        bytes32 _attribute,
        address[] calldata _excludedIssuers
    ) public payable returns(bytes32[] memory, uint256[] memory) {
        uint256 paymentAmount = reader.calculatePaymentETH(_attribute, msg.sender);
        require(msg.value >= paymentAmount, "INSUFFICIENT_ETH");
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributesETHExcluding{value: paymentAmount}(msg.sender, 1, _attribute, _excludedIssuers);
        emit GetAttributeEvents(attrValue, epoch);
        return (attrValue, epoch);
    }
    /**
        Do Something (Excluding-Wrappers)
    */
    function doSomethingWrapper(
        bytes32 _attribute,
        address _tokenPayment
    ) public returns(bytes32[] memory, uint256[] memory) {
        uint256 paymentAmount = reader.calculatePaymentToken(_attribute, _tokenPayment, msg.sender);
        IERC20(_tokenPayment).transferFrom(msg.sender, address(this), paymentAmount);
        IERC20(_tokenPayment).approve(address(reader), paymentAmount);
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributes(msg.sender, 1, _attribute, _tokenPayment);
        emit GetAttributeEvents(attrValue, epoch);
        return (attrValue, epoch);
    }

    function doSomethingFreeWrapper(
        bytes32 _attribute
    ) public returns(bytes32[] memory, uint256[] memory) {
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributesFree(msg.sender, 1, _attribute);
        emit GetAttributeEvents(attrValue, epoch);
        return (attrValue, epoch);
    }

    function doSomethingETHWrapper(
        bytes32 _attribute
    ) public payable returns(bytes32[] memory, uint256[] memory) {
        uint256 paymentAmount = reader.calculatePaymentETH(_attribute, msg.sender);
        require(msg.value >= paymentAmount, "INSUFFICIENT_ETH");
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributesETH{value: paymentAmount}(msg.sender, 1, _attribute);
        emit GetAttributeEvents(attrValue, epoch);
        return (attrValue, epoch);
    }

    /**
        Do Something (Including)
    */
    function doSomethingIncluding(
        bytes32 _attribute,
        address _tokenPayment,
        address[] calldata _includedIssuers,
        uint256 paymentAmount
    ) public returns(bytes32[] memory, uint256[] memory) {
        IERC20(_tokenPayment).transferFrom(msg.sender, address(this), paymentAmount);
        IERC20(_tokenPayment).approve(address(reader), paymentAmount);
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributesIncludingOnly(msg.sender, 1, _attribute, _tokenPayment, _includedIssuers);
        emit GetAttributeEvents(attrValue, epoch);
        return (attrValue, epoch);
    }


    function doSomethingFreeIncluding(
        bytes32 _attribute,
        address[] calldata _includedIssuers
    ) public returns(bytes32[] memory, uint256[] memory) {
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributesFreeIncludingOnly(msg.sender, 1, _attribute, _includedIssuers);
        emit GetAttributeEvents(attrValue, epoch);
        return (attrValue, epoch);
    }

    function doSomethingETHIncluding(
        bytes32 _attribute,
        address[] calldata _includedIssuers
    ) public payable returns(bytes32[] memory, uint256[] memory) {
        uint256 paymentAmount = reader.calculatePaymentETH(_attribute, msg.sender);
        require(msg.value >= paymentAmount, "INSUFFICIENT_ETH");
        (bytes32[] memory attrValue, uint256[] memory epoch,) = reader.getAttributesETHIncludingOnly{value: paymentAmount}(msg.sender, 1, _attribute, _includedIssuers);
        emit GetAttributeEvents(attrValue, epoch);
        return (attrValue, epoch);
    }
}
