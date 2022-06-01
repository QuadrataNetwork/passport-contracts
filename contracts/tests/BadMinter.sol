pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IQuadPassport.sol";
import "../storage/QuadPassportStore.sol";

contract BadMinter {
    constructor(address _passport, QuadPassportStore.MintConfig memory _config, bytes memory _sigIssuer, bytes memory _sigAccount) payable {
        IQuadPassport(_passport).mintPassport{value: msg.value}(_config, _sigIssuer, _sigAccount);
    }
}