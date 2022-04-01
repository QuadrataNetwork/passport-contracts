//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract QuadAccessStore {

    address public governance;
    address public passport;

}

 contract QuadAccess is UUPSUpgradeable, QuadAccessStore {

    /// @dev initializer (constructor)
    /// @param _governance address of the QuadGovernance contract
    /// @param _passport address of the QuadPassport contract
    function initialize(
        address _governance,
        address _passport
    ) public initializer {
        require(_governance != address(0), "GOVERNANCE_ADDRESS_ZERO");
        require(_passport != address(0), "PASSPORT_ADDRESS_ZERO");

        governance = _governance;
        passport = _passport;
    }


    function _authorizeUpgrade(address) internal view override {
        //require(governance.hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
    }
 }