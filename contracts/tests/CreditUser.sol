// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "../interfaces/IQuadReader.sol";

contract CreditUser {

    IQuadReader public quadReader;
    uint256 public threshold;

    constructor(address _quadReader) {
        quadReader = IQuadReader(_quadReader);
    }

    function deposit(bytes32 _attribute, uint256 _epoch, bytes memory sig) public payable {
        bool isGtThreshold = quadReader.getFlashAttributeGTE(
            msg.sender,
            address(this),
            _attribute,
            _epoch,
            threshold,
            sig
        );
        require(isGtThreshold, "CreditUser: Deposit Failed");
    }

    function setThreshold(uint256 _threshold) public {
        threshold = _threshold;
    }
}