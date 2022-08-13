//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../interfaces/IQuadPassport.sol";
import "../storage/QuadPassportStore.sol";

contract BadMinter {
    constructor(address _passport, QuadPassportStore.AttributeSetterConfig memory _config, bytes memory _sigIssuer, bytes memory _sigAccount) payable {
        // The sender (ie BadMinter) will have a code length of 0 since it's called via constructor
        // IQuadPassport(_passport).mintPassport{value: msg.value}(_config, _sigIssuer, _sigAccount);
    }
}
