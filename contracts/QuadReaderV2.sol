//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";

import "./interfaces/IQuadPassport.sol";
import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadReaderV2.sol";
import "./storage/QuadReaderStore.sol";
import "./storage/QuadPassportStore.sol";
import "./storage/QuadGovernanceStore.sol";
import "hardhat/console.sol";

/// @title Data Reader Contract for Quadrata Passport
/// @author Fabrice Cheng, Theodore Clapp
/// @notice All accessor functions for reading and pricing quadrata attributes

 contract QuadReaderV2 is IQuadReaderV2, UUPSUpgradeable, ReentrancyGuardUpgradeable, QuadReaderStore {
     using SafeERC20Upgradeable for IERC20MetadataUpgradeable;

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

        governance = IQuadGovernance(_governance);
        passport = IQuadPassport(_passport);
    }

    function _authorizeUpgrade(address) internal view override {
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }

    /// @notice Query the values of an attribute for a passport holder (payable ETH)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _excluded The list of issuers to ignore. Keep empty for full list
    /// @return the values of an attribute from all issuers ignoring the excluded list
    function getAttributesExcludingV2(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] memory _excluded
    ) public override payable returns(bytes32[] memory, uint256[] memory, address[] memory) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _getAllAttributes(_account, _attribute, _excludedIssuers(_excluded));

        _checkPayments(_attribute, _account);

        return (attributes, epochs, issuers);
    }

    /// @notice Get all values of an attribute for a passport holder (payable ETH)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @return all values from all issuers
    function getAttributesV2(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    )external override payable returns(bytes32[] memory, uint256[] memory, address[] memory) {
        return getAttributesExcludingV2(_account, _tokenId, _attribute, new address[](0));
    }

    function getAttributeV2(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    ) external payable returns (bytes32, uint256, address) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        (bytes32 _value, uint256 _epoch, address _issuer) = _getSingleAttribute(_account, _attribute, _excludedIssuers(new address[](0)));

        _checkPayments(_attribute, _account);

        return (_value, _epoch, _issuer);
    }

    function getAttributeValueV2(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    ) external payable returns (bytes32) {
        _validateAttributeQuery(_account, _tokenId, _attribute);

        bytes32 _value = _getSingleAttributeValue(_account, _attribute, _excludedIssuers(new address[](0)));

        _checkPayments(_attribute, _account);

        return _value;
    }

    /// @notice Query the values of an attribute for a passport holder (Payable ETH)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _onlyIssuers The list of issuers to query from. If empty, nothing is returned
    /// @return the values of the attribute from the specified subset list `_issuers` of all issuers
    function getAttributesIncludingOnlyV2(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _onlyIssuers
    ) external override payable returns(bytes32[] memory, uint256[] memory, address[] memory) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _getAllAttributes(_account, _attribute, _includedIssuers(_onlyIssuers));

        _checkPayments(_attribute, _account);

        return (attributes, epochs, issuers);
    }

    /// @notice removes `_issuers` if they are deactivated
    /// @param _issuers The list of issuers to include
    /// @return `_issuers` - deactivated issuers
    function _includedIssuers(
        address[] calldata _issuers
    ) internal view returns(address[] memory) {
        address[] memory issuers = _issuers;

        uint256 gaps = 0;
        for(uint256 i = 0; i < issuers.length; i++) {
            if(governance.getIssuerStatus(_issuers[i]) == QuadGovernanceStore.IssuerStatus.DEACTIVATED) {
                issuers[i] = address(0);
                gaps++;
            }
        }


        address[] memory newIssuers = new address[](issuers.length - gaps);
        uint256 formattedIndex = 0;
        for(uint256 i = 0; i < issuers.length; i++) {
            if(issuers[i] == address(0)){
                continue;
            }

            newIssuers[formattedIndex++] = issuers[i];
        }

        return newIssuers;
    }

    /// @notice removes `_issuers` from the full list of supported issuers
    /// @param _issuers The list of issuers to remove
    /// @return the subset of `governance.issuers` - `_issuers`
    function _excludedIssuers(
        address[] memory _issuers
    ) internal view returns(address[] memory) {
        QuadGovernanceStore.Issuer[] memory issuerData = governance.getIssuers();
        address[] memory issuers = new address[](governance.getIssuersLength());

        uint256 gaps = 0;
        for(uint256 i = 0; i < issuers.length; i++) {
            if(issuerData[i].status == QuadGovernanceStore.IssuerStatus.DEACTIVATED) {
                gaps++;
                continue;
            }
            issuers[i] = issuerData[i].issuer;
            for(uint256 j = 0; j < _issuers.length; j++) {
                if(issuers[i] == _issuers[j]) {
                    issuers[i] = address(0);
                    gaps++;
                    break;
                }
            }
        }

        // close the gap(s)
        uint256 newLength = governance.getIssuersLength() - gaps;

        address[] memory newIssuers  = new address[](newLength);
        uint256 formattedIndex = 0;
        for(uint256 i = 0; i < issuers.length; i++) {
            if(issuers[i] == address(0)){
                continue;
            }

            newIssuers[formattedIndex++] = issuers[i];
        }
        return newIssuers;
    }

    /// @notice creates a list of attribute values from filtered issuers that have attested to the data.
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _issuers The list of issuers to query from. If they haven't issued anything, they are removed
    /// @return the filtered non-null values
    function _getSingleAttribute(
        address _account,
        bytes32 _attribute,
        address[] memory _issuers
    ) internal view returns (bytes32, uint256, address) {
        QuadPassportStore.Attribute memory attribute;
        for(uint256 i = 0; i < _issuers.length; i++) {
            if(governance.eligibleAttributesByDID(_attribute)) {
                if(!_isDataAvailable(_account,keccak256("DID"),_issuers[i])) {
                    continue;
                }
                QuadPassportStore.Attribute memory dID = passport.attributes(_account, keccak256("DID"), _issuers[i]);
                if(!_isDataAvailableByDID(dID.value, _attribute, _issuers[i])) {
                    continue;
                }

                attribute = passport.attributesByDID(dID.value,_attribute, _issuers[i]);
                return (attribute.value, attribute.epoch, _issuers[i]);
            }

            if (!_isDataAvailable(_account, _attribute, _issuers[i])) {
                continue;
            }

            attribute = passport.attributes(_account,_attribute, _issuers[i]);
            return (attribute.value, attribute.epoch, _issuers[i]);
        }
        return (bytes32(0), uint256(0), address(0));
    }


    function _getSingleAttributeValue(
        address _account,
        bytes32 _attribute,
        address[] memory _issuers
    ) internal view returns (bytes32) {
        QuadPassportStore.Attribute memory attribute;
        for(uint256 i = 0; i < _issuers.length; i++) {
            if(governance.eligibleAttributesByDID(_attribute)) {
                if(!_isDataAvailable(_account,keccak256("DID"),_issuers[i])) {
                    continue;
                }
                QuadPassportStore.Attribute memory dID = passport.attributes(_account, keccak256("DID"), _issuers[i]);
                if(!_isDataAvailableByDID(dID.value, _attribute, _issuers[i])) {
                    continue;
                }

                attribute = passport.attributesByDID(dID.value,_attribute, _issuers[i]);
                return attribute.value;
            }

            if (!_isDataAvailable(_account, _attribute, _issuers[i])) {
                continue;
            }

            attribute = passport.attributes(_account,_attribute, _issuers[i]);
            return attribute.value;
        }
        return bytes32(0);
    }

    /// @notice creates a list of attribute values from filtered issuers that have attested to the data.
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _issuers The list of issuers to query from. If they haven't issued anything, they are removed
    /// @return the filtered non-null values
    function _getAllAttributes(
        address _account,
        bytes32 _attribute,
        address[] memory _issuers
    ) internal view returns (bytes32[] memory, uint256[] memory, address[] memory) {
        // find gap values
        ApplyFilterVars memory vars;
        for(uint256 i = 0; i < _issuers.length; i++) {
            if(governance.eligibleAttributes(_attribute)) {
                if(!_isDataAvailable(_account, _attribute, _issuers[i])) {
                    vars.gaps++;
                }
            } else if(governance.eligibleAttributesByDID(_attribute)) {
                if(!_isDataAvailable(_account,keccak256("DID"),_issuers[i])) {

                    vars.gaps++;
                    continue;
                }
                QuadPassportStore.Attribute memory dID = passport.attributes(_account,keccak256("DID"), _issuers[i]);
                if(!_isDataAvailableByDID(dID.value, _attribute, _issuers[i])) {
                    vars.gaps++;
                }
            }
        }

        vars.delta = _issuers.length - vars.gaps;

        bytes32[] memory attributes = new bytes32[](vars.delta);
        uint256[] memory epochs = new uint256[](vars.delta);
        address[] memory issuers = new address[](vars.delta);
        QuadPassportStore.Attribute memory attribute;
        for(uint256 i = 0; i < _issuers.length; i++) {
            if(governance.eligibleAttributesByDID(_attribute)) {
                if(!_isDataAvailable(_account,keccak256("DID"),_issuers[i])) {
                    continue;
                }
                QuadPassportStore.Attribute memory dID = passport.attributes(_account, keccak256("DID"), _issuers[i]);
                if(!_isDataAvailableByDID(dID.value, _attribute, _issuers[i])) {
                    continue;
                }

                attribute = passport.attributesByDID(dID.value,_attribute, _issuers[i]);
                attributes[vars.filteredIndex] = attribute.value;
                epochs[vars.filteredIndex] = attribute.epoch;
                issuers[vars.filteredIndex] = _issuers[i];
                vars.filteredIndex++;
                continue;
            }

            if(!_isDataAvailable(_account, _attribute, _issuers[i])) {
                continue;
            }

            attribute = passport.attributes(_account,_attribute, _issuers[i]);
            attributes[vars.filteredIndex] = attribute.value;
            epochs[vars.filteredIndex] = attribute.epoch;
            issuers[vars.filteredIndex] = _issuers[i];
            vars.filteredIndex++;
        }

        return (attributes, epochs, issuers);
    }

    /// @notice safty checks for all getAttribute functions
    /// @param _account address of the passport holder to query
    /// @param _tokenId token id of erc1155
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    function _validateAttributeQuery(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    ) internal view {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(passport.balanceOf(_account, _tokenId) == 1, "PASSPORT_DOES_NOT_EXIST");
        require(governance.eligibleAttributes(_attribute)
            || governance.eligibleAttributesByDID(_attribute),
            "ATTRIBUTE_NOT_ELIGIBLE"
        );
    }

    /// @notice Distribute the fee to query an attribute to issuers and protocol
    /// @dev If 0 issuers are able to provide data, 100% of fee goes to quadrata
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _account The account used for figuring how much it will cost to query
    function _checkPayments(
        bytes32 _attribute,
        address _account
    ) internal nonReentrant {
        uint256 amountETH = calculatePaymentETH(_attribute, _account);
        require(
             msg.value == amountETH,
            "INSUFFICIENT_PAYMENT_AMOUNT"
        );
    }

    /// @dev Calculate the amount of $ETH required to call `getAttributeETH`
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _account account getting requested for attributes
    /// @return the amount of $ETH necessary to query the attribute
    function calculatePaymentETH(
        bytes32 _attribute,
        address _account
    ) public override view returns(uint256) {
        if (passport.attributeBusiness(_account).value)
             return governance.pricePerBusinessAttribute(_attribute);

        return governance.pricePerAttribute(_attribute);
    }

    /// @dev Used to determine if issuer has returned something useful
    /// @param _account the value to check existence on
    /// @param _attribute the value to check existence on
    /// @param _issuer the issuer in question
    /// @return whether or not we found a value
    function _isDataAvailable(
        address _account,
        bytes32 _attribute,
        address _issuer
    ) internal view returns(bool) {
        QuadPassportStore.Attribute memory attrib = passport.attributes(_account, _attribute, _issuer);
        return attrib.value != bytes32(0) && attrib.epoch != 0;
    }

    /// @dev Used to determine if issuer has returned something useful
    /// @param _dID the value to check existsance on
    /// @param _attribute the value to check existsance on
    /// @param _issuer the issuer in question
    /// @return whether or not we found a value
    function _isDataAvailableByDID(
        bytes32 _dID,
        bytes32 _attribute,
        address _issuer
    ) internal view returns(bool) {
        QuadPassportStore.Attribute memory attrib = passport.attributesByDID(_dID, _attribute, _issuer);
        return attrib.value != bytes32(0) && attrib.epoch != 0;
    }
 }
