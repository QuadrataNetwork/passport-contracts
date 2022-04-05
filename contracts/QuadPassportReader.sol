//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./QuadPassport.sol";
import "./QuadGovernance.sol";


/// @title Data Reader Contract for Quadrata Passport
/// @author Fabrice Cheng, Theodore Clapp
/// @notice All accessor functions for reading and pricing quadrata attributes
contract QuadPassportReaderStore {

    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    QuadGovernance public governance;
    QuadPassport public passport;

}

 contract QuadPassportReader is UUPSUpgradeable, QuadPassportReaderStore {

    /// @dev initializer (constructor)
    /// @param _governance address of the QuadGovernance contract
    /// @param _passport address of the QuadPassport contract
    function initialize(
        address _governance,
        address _passport
    ) public initializer {
        require(_governance != address(0), "GOVERNANCE_ADDRESS_ZERO");
        require(_passport != address(0), "PASSPORT_ADDRESS_ZERO");

        governance = QuadGovernance(_governance);
        passport = QuadPassport(_passport);
    }

    function _authorizeUpgrade(address) internal view override {
        require(governance.hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }

    /// @notice Query the values of an attribute for a passport holder (payable with ERC20)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenAddr address of the ERC20 token to use as a payment
    /// @param _excludedIssuers The list of issuers to ignore. Keep empty for full list
    /// @return the values of the attribute from all issuers ignoring the excluded list
    function getAttributesExcluding(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr,
        address[] calldata _excludedIssuers
    ) external returns(bytes32[] memory, uint256[] memory, address[] memory) {
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _getAttributesFromExclusionFilterInternal(_account, _tokenId, _attribute, _excludedIssuers);

        _doTokenPayments(_attribute, _tokenAddr, issuers, _account);

        return (attributes, epochs, issuers);
    }

    /// @notice Query the values of an attribute for a passport holder (free)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _excludedIssuers The list of issuers to ignore. Keep empty for full list
    /// @return the values of the attribute from all issuers ignoring the excluded list
    function getAttributesFreeExcluding(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _excludedIssuers
    ) external view returns(bytes32[] memory, uint256[] memory, address[] memory) {
        require(governance.pricePerAttribute(_attribute) == 0, "ATTRIBUTE_NOT_FREE");
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _getAttributesFromExclusionFilterInternal(_account, _tokenId, _attribute, _excludedIssuers);
        return (attributes, epochs, issuers);
    }

    /// @notice Query the values of an attribute for a passport holder (payable ETH)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _excludedIssuers The list of issuers to ignore. Keep empty for full list
    /// @return the values of an attribute from all issuers ignoring the excluded list
    function getAttributesETHExcluding(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _excludedIssuers
    ) external payable returns(bytes32[] memory, uint256[] memory, address[] memory) {
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _getAttributesFromExclusionFilterInternal(_account, _tokenId, _attribute, _excludedIssuers);

        _doETHPayments(_attribute, issuers, _account);

        return (attributes, epochs, issuers);
    }

    /// @notice Query the values of an attribute for a passport holder (payable ETH)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenAddr address of the ERC20 token to use as a payment
    /// @param _onlyIssuers The list of issuers to query from
    /// @return the values of the attribute from the specified subset list `_issuers` of all issuers
    function getAttributesIncludingOnly(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr,
        address[] calldata _onlyIssuers
    ) external returns(bytes32[] memory, uint256[] memory, address[] memory) {

        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _getAttributesFromInclusionFilterInternal(_account, _tokenId, _attribute, _onlyIssuers);

        _doTokenPayments(_attribute, _tokenAddr, issuers, _account);

        return (attributes, epochs, issuers);
    }

    /// @notice Query the values of an attribute for a passport holder (Free)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _onlyIssuers The list of issuers to query from
    /// @return the values of the attribute from the specified subset list `_issuers` of all issuers
    function getAttributesFreeIncludingOnly(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _onlyIssuers
    ) external view returns(bytes32[] memory, uint256[] memory, address[] memory) {
        require(governance.pricePerAttribute(_attribute) == 0, "ATTRIBUTE_NOT_FREE");

        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _getAttributesFromInclusionFilterInternal(_account, _tokenId, _attribute, _onlyIssuers);

        return (attributes, epochs, issuers);
    }

    /// @notice Query the values of an attribute for a passport holder (Payable ETH)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _onlyIssuers The list of issuers to query from
    /// @return the values of the attribute from the specified subset list `_issuers` of all issuers
    function getAttributesETHIncludingOnly(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _onlyIssuers
    ) external payable returns(bytes32[] memory, uint256[] memory, address[] memory) {
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _getAttributesFromInclusionFilterInternal(_account, _tokenId, _attribute, _onlyIssuers);

        _doETHPayments(_attribute, issuers, _account);

        return (attributes, epochs, issuers);
    }

    function _getExcludedIssuers(
        address[] calldata _issuers
    ) internal view returns(address[] memory) {
        address[] memory issuers  = new address[](governance.getIssuersLength());

        uint256 continuations = 0;
        for(uint256 i = 0; i < governance.getIssuersLength(); i++) {
            if(_hasIssuer(governance.issuers(i), _issuers)) {
                continuations++;
                continue;
            }

            issuers[i] = governance.issuers(i);
        }

        // close the gap(s)
        uint256 newLength = governance.getIssuersLength() - continuations;

        address[] memory newIssuers  = new address[](newLength);
        uint256 formattedIndex = 0;
        for(uint256 i = 0; i < issuers.length; i++) {
            if(issuers[i] == address(0)){
                continue;
            }

            newIssuers[formattedIndex++] = issuers[i];
        }
        return issuers;
    }

    function _closeGaps(
        address _account,
        bytes32[] memory _attributes,
        uint256[] memory _epochs,
        address[] memory _issuers
    ) internal view returns(bytes32[] memory, uint256[] memory, address[] memory) {
        require(_issuers.length == _attributes.length && _issuers.length == _epochs.length, "ARRAY_LENGTH_MISMATCH");
        // find number of gaps
        uint256 gaps;
        for(uint256 i = 0; i < _issuers.length; i++) {
            if(!_isDataAvailable(_account, _attributes[i], _issuers[i])) {
                gaps++;
            }
        }
        bytes32[] memory newAttributes = new bytes32[](_issuers.length - gaps);
        uint256[] memory newEpochs = new uint256[](_issuers.length - gaps);
        address[] memory newIssuers  = new address[](_issuers.length - gaps);
        uint256 counter;
        // rewrite data into new trimmed arrays
        for(uint256 i = 0; i < _issuers.length; i++) {
            if(_isDataAvailable(_account, _attributes[i], _issuers[i])) {
                newAttributes[counter] = _attributes[i];
                newEpochs[counter] = _epochs[i];
                newIssuers[counter] = _issuers[i];
                counter++;
            }
        }

        return (newAttributes, newEpochs, newIssuers);
    }

    function _applyInclusionFilter(
        address _account,
        bytes32 _attribute,
        address[] calldata _issuers,
        bool _groupByDID
    )internal view returns (bytes32[] memory, uint256[] memory, address[] memory) {
        bytes32[] memory attributes = new bytes32[](_issuers.length);
        uint256[] memory epochs = new uint256[](_issuers.length);
        return _applyFilter(_account, _attribute, attributes, epochs, _issuers, _groupByDID);
    }

    function _applyExclusionFilter(
        address _account,
        bytes32 _attribute,
        address[] calldata _issuers,
        bool _groupByDID
    )internal view returns (bytes32[] memory, uint256[] memory, address[] memory) {
        (address[] memory issuers)  = _getExcludedIssuers(_issuers);
        bytes32[] memory attributes = new bytes32[](issuers.length);
        uint256[] memory epochs = new uint256[](issuers.length);
        return _applyFilter(_account, _attribute, attributes, epochs, issuers, _groupByDID);
    }

    function _applyFilter(
        address _account,
        bytes32 _attribute,
        bytes32[] memory _attributes,
        uint256[] memory _epochs,
        address[] memory _issuers,
        bool _groupByDID
    ) internal view returns (bytes32[] memory, uint256[] memory, address[] memory) {
        QuadPassport.Attribute memory attribute;
        for(uint256 i = 0; i < _issuers.length; i++) {
            if(_groupByDID) {
                QuadPassport.Attribute memory dID = passport.attributes(_account,keccak256("DID"),_issuers[i]);
                if(dID.value != bytes32(0)) {
                    continue;
                }

                attribute = passport.attributesByDID(dID.value,_attribute, _issuers[i]);
                _attributes[i] = attribute.value;
                _epochs[i] = attribute.epoch;
                continue;
            }


            attribute = passport.attributes(_account,_attribute, _issuers[i]);
            _attributes[i] = attribute.value;
            _epochs[i] = attribute.epoch;
        }

        if(_groupByDID) {
            require(_hasValidAttribute(_attributes), "DIDS_NOT_FOUND");
        }

        return _closeGaps(_account, _attributes, _epochs, _issuers);
    }

    function _getAttributesFromInclusionFilterInternal(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _issuers
    ) internal view returns(bytes32[] memory, uint256[] memory, address[] memory) {
        _getAttributesInternal(_account, _tokenId, _attribute);

        if (governance.eligibleAttributes(_attribute)) {
            return _applyInclusionFilter(_account, _attribute, _issuers, false);
        }

        // Attribute grouped by DID
        return _applyInclusionFilter(_account, _attribute, _issuers, true);
    }

    function _getAttributesFromExclusionFilterInternal(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _issuers
    ) internal view returns(bytes32[] memory, uint256[] memory, address[] memory) {
        _getAttributesInternal(_account, _tokenId, _attribute);

        if (governance.eligibleAttributes(_attribute)) {
            return _applyExclusionFilter(_account, _attribute, _issuers, false);
        }

        // Attribute grouped by DID
        return _applyExclusionFilter(_account, _attribute, _issuers, true);
    }

    function _getAttributesInternal(
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

    function _getAttributeInternal(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _issuer
    ) internal view returns(QuadPassport.Attribute memory) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(passport.balanceOf(_account, _tokenId) == 1, "PASSPORT_DOES_NOT_EXIST");
        require(governance.eligibleAttributes(_attribute)
            || governance.eligibleAttributesByDID(_attribute),
            "ATTRIBUTE_NOT_ELIGIBLE"

        );

        if (governance.eligibleAttributes(_attribute)) {
            return passport.attributes(_account,_attribute,_issuer);
        }

        // Attribute grouped by DID
        QuadPassport.Attribute memory attribute = passport.attributes(_account,keccak256("DID"),_issuer);
        require(attribute.value != bytes32(0), "DID_NOT_FOUND");
        return attribute;
    }


    function _doETHPayment(
        bytes32 _attribute,
        address _issuer,
        address _account
    ) internal {
        uint256 amountETH = calculatePaymentETH(_attribute, _account);
        if (amountETH > 0) {
            require(
                 msg.value == amountETH,
                "INSUFFICIENT_PAYMENT_AMOUNT"
            );
            uint256 amountIssuer = amountETH * governance.revSplitIssuer() / 1e2;
            uint256 amountProtocol = amountETH - amountIssuer;
            passport.accountBalancesETH(governance.issuersTreasury(_issuer), amountIssuer);
            passport.accountBalancesETH(governance.treasury(), amountProtocol);
        }
    }

    function _doETHPayments(
        bytes32 _attribute,
        address[] memory _issuers,
        address _account
    ) internal {
        uint256 amountETH = calculatePaymentETH(_attribute, _account) / _issuers.length;
        if (amountETH > 0) {
            require(
                 msg.value == amountETH,
                "INSUFFICIENT_PAYMENT_AMOUNT"
            );
            uint256 amountIssuer = amountETH * governance.revSplitIssuer() / 1e2;
            uint256 amountProtocol = amountETH - amountIssuer;
            for(uint256 i = 0; i < _issuers.length; i++) {
                passport.accountBalancesETH(governance.issuersTreasury(_issuers[i]), amountIssuer);
            }
            passport.accountBalancesETH(governance.treasury(), amountProtocol);
        }
    }

    function _doTokenPayments(
        bytes32 _attribute,
        address _tokenPayment,
        address[] memory _issuers,
        address _account
    ) internal {
        uint256 amountToken = calculatePaymentToken(_attribute, _tokenPayment, _account) / _issuers.length;
        if (amountToken > 0) {
            IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_tokenPayment);
            require(
                erc20.transferFrom(msg.sender, address(this), amountToken),
                "INSUFFICIENT_PAYMENT_ALLOWANCE"
            );
            uint256 amountIssuer = amountToken * governance.revSplitIssuer() / 10 ** 2;
            uint256 amountProtocol = amountToken - amountIssuer;
            for(uint256 i = 0; i < _issuers.length; i++) {
                passport.accountBalances(_tokenPayment,governance.issuersTreasury(_issuers[i]), amountIssuer);
            }
            passport.accountBalances(_tokenPayment,governance.treasury(), amountProtocol);
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
    ) public view returns(uint256) {
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
    ) public view returns(uint256) {
        uint256 tokenPrice = governance.getPriceETH();
        uint256 price = _issuersContain(_account,keccak256("IS_BUSINESS")) == keccak256("TRUE") ? governance.pricePerBusinessAttribute(_attribute) : governance.pricePerAttribute(_attribute);
        uint256 amountETH = (price * 1e18 / tokenPrice) ;
        return amountETH;
    }

    function _isDataAvailable(
        address _account,
        bytes32 _attribute,
        address _issuer
    ) internal view returns(bool) {
        QuadPassport.Attribute memory attrib = passport.attributes(_account, _attribute, _issuer);
        return attrib.value != bytes32(0) && attrib.epoch != 0;
    }

    /// @dev Used to determine if issuers have an attribute
    /// @param _attribute the value to check existsance on
    /// @param _account account getting requested for attributes
    /// @return unique bytes32 hash or bytes32(0) if issuers have the attribute
    function _issuersContain(
        address _account,
        bytes32 _attribute
    ) internal view returns(bytes32) {
        for(uint256 i = 0; i < governance.getIssuersLength(); i++) {
            bytes32 value = passport.attributes(_account, _attribute, governance.issuers(i)).value;
            if(value != bytes32(0)) {
                return value;
            }
        }
        return bytes32(0);
    }

    function _hasValidAttribute(
        bytes32[] memory attributes
    ) internal pure returns(bool) {
        for(uint256 i = 0; i < attributes.length; i++) {
            if(attributes[i] != bytes32(0))
                return true;
        }
        return false;
    }


    function _hasIssuer(
        address issuer,
        address[] memory issuers
    ) internal pure returns(bool) {
        for(uint256 i = 0; i < issuers.length; i++) {
            if(issuer == issuers[i])
                return true;
        }
        return false;
    }

 }