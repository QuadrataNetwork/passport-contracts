//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./interfaces/IQuadFEUtils.sol";
import "./storage/QuadFEUtilsStore.sol";

/// @title Quadrata Utility Contract for easier Frontend Integration
/// @author Theodore Clapp
/// @notice All admin functions to govern the QuadPassport contract
contract QuadFEUtils is IQuadFEUtils, UUPSUpgradeable, QuadFEUtilsStore {

    constructor() initializer {
        // used to prevent logic contract self destruct take over
    }

     /// @dev initializer (constructor)
    /// @param _governance address of the IQuadGovernance contract
    /// @param _passport address of the IQuadPassport contract
    function initialize(
        address _governance,
        address _passport
    ) public initializer {
        require(_governance != address(0), "GOVERNANCE_ADDRESS_ZERO");
        require(_passport != address(0), "PASSPORT_ADDRESS_ZERO");

        governance = IAccessControlUpgradeable(_governance);
        passport = IQuadPassport(_passport);
    }

    function unsafeGetBalanceOfBulk(
        address _account,
        bytes32[] memory _attributes
    ) public view override returns (bytes32[] memory attributeTypes, address[] memory issuers, uint256[] memory issuedAts) {

    }


    function _authorizeUpgrade(address) override internal view {
        require(governance.hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }

}