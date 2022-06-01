pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IQuadPassport.sol";
import "../storage/QuadPassportStore.sol";

contract BadMinter {
    constructor(address _passport, QuadPassportStore.MintConfig memory _config, bytes memory _sigIssuer, bytes memory _sigAccount) {
        IQuadPassport(_passport).mintPassport(_config, _sigIssuer, _sigAccount);
    }
}