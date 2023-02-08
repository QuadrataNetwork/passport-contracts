//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "../interfaces/IQuadPassport.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";

import "./QuadConstant.sol";

contract QuadFEUtilsStore is QuadConstant{
    IQuadPassport public passport;
    IAccessControlUpgradeable public governance;
}