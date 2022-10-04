//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract SelfDestruct is UUPSUpgradeable{
    constructor() {
    }

    function _authorizeUpgrade(address) internal view override {
    }
    function dangerZone() external {
        selfdestruct(payable(tx.origin));
    }
}
