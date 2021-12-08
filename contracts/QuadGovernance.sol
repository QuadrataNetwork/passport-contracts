//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IQuadPassport.sol";
import "./interfaces/IUniswapAnchoredView.sol";

contract QuadGovernanceStore {
    // Admin Functions
    bytes32[] public supportedAttributes;
    mapping(uint256 => bool) public eligibleTokenId;
    mapping(bytes32 => bool) public eligibleAttributes;
    mapping(bytes32 => bool) public eligibleAttributesByDID;
    // Price in $USD (1e6 decimals)
    mapping(bytes32 => uint256) public pricePerAttribute;
    mapping(bytes32 => uint256) public mintPricePerAttribute;

    mapping(address => bool) public eligibleTokenPayments;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    uint256 public revSplitIssuer;  // percentage (2 decimals)
    uint256 public passportVersion;
    uint256 public mintPrice;
    IQuadPassport public passport;
    address public oracle;
    address public treasury;

}

contract QuadGovernance is AccessControlUpgradeable, UUPSUpgradeable, QuadGovernanceStore {
    event AllowTokenPaymentEvent(address _tokenAddr, bool _isAllowed);
    event AttributePriceUpdated(bytes32 _attribute, uint256 _oldPrice, uint256 _price);
    event AttributeMintPriceUpdated(bytes32 _attribute, uint256 _oldPrice, uint256 _price);
    event EligibleTokenUpdated(uint256 _tokenId, bool _eligibleStatus);
    event EligibleAttributeUpdated(bytes32 _attribute, bool _eligibleStatus);
    event EligibleAttributeByDIDUpdated(bytes32 _attribute, bool _eligibleStatus);
    event PassportAddressUpdated(address _oldAddress, address _address);
    event PassportVersionUpdated(uint256 _oldVersion, uint256 _version);
    event PassportMintPriceUpdated(uint256 _oldMintPrice, uint256 _mintPrice);
    event OracleUpdated(address _oldAddress, address _address);
    event RevenueSplitIssuerUpdated(uint256 _oldSplit, uint256 _split);
    event TreasuryUpdateEvent(address _oldAddress, address _address);

    function initialize(address _admin) public initializer {
        require(_admin != address(0), "ADMIN_ADDRESS_ZERO");

        eligibleTokenId[1] = true;   // INITIAL PASSPORT_ID
        eligibleAttributes[keccak256("DID")] = true;
        eligibleAttributes[keccak256("COUNTRY")] = true;
        eligibleAttributesByDID[keccak256("AML")] = true;
        pricePerAttribute[keccak256("DID")] = 2 * 1e6; // $2
        passportVersion = 1;
        mintPrice = 0.03 ether;
        revSplitIssuer = 50;  // 50%
        _setRoleAdmin(PAUSER_ROLE, GOVERNANCE_ROLE);
        _setRoleAdmin(ISSUER_ROLE, GOVERNANCE_ROLE);
        _setupRole(GOVERNANCE_ROLE, _admin);
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    // Setters
    /**
      * @notice This function is restricted to a TimelockController
      * @dev Set the address of the treasury.
      * @param _treasury address of the GnosisSafe
      */
    function setTreasury(address _treasury) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_treasury != address(0), "TREASURY_ADDRESS_ZERO");
        require(_treasury != treasury, "TREASURY_ADDRESS_ALREADY_SET");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdateEvent(oldTreasury, _treasury);
    }

    function setPassportContractAddress(address _passportAddr) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_passportAddr != address(0), "PASSPORT_ADDRESS_ZERO");
        require(address(passport) != _passportAddr, "PASSPORT_ADDRESS_ALREADY_SET");
        address _oldPassport = address(passport);
        passport = IQuadPassport(_passportAddr);

        emit PassportAddressUpdated(_oldPassport, address(passport));
    }

    function updateGovernanceInPassport(address _newGovernance) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_newGovernance != address(0), "PASSPORT_ADDRESS_ZERO");
        require(address(passport) != address(0), "PASSPORT_NOT_SET");

        passport.setGovernance(_newGovernance);
    }

    function setPassportVersion(uint256 _version) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_version > passportVersion, "PASSPORT_VERSION_INCREMENTAL");

        uint256 oldVersion = passportVersion;
        passportVersion = _version;
        emit PassportVersionUpdated(oldVersion, passportVersion);
    }

    function setMintPrice(uint256 _mintPrice) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(mintPrice != _mintPrice, "MINT_PRICE_ALREADY_SET");

        uint256 oldMintPrice = mintPrice;
        mintPrice = _mintPrice;
        emit PassportMintPriceUpdated(oldMintPrice, mintPrice);
    }

    function setEligibleTokenId(uint256 _tokenId, bool _eligibleStatus) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(eligibleTokenId[_tokenId] != _eligibleStatus, "TOKEN_ELIGIBILITY_ALREADY_SET");

        eligibleTokenId[_tokenId] = _eligibleStatus;
        emit EligibleTokenUpdated(_tokenId, _eligibleStatus);
    }

    function setEligibleAttribute(bytes32 _attribute, bool _eligibleStatus) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(eligibleAttributes[_attribute] != _eligibleStatus, "ATTRIBUTE_ELIGIBILITY_SET");

        eligibleAttributes[_attribute] = _eligibleStatus;
        if (_eligibleStatus) {
            supportedAttributes.push(_attribute);
        } else {
            for (uint256 i = 0; i < supportedAttributes.length; i++) {
                if (supportedAttributes[i] == _attribute) {
                    supportedAttributes[i] = supportedAttributes[supportedAttributes.length - 1];
                    supportedAttributes.pop();
                    break;
                }
            }

        }
        emit EligibleAttributeUpdated(_attribute, _eligibleStatus);
    }


    function setEligibleAttributeByDID(bytes32 _attribute, bool _eligibleStatus) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(eligibleAttributesByDID[_attribute] != _eligibleStatus, "ATTRIBUTE_ELIGIBILITY_SET");

        eligibleAttributesByDID[_attribute] = _eligibleStatus;
        emit EligibleAttributeByDIDUpdated(_attribute, _eligibleStatus);
    }

    function setAtributePrice(bytes32 _attribute, uint256 _price) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(pricePerAttribute[_attribute] != _price, "ATTRIBUTE_PRICE_ALREADY_SET");
        uint256 oldPrice = pricePerAttribute[_attribute];
        pricePerAttribute[_attribute] = _price;

        emit AttributePriceUpdated(_attribute, oldPrice, _price);
    }


    function setAtributeMintPrice(bytes32 _attribute, uint256 _price) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(mintPricePerAttribute[_attribute] != _price, "ATTRIBUTE_MINT_PRICE_ALREADY_SET");
        uint256 oldPrice = mintPricePerAttribute[_attribute];
        mintPricePerAttribute[_attribute] = _price;

        emit AttributeMintPriceUpdated(_attribute, oldPrice, _price);
    }

    function setOracle(address _oracleAddr) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_oracleAddr != address(0), "ORACLE_ADDRESS_ZERO");
        require(oracle != _oracleAddr, "ORACLE_ADDRESS_ALREADY_SET");
        address oldAddress = oracle;
        oracle = _oracleAddr;
        emit OracleUpdated(oldAddress, _oracleAddr);
    }


    function setRevSplitIssuer(uint256 _split) external {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(revSplitIssuer != _split, "REV_SPLIT_ALREADY_SET");
        uint256 oldSplit = revSplitIssuer;
        revSplitIssuer = _split;

        emit RevenueSplitIssuerUpdated(oldSplit, _split);
    }

    /**
      * @notice This function is restricted to a TimelockController
      * @dev Authorize or Denied a payment to be received in Token.
      * @param _tokenAddr address of the ERC20 token for payment
      * @param _isAllowed authorize or deny this token
      */
    function allowTokenPayment(
        address _tokenAddr,
        bool _isAllowed
    ) external  {
        require(hasRole(GOVERNANCE_ROLE, _msgSender()), "INVALID_ADMIN");
        require(_tokenAddr != address(0), "TOKEN_PAYENT_ADDRESS_ZERO");
        require(
            eligibleTokenPayments[_tokenAddr] != _isAllowed,
            "TOKEN_PAYMENT_STATUS_SET"
        );
        IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_tokenAddr);
        // SafeCheck call to make sure that _tokenAddr is a valid ERC20 address
        erc20.totalSupply();

        eligibleTokenPayments[_tokenAddr] = true;
        emit AllowTokenPaymentEvent(_tokenAddr, _isAllowed);
    }

    // Getter
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
    function getPrice(address _tokenAddr) external view returns (uint) {
        require(oracle != address(0), "ORACLE_ADDRESS_ZERO");
        require(eligibleTokenPayments[_tokenAddr], "TOKEN_PAYMENT_NOT_ALLOWED");
        IERC20MetadataUpgradeable erc20 = IERC20MetadataUpgradeable(_tokenAddr);
        return IUniswapAnchoredView(oracle).price(erc20.symbol());
    }

    function getPriceETH() external view returns (uint) {
        require(oracle != address(0), "ORACLE_ADDRESS_ZERO");
        return IUniswapAnchoredView(oracle).price("ETH");
    }
}

