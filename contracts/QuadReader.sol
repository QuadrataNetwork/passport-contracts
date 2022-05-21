//SPDX-License-Identifier: MIT
pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./interfaces/IQuadPassport.sol";
import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadReader.sol";
import "./storage/QuadReaderStore.sol";
import "./storage/QuadPassportStore.sol";
import "./storage/QuadGovernanceStore.sol";

/// @title Data Reader Contract for Quadrata Passport
/// @author Fabrice Cheng, Theodore Clapp
/// @notice All accessor functions for reading and pricing quadrata attributes

 contract QuadReader is IQuadReader, UUPSUpgradeable, QuadReaderStore {

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
        require(governance.hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }

    /// @notice Query the values of an attribute for a passport holder (payable with ERC20)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenAddr address of the ERC20 token to use as a payment
    /// @param _excluded The list of issuers to ignore. Keep empty for full list
    /// @return the values of the attribute from all issuers ignoring the excluded list
    function getAttributesExcluding(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr,
        address[] memory _excluded
    ) public override returns(QuadPassportStore.Attribute[] memory) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        QuadPassportStore.Attribute[] memory bundle = _getExcludedBundle(_excluded, passport.getBundle(_account, _attribute));
        _doTokenPayments(_attribute, _tokenAddr, bundle, _account);
        return bundle;
    }

    /// @notice Query the values of an attribute for a passport holder (free)
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
    ) public override view returns(QuadPassportStore.Attribute[] memory ) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        require(governance.pricePerAttribute(_attribute) == 0, "ATTRIBUTE_NOT_FREE");
        QuadPassportStore.Attribute[] memory bundle = _getExcludedBundle(_excluded, passport.getBundle(_account, _attribute));
        return bundle;
    }

    /// @notice Query the values of an attribute for a passport holder (payable ETH)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _excluded The list of issuers to ignore. Keep empty for full list
    /// @return the values of an attribute from all issuers ignoring the excluded list
    function getAttributesETHExcluding(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] memory _excluded
    ) public override payable returns(QuadPassportStore.Attribute[] memory) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        QuadPassportStore.Attribute[] memory bundle = _getExcludedBundle(_excluded, passport.getBundle(_account, _attribute));
        _doETHPayments(_attribute, bundle, _account);
        return bundle;
    }

    /// @notice Get all values of an attribute for a passport holder (payable ETH)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @return all values from all issuers
    function getAttributesETH(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    )external override payable returns(QuadPassportStore.Attribute[] memory) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        QuadPassportStore.Attribute[] memory bundle = passport.getBundle(_account, _attribute);
        _doETHPayments(_attribute, bundle, _account);
        return bundle;
    }

    /// @notice Get all values of an attribute for a passport holder (free)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @return all values of the the attribute from all issuers
    function getAttributesFree(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute
    )external override view returns(QuadPassportStore.Attribute[] memory) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        require(governance.pricePerAttribute(_attribute) == 0, "ATTRIBUTE_NOT_FREE");
        QuadPassportStore.Attribute[] memory bundle = passport.getBundle(_account, _attribute);
        return bundle;
    }

    /// @notice Get all values of an attribute for a passport holder (payable with ERC20)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenAddr address of the ERC20 token to use as a payment
    /// @return all values of the attribute from all issuers
    function getAttributes(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr
    )external override returns(QuadPassportStore.Attribute[] memory) {
        _validateAttributeQuery(_account, _tokenId, _attribute);
        QuadPassportStore.Attribute[] memory bundle = passport.getBundle(_account, _attribute);
        _doTokenPayments(_attribute, _tokenAddr, bundle, _account);
        return bundle;
    }

    /// @notice Query the values of an attribute for a passport holder (payable ETH)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenAddr address of the ERC20 token to use as a payment
    /// @param _onlyIssuers The list of issuers to query from. If empty, nothing is returned
    /// @return the values of the attribute from the specified subset list `_issuers` of all issuers
    function getAttributesIncludingOnly(
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
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _onlyIssuers The list of issuers to query from. If empty, nothing is returned
    /// @return the values of the attribute from the specified subset list `_issuers` of all issuers
    function getAttributesETHIncludingOnly(
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
    /// @param _excludedIssuers The list of issuers to remove
    /// @return the subset of `governance.issuers` - `_issuers`
    function _getExcludedBundle(
        address[] memory _excludedIssuers,
        QuadPassportStore.Attribute[] memory _rawBundle
    ) internal view returns(QuadPassportStore.Attribute[] memory _bundle) {

        uint256 gaps = 0;
        for(uint256 i = 0; i < _rawBundle.length; i++) {
            if(governance.getIssuerStatus(_rawBundle[i].issuer) == QuadGovernanceStore.IssuerStatus.DEACTIVATED) {
                gaps++;
                delete _rawBundle[i];
                continue;
            }
            for(uint256 j = 0; j < _excludedIssuers.length; j++) {
                if(_rawBundle[i].issuer == _excludedIssuers[j]) {
                    gaps++;
                    delete _rawBundle[i];
                    break;
                }
            }
        }

        // close the gap(s)
        uint256 newLength = _rawBundle.length - gaps;
        QuadPassportStore.Attribute[] memory newBundle = new QuadPassportStore.Attribute[](newLength);

        uint256 formattedIndex = 0;
        for(uint256 i = 0; i < _rawBundle.length; i++) {
            if(_rawBundle[i] == 0) {
                continue;
            }
            newBundle[formattedIndex++] = _rawBundle[i];
        }
        return newBundle;
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

    /// @notice Distrubte the fee to query an attribute to issuers and protocol
    /// @dev If 0 issuers are able to provide data, 100% of fee goes to quadrata
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _bundle Used to access the providers of the attributes
    /// @param _account The account used for figuring how much it will cost to query
    function _doETHPayments(
        bytes32 _attribute,
        QuadPassportStore.Attribute[] memory _bundle,
        address _account
    ) internal {
        uint256 amountETH = calculatePaymentETH(_attribute, _account);
        if (amountETH > 0) {
            require(
                 msg.value == amountETH,
                "INSUFFICIENT_PAYMENT_AMOUNT"
            );
            require(
                payable(address(passport)).send(amountETH),
                "FAILED_TO_SEND_PAYMENT"
            );
            uint256 amountIssuer = _bundle.length == 0 ? 0 : amountETH * governance.revSplitIssuer() / 1e2;
            uint256 amountProtocol = amountETH - amountIssuer;
            for(uint256 i = 0; i < _bundle.length; i++) {
                passport.increaseAccountBalanceETH(governance.issuersTreasury(_bundle[i].issuer), amountIssuer / _bundle.length);
            }
            passport.increaseAccountBalanceETH(governance.treasury(), amountProtocol);
        }
    }

    /// @notice Distrubte the fee to query an attribute to issuers and protocol
    /// @dev If 0 issuers are able to provide data, 100% of fee goes to quadrata
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenPayment address of erc20 payment method
    /// @param _bundle Used to access the providers of the attributes
    /// @param _account The account used for figuring how much it will cost to query
    function _doTokenPayments(
        bytes32 _attribute,
        address _tokenPayment,
        QuadPassportStore.Attribute[] memory _bundle,
        address _account
    ) internal {
        uint256 amountToken = calculatePaymentToken(_attribute, _tokenPayment, _account);
        if (amountToken > 0) {
            IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_tokenPayment);
            require(
                erc20.transferFrom(msg.sender, address(passport), amountToken),
                "INSUFFICIENT_PAYMENT_ALLOWANCE"
            );
            uint256 amountIssuer = _bundle.length == 0 ? 0 : amountToken * governance.revSplitIssuer() / 10 ** 2;
            uint256 amountProtocol = amountToken - amountIssuer;
            for(uint256 i = 0; i < _bundle.length; i++) {
                passport.increaseAccountBalance(_tokenPayment,governance.issuersTreasury(_bundle[i].issuer), amountIssuer / _bundle.length);
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
    function calculatePaymentETH(
        bytes32 _attribute,
        address _account
    ) public override view returns(uint256) {
        uint256 tokenPrice = governance.getPriceETH();
        uint256 price = _issuersContain(_account,keccak256("IS_BUSINESS")) == keccak256("TRUE") ? governance.pricePerBusinessAttribute(_attribute) : governance.pricePerAttribute(_attribute);
        uint256 amountETH = (price * 1e18 / tokenPrice) ;
        return amountETH;
    }

    /// @dev Used to determine if issuers have an attribute
    /// @param _attribute the value to check existsance on
    /// @param _account account getting requested for attributes
    /// @return unique bytes32 hash or bytes32(0) if issuers have the attribute
    function _issuersContain(
        address _account,
        bytes32 _attribute
    ) internal view returns(bytes32) {
        QuadPassportStore.Attribute[] memory bundle = passport.getBundle(_account, _attribute);
        return bundle.length == 0 ? bytes32(0) : bundle[0].value;
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
 }