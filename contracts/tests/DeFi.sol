//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../interfaces/IQuadPassport.sol";
import "../storage/QuadPassportStore.sol";
import "../QuadReader.sol";

contract DeFi {
    event GetAttributesEvent(bytes32[] attrValues, uint256[] epochs, address[] issuers);
    event GetAttributesBulkEvent(bytes32[] attrValues, uint256[] epochs, address[] issuers);

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

    function depositLegacy(address _account, bytes32 _attribute)
    public payable returns(
        bytes32[] memory,
        uint256[] memory,
        address[] memory
    ) {
        (
            bytes32[] memory attrValues,
            uint256[] memory epochs,
            address[] memory issuers
        ) = reader.getAttributesLegacy{value: msg.value}(_account, _attribute);

        emit GetAttributesEvent(attrValues, epochs, issuers);

        return (attrValues, epochs, issuers);
    }

    function depositBulk(address _account, bytes32[] calldata _attributes) public payable returns(IQuadPassportStore.Attribute[] memory) {
        IQuadPassportStore.Attribute[] memory attributes = reader.getAttributesBulk{value: msg.value}(_account, _attributes);
        bytes32[] memory attrValues = new bytes32[](attributes.length);
        uint256[] memory epochs = new uint256[](attributes.length);
        address[] memory issuers = new address[](attributes.length);

        for (uint256 i = 0; i < attributes.length; i++) {
            attrValues[i] = attributes[i].value;
            epochs[i] = attributes[i].epoch;
            issuers[i] = attributes[i].issuer;
        }
        emit GetAttributesBulkEvent(attrValues, epochs, issuers);

        return attributes;
    }

    function depositBulkLegacy(address _account, bytes32[] calldata _attributes)
        public payable returns
    (
        bytes32[] memory,
        uint256[] memory,
        address[] memory
    ) {
        (
            bytes32[] memory attrValues,
            uint256[] memory epochs,
            address[] memory issuers
        ) = reader.getAttributesBulkLegacy{value: msg.value}(_account, _attributes);

        emit GetAttributesBulkEvent(attrValues, epochs, issuers);

        return (attrValues, epochs, issuers);
    }
}
