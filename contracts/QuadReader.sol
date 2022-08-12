//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";

import "./interfaces/IQuadPassport.sol";
import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadReader.sol";
import "./storage/QuadReaderStore.sol";
import "./storage/QuadPassportStore.sol";
import "./storage/QuadGovernanceStore.sol";
import "hardhat/console.sol";

/// @title Data Reader Contract for Quadrata Passport
/// @author Fabrice Cheng, Theodore Clapp
/// @notice All accessor functions for reading and pricing quadrata attributes

 contract QuadReader is IQuadReader, UUPSUpgradeable, ReentrancyGuardUpgradeable, QuadReaderStore {
     bytes32 constant ATTRIBUTE_IS_BUSINESS = 0xaf369ce728c816785c72f1ff0222ca9553b2cb93729d6a803be6af0d2369239b;
     using SafeERC20Upgradeable for IERC20MetadataUpgradeable;
     event QueryEvent(address indexed _account, address indexed _source, bytes32 _attribute);
     event QueryFeeReceipt(address indexed _issuer, uint256 _fee);

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

    /// @notice Query the values of an attribute for a passport holder (payable with ERC20)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenAddr address of the ERC20 token to use as a payment
    /// @param _excluded The list of issuers to ignore. Keep empty for full list
    /// @return the values of the attribute from all issuers ignoring the excluded list
    function getAttributesTokenExcluding(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr,
        address[] memory _excluded
    ) public override returns(bytes32[] memory, uint256[] memory, address[] memory) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _applyFilter(_account, _attribute, _excludedIssuers(_excluded));

        _doTokenPayments(_attribute, _tokenAddr, issuers, _account);

        return (attributes, epochs, issuers);
    }

    /// @notice Query the values of an attribute for a passport holder (free)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _excluded The list of issuers to ignore. Keep empty for full list
    /// @return the values of the attribute from all issuers ignoring the excluded list
    function getAttributesFreeExcluding(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] memory _excluded
    ) public override view returns(bytes32[] memory, uint256[] memory, address[] memory) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        require(governance.pricePerAttribute(_attribute) == 0, "ATTRIBUTE_NOT_FREE");
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) =  _applyFilter(_account, _attribute, _excludedIssuers(_excluded));
        return (attributes, epochs, issuers);
    }

    /// @notice Query the values of an attribute for a passport holder (payable ETH)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _excluded The list of issuers to ignore. Keep empty for full list
    /// @return the values of an attribute from all issuers ignoring the excluded list
    function getAttributesExcluding(
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
        ) = _applyFilter(_account, _attribute, _excludedIssuers(_excluded));

        // _doETHPayments(_attribute, issuers, _account);

        return (attributes, epochs, issuers);
    }

    /// @notice Get all values of an attribute for a passport holder (payable ETH)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @return all values from all issuers
    function getAttributes(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    )external override payable returns(bytes32[] memory, uint256[] memory, address[] memory) {
        return getAttributesExcluding(_account, _tokenId, _attribute, new address[](0));
    }

    /// @notice Get all values of an attribute for a passport holder (free)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @return all values of the the attribute from all issuers
    function getAttributesFree(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    )external override view returns(bytes32[] memory, uint256[] memory, address[] memory) {
        return getAttributesFreeExcluding(_account, _tokenId, _attribute, new address[](0));
    }

    /// @notice Get all values of an attribute for a passport holder (payable with ERC20)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenAddr address of the ERC20 token to use as a payment
    /// @return all values of the attribute from all issuers
    function getAttributesToken(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr
    )external override returns(bytes32[] memory, uint256[] memory, address[] memory) {
        return getAttributesTokenExcluding(_account, _tokenId, _attribute, _tokenAddr, new address[](0));
    }

    /// @notice Query the values of an attribute for a passport holder (payable ETH)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenAddr address of the ERC20 token to use as a payment
    /// @param _onlyIssuers The list of issuers to query from. If empty, nothing is returned
    /// @return the values of the attribute from the specified subset list `_issuers` of all issuers
    function getAttributesTokenIncludingOnly(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr,
        address[] calldata _onlyIssuers
    ) external override returns(bytes32[] memory, uint256[] memory, address[] memory) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _applyFilter(_account, _attribute, _includedIssuers(_onlyIssuers));

        _doTokenPayments(_attribute, _tokenAddr, issuers, _account);

        return (attributes, epochs, issuers);
    }

    /// @notice Query the values of an attribute for a passport holder (Free)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _onlyIssuers The list of issuers to query from. If empty, nothing is returned
    /// @return the values of the attribute from the specified subset list `_issuers` of all issuers
    function getAttributesFreeIncludingOnly(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _onlyIssuers
    ) external override view returns(bytes32[] memory, uint256[] memory, address[] memory) {
        require(governance.pricePerAttribute(_attribute) == 0, "ATTRIBUTE_NOT_FREE");
        _validateAttributeQuery(_account, _tokenId, _attribute);
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) =  _applyFilter(_account, _attribute, _includedIssuers(_onlyIssuers));

        return (attributes, epochs, issuers);
    }

    /// @notice Query the values of an attribute for a passport holder (Payable ETH)
    ///         lists length being returned are <= number of active passport issuers.
    ///         the list size is not expected to grow quickly since issuers are added via governance
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _onlyIssuers The list of issuers to query from. If empty, nothing is returned
    /// @return the values of the attribute from the specified subset list `_issuers` of all issuers
    function getAttributesIncludingOnly(
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
        ) = _applyFilter(_account, _attribute, _includedIssuers(_onlyIssuers));

        _doETHPayments(_attribute, issuers, _account);

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
    function _applyFilter(
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

        require(_safetyCheckIssuers(issuers), "NO_DATA_FOUND");

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
    /// @param _issuers The providers of the attributes
    /// @param _account The account used for figuring how much it will cost to query
    function _doETHPayments(
        bytes32 _attribute,
        address[] memory _issuers,
        address _account
    ) internal nonReentrant {
        uint256 amountETH = calculatePayment(_attribute, _account);
        if (amountETH > 0) {
            // TODO: Fix
            require(
                 msg.value >= amountETH,
                "INSUFFICIENT_PAYMENT_AMOUNT"
            );

            (bool sent,) = payable(address(passport)).call{value: amountETH}("");
            require(sent, "FAILED_TO_SEND_PAYMENT");

            uint256 amountIssuer = _issuers.length == 0 ? 0 : amountETH * governance.revSplitIssuer() / 1e2;
            uint256 amountProtocol = amountETH - amountIssuer;
            for(uint256 i = 0; i < _issuers.length; i++) {
                passport.increaseAccountBalanceETH(governance.issuersTreasury(_issuers[i]), amountIssuer / _issuers.length);
            }
            passport.increaseAccountBalanceETH(governance.treasury(), amountProtocol);
        }
    }

    /// @notice Distribute the fee to query an attribute to issuers and protocol
    /// @dev If 0 issuers are able to provide data, 100% of fee goes to quadrata
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenPayment address of erc20 payment method
    /// @param _issuers The providers of the attributes
    /// @param _account The account used for figuring how much it will cost to query
    function _doTokenPayments(
        bytes32 _attribute,
        address _tokenPayment,
        address[] memory _issuers,
        address _account
    ) internal nonReentrant {
        uint256 amountToken = calculatePaymentToken(_attribute, _tokenPayment, _account);
        if (amountToken > 0) {
            IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_tokenPayment);

            erc20.safeTransferFrom(msg.sender, address(passport), amountToken);

            uint256 amountIssuer = _issuers.length == 0 ? 0 : amountToken * governance.revSplitIssuer() / 10 ** 2;
            uint256 amountProtocol = amountToken - amountIssuer;
            for(uint256 i = 0; i < _issuers.length; i++) {
                passport.increaseAccountBalance(_tokenPayment,governance.issuersTreasury(_issuers[i]), amountIssuer / _issuers.length);
            }
            passport.increaseAccountBalance(_tokenPayment, governance.treasury(), amountProtocol);
        }
    }


    /// @dev Calculate the amount of token required to call `getAttribute`
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _tokenPayment address of the ERC20 tokens to use as payment
    /// @param _account account getting requested for attributes
    /// @return the amount of ERC20 necessary to query the attribute
    function calculatePaymentToken(
        bytes32 _attribute,
        address _tokenPayment,
        address _account
    ) public override view returns(uint256) {
        IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_tokenPayment);
        uint256 tokenPrice = governance.getPrice(_tokenPayment);

        uint256 price = _issuersContain(_account,keccak256("IS_BUSINESS")) == keccak256("TRUE") ? governance.pricePerBusinessAttribute(_attribute) : governance.pricePerAttribute(_attribute);
        // Convert to Token Decimal
        uint256 amountToken = (price * (10 ** (erc20.decimals())) / tokenPrice) ;
        return amountToken;
    }

    /// @dev Calculate the amount of $ETH required to call `getAttributeETH`
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _account account getting requested for attributes
    /// @return the amount of $ETH necessary to query the attribute
    function calculatePayment(
        bytes32 _attribute,
        address _account
    ) public override view returns(uint256) {
        return _issuersContain(_account, keccak256("IS_BUSINESS")) == keccak256("TRUE") ? governance.pricePerBusinessAttributeETH(_attribute) : governance.pricePerAttributeETH(_attribute);
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

    /// @dev Used to determine if issuers have an attribute
    /// @param _attribute the value to check existence on
    /// @param _account account getting requested for attributes
    /// @return unique bytes32 hash or bytes32(0) if issuers have the attribute
    function _issuersContain(
        address _account,
        bytes32 _attribute
    ) internal view returns(bytes32) {
        for(uint256 i = 0; i < governance.getIssuersLength(); i++) {
            bytes32 value = passport.attributes(_account, _attribute, governance.issuers(i).issuer).value;
            if(value != bytes32(0)) {
                return value;
            }
        }
        return bytes32(0);
    }

    /// @dev Used to determine if any of the attributes is valid
    /// @param _issuers the value to check existsance on
    /// @return whether or not we found a value
    function _safetyCheckIssuers(
        address[] memory _issuers
    ) internal pure returns(bool) {
        for(uint256 i = 0; i < _issuers.length; i++) {
            if(_issuers[i] == address(0))
                return false;
        }
        return true;
    }

    function getAttributes2(
        address _account, uint256 _tokenId, bytes32 _attribute
    ) external payable returns(QuadPassportStore.Attribute[] memory attributes) {
        _validateAttributeQuery(_account, _tokenId, _attribute);

        attributes = passport.attributes2(_account, _attribute);
        console.log(attributes.length);
        console.log(attributes[0].issuer);

        uint256 fee = passport.attributes2(_account, ATTRIBUTE_IS_BUSINESS)[0].value == keccak256("TRUE") ? governance.pricePerBusinessAttributeETH(_attribute) : governance.pricePerAttributeETH(_attribute);
        if (fee > 0) {
            // TODO: FIX to strict equal
            require(msg.value >= fee, "INVALID_QUERY_FEE");
            uint256 feeIssuer = attributes.length == 0 ? 0 : (fee * governance.revSplitIssuer() / 1e2) / attributes.length;

            // (bool sent,) = payable(address(passport)).call{value: fee}("");
            // require(sent, "FAILED_TO_SEND_PAYMENT");
            console.log(feeIssuer);

            for (uint256 i = 0; i < attributes.length; i++) {
                emit QueryFeeReceipt(attributes[i].issuer, feeIssuer);
                // passport.increaseAccountBalanceETH(governance.issuersTreasury(attributes[i].issuer), feeIssuer);
            }
            emit QueryFeeReceipt(governance.treasury(), fee - feeIssuer);
            // passport.increaseAccountBalanceETH(governance.treasury(), fee - feeIssuer);
        }
        emit QueryEvent(_account, msg.sender, _attribute);
    }

    function getAttributesBulk(
        address _account, uint256 _tokenId, bytes32[] calldata _attributes
    ) external payable returns(QuadPassportStore.Attribute[] memory) {
        QuadPassportStore.Attribute[] memory attributes = new QuadPassportStore.Attribute[](_attributes.length);
        uint256 totalFee;
        uint256 totalFeeIssuer;
        bool isBusiness = passport.attributes2(_account, ATTRIBUTE_IS_BUSINESS)[0].value == keccak256("TRUE");

        for (uint256 i = 0; i < _attributes.length; i++) {
            uint256 attrFee = isBusiness ? governance.pricePerBusinessAttributeETH(_attributes[i]) : governance.pricePerAttributeETH(_attributes[i]);
            totalFee += attrFee;
            _validateAttributeQuery(_account, _tokenId, _attributes[i]);

            (
                bytes32[] memory attrValues,
                uint256[] memory epoch,
                address[] memory issuer
            ) = _applyFilter(_account, _attributes[i], _excludedIssuers(new address[](0)));

            attributes[i] = QuadPassportStore.Attribute({
                value: attrValues[0],
                epoch: epoch[0],
                issuer: issuer[0]
            });

            uint256 feeIssuer = attrFee * governance.revSplitIssuer() / 1e2;
            totalFeeIssuer += feeIssuer;
            emit QueryFeeReceipt(governance.issuersTreasury(attributes[i].issuer), feeIssuer);
            // passport.increaseAccountBalanceETH(governance.issuersTreasury(attributes[i].issuer), feeIssuer);
        }
        // passport.increaseAccountBalanceETH(governance.treasury(), totalFee - totalFeeIssuer);
        emit QueryFeeReceipt(governance.treasury(), totalFee - totalFeeIssuer);
        require(msg.value >= totalFee," INVALID_QUERY_FEE");

        // (bool sent,) = payable(address(passport)).call{value: totalFee}("");
        // require(sent, "FAILED_TO_SEND_PAYMENT");
        return attributes;
    }

    function getAttributesBulk2(
        address _account, uint256 _tokenId, bytes32[] calldata _attributes
    ) external payable returns(QuadPassportStore.Attribute[] memory) {
        QuadPassportStore.Attribute[] memory attributes = new QuadPassportStore.Attribute[](_attributes.length);
        uint256 totalFee;
        uint256 totalFeeIssuer;
        bool isBusiness = passport.attributes2(_account, ATTRIBUTE_IS_BUSINESS)[0].value == keccak256("TRUE");

        for (uint256 i = 0; i < _attributes.length; i++) {
            uint256 attrFee = isBusiness ? governance.pricePerBusinessAttributeETH(_attributes[i]) : governance.pricePerAttributeETH(_attributes[i]);
            totalFee += attrFee;
            _validateAttributeQuery(_account, _tokenId, _attributes[i]);
            QuadPassportStore.Attribute memory attr = passport.attributes2(_account, _attributes[i])[0];
            attributes[i] = attr;

            uint256 feeIssuer = attrFee * governance.revSplitIssuer() / 1e2;
            totalFeeIssuer += feeIssuer;
            emit QueryFeeReceipt(governance.issuersTreasury(attr.issuer), feeIssuer);
            // passport.increaseAccountBalanceETH(governance.issuersTreasury(attr.issuer), feeIssuer);
        }
        // passport.increaseAccountBalanceETH(governance.treasury(), totalFee - totalFeeIssuer);
        emit QueryFeeReceipt(governance.treasury(), totalFee - totalFeeIssuer);
        require(msg.value >= totalFee," INVALID_QUERY_FEE");

        // (bool sent,) = payable(address(passport)).call{value: totalFee}("");
        // require(sent, "FAILED_TO_SEND_PAYMENT");
        return attributes;
    }
 }
