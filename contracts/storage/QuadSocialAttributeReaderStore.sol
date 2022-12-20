//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "../interfaces/IQuadReader.sol";
import "../interfaces/IQuadGovernance.sol";

import "./QuadConstant.sol";

contract QuadSocialAttributeReaderStore is QuadConstant{
    event QueryFeeReceipt(address indexed _receiver, uint256 _fee);
    event WithdrawEvent(address indexed _governance, address indexed _treasury, uint256 _amount);

    // keccak256(userAddress, attrType))
    mapping(bytes32=>IQuadPassportStore.Attribute) internal _attributeStorage;
    mapping(address=>mapping(bytes32=>bool)) public allowList;
    mapping(address=>mapping(bytes32=>bool)) public revokedAttributes;
    mapping(bytes32=>uint256) public queryFeeMap;

    uint256 public quadrataFee;

    IQuadGovernance public governance;
    IQuadReader public reader;
}
