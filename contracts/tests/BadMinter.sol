//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IQuadPassport.sol";
import "../storage/QuadPassportStore.sol";

contract BadMinter {
    constructor(address _passport, QuadPassportStore.MintConfig memory _config, bytes memory _sigIssuer, bytes memory _sigAccount) payable {
        // The sender (ie BadMinter) will have a code length of 0 since it's called via constructor
        // IQuadPassport(_passport).mintPassport{value: msg.value}(_config, _sigIssuer, _sigAccount);
        // TODO: LOOK INTO LATER
        bytes32[] memory _attributeNames;
        bytes32[] memory _attributeValues;
        IQuadPassport(_passport).mintPassport{value: msg.value}(
            msg.sender,
            bytes32(0),
            _attributeNames,
            _attributeValues,
            1,
            1,
            _sigIssuer,
            _sigAccount);
    }
}
