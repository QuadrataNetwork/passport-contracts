//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Defi.sol";

contract MockBusiness {

    DeFi public defi;

    constructor(address _defi) {
        defi = DeFi(_defi);
    }

    function doSomethingAsBusiness(bytes32 _attribute) public returns(bytes32,uint256) {
        return defi.doSomethingETH(_attribute);
    }


    // Must be implemented otherwise tx will revert.
    // See here: https://eips.ethereum.org/EIPS/eip-1155
    function onERC1155Received(address _operator, address _from, uint256 _id, uint256 _value, bytes calldata _data) external returns(bytes4) {
        console.log("Contract Recieved Quadrata Passport NFT");
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }



}