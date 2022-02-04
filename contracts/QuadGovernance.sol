//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IQuadPassport.sol";
import "./interfaces/IUniswapAnchoredView.sol";

/// @title Governance Contract for Quadrata Passport
/// @author Fabrice Cheng
/// @notice All admin functions to govern the QuadPassport contract
contract QuadGovernanceStore {
    // Admin Functions
    bytes32[] public supportedAttributes;
    mapping(bytes32 => bool) public supportedAttributesHashSet;

    mapping(uint256 => bool) public eligibleTokenId;
    mapping(bytes32 => bool) public eligibleAttributes;
    mapping(bytes32 => bool) public eligibleAttributesByDID;
    // Price in $USD (1e6 decimals)
    mapping(bytes32 => uint256) public pricePerAttribute;
    // Price in $ETH
    mapping(bytes32 => uint256) public mintPricePerAttribute;

    mapping(address => bool) public eligibleTokenPayments;
    mapping(address => address) public issuersTreasury;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    uint256 public revSplitIssuer; // 50 means 50%;
    uint256 public passportVersion;
    uint256 public mintPrice; // Price in $ETH
    IQuadPassport public passport;
    address public oracle;
    address public treasury;
}

contract QuadGovernance is AccessControlUpgradeable, UUPSUpgradeable, QuadGovernanceStore {
    event AllowTokenPayment(address _tokenAddr, bool _isAllowed);
    event AttributePriceUpdated(bytes32 _attribute, uint256 _oldPrice, uint256 _price);
    event AttributeMintPriceUpdated(bytes32 _attribute, uint256 _oldPrice, uint256 _price);
    event EligibleTokenUpdated(uint256 _tokenId, bool _eligibleStatus);
    event EligibleAttributeUpdated(bytes32 _attribute, bool _eligibleStatus);
    event EligibleAttributeByDIDUpdated(bytes32 _attribute, bool _eligibleStatus);
    event IssuerAdded(address _issuer, address _newTreasury);
    event PassportAddressUpdated(address _oldAddress, address _address);
    event PassportVersionUpdated(uint256 _oldVersion, uint256 _version);
    event PassportMintPriceUpdated(uint256 _oldMintPrice, uint256 _mintPrice);
    event OracleUpdated(address _oldAddress, address _address);
    event RevenueSplitIssuerUpdated(uint256 _oldSplit, uint256 _split);
    event TreasuryUpdated(address _oldAddress, address _address);

    /// @dev Initializer (constructor)
    /// @param _admin address of the admin account
    function initialize(address _admin) public initializer {
        require(_admin != address(0), "ADMIN_ADDRESS_ZERO");

        eligibleTokenId[1] = true;   // INITIAL PASSPORT_ID
        passportVersion = 1;  // Passport Version

        // Add DID, COUNTRY, AML as valid attributes
        eligibleAttributes[keccak256("DID")] = true;
        eligibleAttributes[keccak256("COUNTRY")] = true;
        eligibleAttributesByDID[keccak256("AML")] = true;
        supportedAttributes.push(keccak256("DID"));
        supportedAttributes.push(keccak256("COUNTRY"));

        // Set pricing
        pricePerAttribute[keccak256("DID")] = 2 * 1e6; // $2
        pricePerAttribute[keccak256("COUNTRY")] = 1 * 1e6; // $1
        mintPricePerAttribute[keccak256("AML")] = 0.01 ether;
        mintPricePerAttribute[keccak256("COUNTRY")] = 0.01 ether;
        mintPrice = 0.01 ether;

        // Revenue split with issuers
        revSplitIssuer = 50;  // 50%

        // Set Roles
        _setRoleAdmin(PAUSER_ROLE, GOVERNANCE_ROLE);
        _setRoleAdmin(ISSUER_ROLE, GOVERNANCE_ROLE);
        _setupRole(GOVERNANCE_ROLE, _admin);
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    /// @dev Set QuadPassport treasury wallet to withdraw the protocol fees
    /// @notice Restricted behind a TimelockController
    /// @param _treasury address of the treasury
    function setTreasury(address _treasury) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_treasury != address(0), "TREASURY_ADDRESS_ZERO");
        require(_treasury != treasury, "TREASURY_ADDRESS_ALREADY_SET");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    /// @dev Set QuadPassport contract address
    /// @notice Restricted behind a TimelockController
    /// @param _passportAddr address of the QuadPassport contract
    function setPassportContractAddress(address _passportAddr) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_passportAddr != address(0), "PASSPORT_ADDRESS_ZERO");
        require(address(passport) != _passportAddr, "PASSPORT_ADDRESS_ALREADY_SET");
        address _oldPassport = address(passport);
        passport = IQuadPassport(_passportAddr);

        emit PassportAddressUpdated(_oldPassport, address(passport));
    }

    /// @dev Set the QuadGovernance address in the QuadPassport contract
    /// @notice Restricted behind a TimelockController
    /// @param _newGovernance address of the QuadGovernance contract
    function updateGovernanceInPassport(address _newGovernance) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_newGovernance != address(0), "GOVERNANCE_ADDRESS_ZERO");
        require(address(passport) != address(0), "PASSPORT_NOT_SET");

        passport.setGovernance(_newGovernance);
    }

    /// @dev Set the QuadPassport deployed version
    /// @notice Restricted behind a TimelockController
    /// @param _version current version of the QuadPassport
    function setPassportVersion(uint256 _version) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_version > passportVersion, "PASSPORT_VERSION_INCREMENTAL");

        uint256 oldVersion = passportVersion;
        passportVersion = _version;
        emit PassportVersionUpdated(oldVersion, passportVersion);
    }

    /// @dev Set the price for minting the QuadPassport
    /// @notice Restricted behind a TimelockController
    /// @param _mintPrice price in wei for minting a passport
    function setMintPrice(uint256 _mintPrice) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(mintPrice != _mintPrice, "MINT_PRICE_ALREADY_SET");

        uint256 oldMintPrice = mintPrice;
        mintPrice = _mintPrice;
        emit PassportMintPriceUpdated(oldMintPrice, mintPrice);
    }

    /// @dev Set the eligibility status for a tokenId passport
    /// @notice Restricted behind a TimelockController
    /// @param _tokenId tokenId of the passport
    /// @param _eligibleStatus eligiblity boolean for the tokenId
    function setEligibleTokenId(uint256 _tokenId, bool _eligibleStatus) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(eligibleTokenId[_tokenId] != _eligibleStatus, "TOKEN_ELIGIBILITY_ALREADY_SET");

        eligibleTokenId[_tokenId] = _eligibleStatus;
        emit EligibleTokenUpdated(_tokenId, _eligibleStatus);
    }

    /// @dev Set the eligibility status for an attribute type
    /// @notice Restricted behind a TimelockController
    /// @param _attribute keccak256 of the attribute name (ex: keccak256("COUNTRY"))
    /// @param _eligibleStatus eligiblity boolean for the attribute
    function setEligibleAttribute(bytes32 _attribute, bool _eligibleStatus) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(eligibleAttributes[_attribute] != _eligibleStatus, "ATTRIBUTE_ELIGIBILITY_SET");
        require(!supportedAttributesHashSet[_attribute], "ATTRIBUTE_ALREADY_SUPPORTED");

        eligibleAttributes[_attribute] = _eligibleStatus;
        if (_eligibleStatus) {
            supportedAttributes.push(_attribute);
            supportedAttributesHashSet[_attribute] = true;
        } else {
            for (uint256 i = 0; i < supportedAttributes.length; i++) {
                if (supportedAttributes[i] == _attribute) {
                    supportedAttributes[i] = supportedAttributes[supportedAttributes.length - 1];
                    supportedAttributes.pop();
                    supportedAttributesHashSet[_attribute] = false;
                    break;
                }
            }
        }
        emit EligibleAttributeUpdated(_attribute, _eligibleStatus);
    }


    /// @dev Set the eligibility status for an attribute type grouped by DID (Applicable to AML only for now)
    /// @notice Restricted behind a TimelockController
    /// @param _attribute keccak256 of the attribute name (ex: keccak256("AML"))
    /// @param _eligibleStatus eligiblity boolean for the attribute
    function setEligibleAttributeByDID(bytes32 _attribute, bool _eligibleStatus) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(eligibleAttributesByDID[_attribute] != _eligibleStatus, "ATTRIBUTE_ELIGIBILITY_SET");

        eligibleAttributesByDID[_attribute] = _eligibleStatus;
        emit EligibleAttributeByDIDUpdated(_attribute, _eligibleStatus);
    }

    /// @dev Set the price to update/set a single attribute after owning a passport
    /// @notice Restricted behind a TimelockController
    /// @param _attribute keccak256 of the attribute name (ex: keccak256("COUNTRY"))
    /// @param _price price (wei)
    function setAttributePrice(bytes32 _attribute, uint256 _price) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(pricePerAttribute[_attribute] != _price, "ATTRIBUTE_PRICE_ALREADY_SET");
        uint256 oldPrice = pricePerAttribute[_attribute];
        pricePerAttribute[_attribute] = _price;

        emit AttributePriceUpdated(_attribute, oldPrice, _price);
    }


    /// @dev Set the price to update/set a single attribute after owning a passport
    /// @notice Restricted behind a TimelockController
    /// @param _attribute keccak256 of the attribute name (ex: keccak256("COUNTRY"))
    /// @param _price price (wei)
    function setAttributeMintPrice(bytes32 _attribute, uint256 _price) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(mintPricePerAttribute[_attribute] != _price, "ATTRIBUTE_MINT_PRICE_ALREADY_SET");
        uint256 oldPrice = mintPricePerAttribute[_attribute];
        mintPricePerAttribute[_attribute] = _price;

        emit AttributeMintPriceUpdated(_attribute, oldPrice, _price);
    }

    /// @dev Set the UniswapAnchorView oracle (Using Compound)
    /// @notice Restricted behind a TimelockController
    /// @param _oracleAddr address of UniswapAnchorView contract
    function setOracle(address _oracleAddr) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_oracleAddr != address(0), "ORACLE_ADDRESS_ZERO");
        require(oracle != _oracleAddr, "ORACLE_ADDRESS_ALREADY_SET");
        // Safety check to ensure that address is a valid Oracle
        IUniswapAnchoredView(_oracleAddr).price("ETH");
        address oldAddress = oracle;
        oracle = _oracleAddr;
        emit OracleUpdated(oldAddress, _oracleAddr);
    }


    /// @dev Set the revenue split percentage between Issuers and Quadrata Protocol
    /// @notice Restricted behind a TimelockController
    /// @param _split percentage split (`50` equals 50%)
    function setRevSplitIssuer(uint256 _split) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(revSplitIssuer != _split, "REV_SPLIT_ALREADY_SET");
        require(_split < 100, "SPLIT_MUST_BE_LESS_THAN_100");

        uint256 oldSplit = revSplitIssuer;
        revSplitIssuer = _split;

        emit RevenueSplitIssuerUpdated(oldSplit, _split);
    }

    /// @dev Add a new issuer
    /// @notice Restricted behind a TimelockController
    /// @param _issuer address generating the signature authorizing minting/setting attributes
    /// @param _treasury address of the issuer treasury to withdraw the fees
    function addIssuer(address _issuer, address _treasury) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_treasury != address(0), "TREASURY_ISSUER_ADDRESS_ZERO");
        require(_issuer != address(0), "ISSUER_ADDRESS_ZERO");

        grantRole(ISSUER_ROLE, _issuer);
        issuersTreasury[_issuer] = _treasury;

        emit IssuerAdded(_issuer, _treasury);
    }

    /// @dev Authorize or Denied a payment to be received in Toke
    /// @notice Restricted behind a TimelockController
    /// @param _tokenAddr address of the ERC20 token for payment
    /// @param _isAllowed authorize or deny this token
    function allowTokenPayment(
        address _tokenAddr,
        bool _isAllowed
    ) external  {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_tokenAddr != address(0), "TOKEN_PAYMENT_ADDRESS_ZERO");
        require(
            eligibleTokenPayments[_tokenAddr] != _isAllowed,
            "TOKEN_PAYMENT_STATUS_SET"
        );
        IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_tokenAddr);
        // SafeCheck call to make sure that _tokenAddr is a valid ERC20 address
        erc20.totalSupply();

        eligibleTokenPayments[_tokenAddr] = true;
        emit AllowTokenPayment(_tokenAddr, _isAllowed);
    }

    /// @dev Get number of eligible attributes currently supported
    /// @notice Restricted behind a TimelockController
    /// @return length of eligible attributes
    function getSupportedAttributesLength() external view returns(uint256) {
        return supportedAttributes.length;
    }

    function _authorizeUpgrade(address) internal override view {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
    }

    /**
     * @notice Get the official price for a ERC20 token
     * @param _tokenAddr Address of the ERC20 token
     * @return Price denominated in USD, with 6 decimals
     */

    /// @dev Get the price in USD of a token using UniswapAnchorView
    /// @param _tokenAddr address of the ERC20 token
    /// @return price in USD
    function getPrice(address _tokenAddr) external view returns (uint) {
        require(oracle != address(0), "ORACLE_ADDRESS_ZERO");
        require(eligibleTokenPayments[_tokenAddr], "TOKEN_PAYMENT_NOT_ALLOWED");
        IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_tokenAddr);
        return IUniswapAnchoredView(oracle).price(erc20.symbol());
    }

    /// @dev Get the price in USD for $ETH using UniswapAnchorView
    /// @return price in USD for $ETH
    function getPriceETH() external view returns (uint) {
        require(oracle != address(0), "ORACLE_ADDRESS_ZERO");
        return IUniswapAnchoredView(oracle).price("ETH");
    }
}

