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

    /// @dev Allow an authorized readers to get attribute information about a passport holder for a specific issuer
    /// @param _account address of user
    /// @param _attributes attributes to get respective non-value data from
    /// @return attributeNames list of attribute names encoded as keccack256("AML") for example
    /// @return issuers list of issuers for the attribute[i]
    /// @return issuedAts list of epochs for the attribute[i]
    function unsafeGetBalanceOfBulk(
        address _account,
        bytes32[] memory _attributes
    ) public view override returns (bytes32[] memory attributeNames, address[] memory issuers, uint256[] memory issuedAts) {

        // first pass calculate length
        uint256 attributeLength;
        for(uint256 i = 0; i < _attributes.length; i++) {
            IQuadPassportStore.Attribute[] memory attributes = passport.attributes(_account, _attributes[i]);
            attributeLength += attributes.length;
        }

        // allocate arrays
        attributeNames = new bytes32[](attributeLength);
        issuers = new address[](attributeLength);
        issuedAts = new uint256[](attributeLength);
        uint256 attributeIndex;

        // second pass fill arrays
        for(uint256 i = 0; i < _attributes.length; i++) {
            IQuadPassportStore.Attribute[] memory attributes = passport.attributes(_account, _attributes[i]);
            attributeLength += attributes.length;
            for(uint256 j = 0; j < attributes.length; j++) {
                attributeNames[attributeIndex] = _attributes[i];
                issuers[attributeIndex] = attributes[j].issuer;
                issuedAts[attributeIndex] = attributes[j].epoch;
                attributeIndex++;
            }
        }
    }


    /// @dev Allow an authorized readers to get attribute information about a passport holder for a specific issuer
    function _authorizeUpgrade(address) override internal view {
        require(governance.hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }


    /// @dev set the governance contract
    /// @param _governance address of the IQuadGovernance contract
    function setGovernance(address _governance) external {
        require(governance.hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
        require(_governance != address(0), "GOVERNANCE_ADDRESS_ZERO");
        governance = IAccessControlUpgradeable(_governance);
    }

    /// @dev set the passport contract
    /// @param _passport address of the IQuadPassport contract
    function setPassport(address _passport) external {
        require(governance.hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
        require(_passport != address(0), "PASSPORT_ADDRESS_ZERO");
        passport = IQuadPassport(_passport);
    }
}