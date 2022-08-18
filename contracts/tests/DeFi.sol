//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

import "../interfaces/IQuadPassport.sol";
import "../storage/QuadPassportStore.sol";
import "../QuadReader.sol";

contract DeFi {
    event GetAttributesEvent(bytes32[] attrValues, uint256[] epochs, address[] issuers);

    IQuadPassport public passport;
    QuadReader public reader;

    constructor(address _passport, QuadReader _reader) {
       passport = IQuadPassport(_passport);
       reader = _reader;
    }

    function deposit(address _account, bytes32 _attribute) public payable returns(IQuadPassportStore.Attribute[] memory) {
        IQuadPassportStore.Attribute[] memory attributes = reader.getAttributes{value: msg.value}(_account, _attribute);
        bytes32[] memory attrValues = new bytes32[](attributes.length);
        uint256[] memory epochs = new uint256[](attributes.length);
        address[] memory issuers = new address[](attributes.length);

        for (uint256 i = 0; i < attributes.length; i++) {
            attrValues[i] = attributes[i].value;
            epochs[i] = attributes[i].epoch;
            issuers[i] = attributes[i].issuer;
        }
        emit GetAttributesEvent(attrValues, epochs, issuers);

        return attributes;
    }

    function depositLegacy(address _account, bytes32 _attribute) public payable returns(bytes32[] memory, uint256[] memory, address[] memory) {
        (
            bytes32[] memory attrValues,
            uint256[] memory epochs,
            address[] memory issuers
        ) = reader.getAttributesLegacy{value: msg.value}(_account, _attribute);

        emit GetAttributesEvent(attrValues, epochs, issuers);

        return (attrValues, epochs, issuers);
    }

    function queryMultipleAttributes(
        bytes32[] calldata _attributes
    ) public payable {
        uint256 paymentAmount;
        for (uint256 i = 0; i < _attributes.length; i++) {
            paymentAmount = reader.queryFee(msg.sender, _attributes[i]);

            QuadPassportStore.Attribute[] memory attributes = reader.getAttributes{value: paymentAmount}(
                msg.sender, _attributes[i]
            );
        }
    }

    function queryMultipleBulk(
        bytes32[] calldata _attributes
    ) public payable {
        uint256 paymentAmount = reader.queryFeeBulk(msg.sender, _attributes);
        QuadPassportStore.Attribute[] memory attributes = reader.getAttributesBulk{value: paymentAmount}(
            msg.sender, _attributes
        );
        console.log(attributes[0].epoch);
        console.log(attributes[0].issuer);
    }
}
