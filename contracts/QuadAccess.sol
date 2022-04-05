//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./QuadPassport.sol";
import "./QuadGovernance.sol";


/// @title Data Accessor Contract for Quadrata Passport
/// @author Fabrice Cheng, Theodore Clapp
/// @notice All accessor functions for reading and pricing quadrata attributes
contract QuadAccessStore {

    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    QuadGovernance public governance;
    QuadPassport public passport;

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

        governance = QuadGovernance(_governance);
        passport = QuadPassport(_passport);
    }

    function _authorizeUpgrade(address) internal view override {
        require(governance.hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }

    /// @notice Query the value of an attribute for a passport holder (pay with ETH)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @return the value of the attribute
    function getAttributeETH(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _issuer
    ) external payable returns(bytes32, uint256) {
        QuadPassport.Attribute memory attribute = _getAttributeInternal(_account, _tokenId, _attribute, _issuer);
        _doETHPayment(_attribute, attribute.issuer, _account);
        return (attribute.value, attribute.epoch);
    }

    /// @notice Query the value of an attribute for a passport holder (free)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @return the value of the attribute
    function getAttributeFree(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _issuer
    ) external view returns(bytes32, uint256) {
        require(governance.pricePerAttribute(_attribute) == 0, "ATTRIBUTE_NOT_FREE");
        QuadPassport.Attribute memory attribute = _getAttributeInternal(_account, _tokenId, _attribute, _issuer);
        return (attribute.value, attribute.epoch);
    }

    /// @notice Query the value of an attribute for a passport holder (payable with ERC20)
    /// @param _account address of the passport holder to query
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type to query (ex: keccak256("DID"))
    /// @param _tokenAddr address of the ERC20 token to use as a payment
    /// @return the value of the attribute
    function getAttribute(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr,
        address _issuer
    ) external returns(bytes32, uint256) {
        QuadPassport.Attribute memory attribute =  _getAttributeInternal(_account, _tokenId, _attribute, _issuer);
        _doTokenPayment(_attribute, _tokenAddr, attribute.issuer, _account);
        return (attribute.value, attribute.epoch);
    }

    function getAttributes(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address _tokenAddr,
        address[] calldata _exclusions
    ) external returns(bytes32[] memory, uint256[] memory, address[] memory) {
        (
            bytes32[] memory attributes,
            uint256[] memory epochs,
            address[] memory issuers
        ) = _getAttributesInternal(_account, _tokenId, _attribute, _exclusions);

        _doTokenPayments(_attribute, _tokenAddr, issuers, _account);

        return (attributes, epochs, issuers);
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

    function _hasValidAttribute(
        bytes32[] memory attributes
    ) internal pure returns(bool) {
        for(uint256 i = 0; i < attributes.length; i++) {
            if(attributes[i] != bytes32(0))
                return true;
        }
        return false;
    }

    function _getIncludedIssuers(
        address[] calldata _exclusions
    ) internal view returns(address[] memory) {
        address[] memory issuers  = new address[](governance.getIssuersLength());

        uint256 continuations = 0;
        for(uint256 i = 0; i < governance.getIssuersLength(); i++) {
            if(_hasIssuer(governance.issuers(i), _exclusions)) {
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
            if(!isDataAvailable(_account, _attributes[i], _issuers[i])) {
                gaps++;
            }
        }
        bytes32[] memory newAttributes = new bytes32[](_issuers.length - gaps);
        uint256[] memory newEpochs = new uint256[](_issuers.length - gaps);
        address[] memory newIssuers  = new address[](_issuers.length - gaps);
        uint256 counter;
        // rewrite data into new arrays
        for(uint256 i = 0; i < _issuers.length; i++) {
            if(isDataAvailable(_account, _attributes[i], _issuers[i])) {
                newAttributes[counter] = _attributes[i];
                newEpochs[counter] = _epochs[i];
                newIssuers[counter] = _issuers[i];
                counter++;
            }
        }

        return (newAttributes, newEpochs, newIssuers);
    }

    function _filterAttributes(
        address _account,
        bytes32 _attribute,
        address[] calldata _exclusions,
        bool groupByDID
    ) internal view returns (bytes32[] memory, uint256[] memory, address[] memory) {
        (address[] memory issuers)  = _getIncludedIssuers(_exclusions);

        bytes32[] memory attributes = new bytes32[](issuers.length);
        uint256[] memory epochs = new uint256[](issuers.length);

        QuadPassport.Attribute memory attribute;

        for(uint256 i = 0; i < issuers.length; i++) {
            if(groupByDID) {
                QuadPassport.Attribute memory dID = passport.attributes(_account,keccak256("DID"),issuers[i]);
                if(dID.value != bytes32(0)) {
                    continue;
                }

                attribute = passport.attributesByDID(dID.value,_attribute,issuers[i]);
                attributes[i] = attribute.value;
                epochs[i] = attribute.epoch;
                continue;
            }


            attribute = passport.attributes(_account,_attribute,issuers[i]);
            attributes[i] = attribute.value;
            epochs[i] = attribute.epoch;
        }

        if(groupByDID) {
            require(_hasValidAttribute(attributes), "DIDS_NOT_FOUND");
        }

        return _closeGaps(_account, attributes, epochs, issuers);
    }

    function _getAttributesInternal(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        address[] calldata _exclusions
    ) internal view returns(bytes32[] memory, uint256[] memory, address[] memory) {
        require(_account != address(0), "ACCOUNT_ADDRESS_ZERO");
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(passport.balanceOf(_account, _tokenId) == 1, "PASSPORT_DOES_NOT_EXIST");
        require(governance.eligibleAttributes(_attribute)
            || governance.eligibleAttributesByDID(_attribute),
            "ATTRIBUTE_NOT_ELIGIBLE"

        );


        if (governance.eligibleAttributes(_attribute)) {
            return _filterAttributes(_account, _attribute, _exclusions,false);
        }

        // Attribute grouped by DID
        return _filterAttributes(_account, _attribute, _exclusions, true);

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

    function _doTokenPayment(
        bytes32 _attribute,
        address _tokenPayment,
        address _issuer,
        address _account
    ) internal {
        uint256 amountToken = calculatePaymentToken(_attribute, _tokenPayment, _account);
        if (amountToken > 0) {
            IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_tokenPayment);
            require(
                erc20.transferFrom(msg.sender, address(this), amountToken),
                "INSUFFICIENT_PAYMENT_ALLOWANCE"
            );
            uint256 amountIssuer = amountToken * governance.revSplitIssuer() / 10 ** 2;
            uint256 amountProtocol = amountToken - amountIssuer;
            passport.accountBalances(_tokenPayment,governance.issuersTreasury(_issuer), amountIssuer);
            passport.accountBalances(_tokenPayment,governance.treasury(), amountProtocol);
        }
    }

    function _doTokenPayments(
        bytes32 _attribute,
        address _tokenPayment,
        address[] memory _issuers,
        address _account
    ) internal {
        //TODO: filter out issuers reporting null data for a given attribute to ensure they don't get paid
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

    /// @dev Used to determine if issuers have an attribute
    /// @param _attribute the value to check existsance on
    /// @param _account account getting requested for attributes
    /// @return unique bytes32 hash or bytes32(0) if issuers have the attribute
    function issuersContain(
        address _account,
        bytes32 _attribute
    ) public view returns(bytes32) {
        for(uint256 i = 0; i < governance.getIssuersLength(); i++) {
            bytes32 value = passport.attributes(_account, _attribute, governance.issuers(i)).value;
            if(value != bytes32(0)) {
                return value;
            }
        }
        return bytes32(0);
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

        uint256 price = issuersContain(_account,keccak256("IS_BUSINESS")) == keccak256("TRUE") ? governance.pricePerBusinessAttribute(_attribute) : governance.pricePerAttribute(_attribute);
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
        // TODO: Do we always  want to get IS_BUSINESS from Spring Labs?
        uint256 price = issuersContain(_account,keccak256("IS_BUSINESS")) == keccak256("TRUE") ? governance.pricePerBusinessAttribute(_attribute) : governance.pricePerAttribute(_attribute);
        uint256 amountETH = (price * 1e18 / tokenPrice) ;
        return amountETH;
    }

    function isDataAvailable(
        address _account,
        bytes32 _attribute,
        address _issuer
    ) internal view returns(bool) {
        QuadPassport.Attribute memory attrib = passport.attributes(_account, _attribute, _issuer);
        return attrib.value != bytes32(0) && attrib.epoch != 0;
    }

 }