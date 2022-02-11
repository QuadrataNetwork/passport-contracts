pragma solidity 0.8.4;

import "./QuadGovernance.sol";
import "./QuadPassport.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract QuadPassportHelper is Ownable {

    QuadGovernance public governance;
    QuadPassport public passport;


    constructor(QuadGovernance _governance, QuadPassport _passport) Ownable() {
        governance = _governance;
        passport = _passport;
    }


    /// @notice Claim and mint a wallet account Quadrata Passport
    /// @dev Only when authorized by an eligible issuer
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _quadDID Quadrata Decentralized Identity (raw value)
    /// @param _aml keccak256 of the AML status value
    /// @param _country keccak256 of the country value
    /// @param _issuedAt epoch when the passport has been issued by the Issuer
    /// @param _sig ECDSA signature computed by an eligible issuer to authorize the mint
    function mintPassport(
        uint256 _tokenId,
        bytes32 _quadDID,
        bytes32 _aml,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable {
        require(msg.value == governance.mintPrice(), "INVALID_MINT_PRICE");
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(passport.balanceOf(msg.sender, _tokenId) == 0, "PASSPORT_ALREADY_EXISTS");

        (bytes32 hash, address issuer) = _verifyIssuerMint(msg.sender, _tokenId, _quadDID, _aml, _country, _issuedAt, _sig);

         passport.executeMint(msg.sender, _tokenId, _aml, _quadDID, _country, _issuedAt, hash, issuer);
    }


    /// @notice Claim and mint a Quadrata Passport on behalf of another account
    /// @dev Only when authorized by an eligible issuer
    /// @param _recipient the awardee to recieve the passport
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _quadDID Quadrata Decentralized Identity (raw value)
    /// @param _aml keccak256 of the AML status value
    /// @param _country keccak256 of the country value
    /// @param _issuedAt epoch when the passport has been issued by the Issuer
    /// @param _sig ECDSA signature computed by an eligible issuer to authorize the mint
    function mintPassportOnBehalfOf(
        address _recipient,
        uint256 _tokenId,
        bytes32 _quadDID,
        bytes32 _aml,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable {
        require(msg.value == governance.mintPrice(), "INVALID_MINT_PRICE");
        require(governance.eligibleTokenId(_tokenId), "PASSPORT_TOKENID_INVALID");
        require(passport.balanceOf(_recipient, _tokenId) == 0, "PASSPORT_ALREADY_EXISTS");

        (bytes32 hash, address issuer) = _verifyIssuerMintOnBehalfOf(msg.sender, _recipient, _tokenId, _quadDID, _aml, _country, _issuedAt, _sig);

        passport.executeMint(_recipient,_tokenId, _aml, _quadDID, _country, _issuedAt, hash, issuer);

    }

    function _verifyIssuerMint(
        address _account,
        uint256 _tokenId,
        bytes32 _quadDID,
        bytes32 _aml,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) internal view returns(bytes32,address){
        bytes32 hash = keccak256(abi.encode(_account, _tokenId, _quadDID, _aml, _country,  _issuedAt));
        require(!passport._usedHashes(hash), "SIGNATURE_ALREADY_USED");
        return (hash, _extractIssuer(hash, _sig));
    }


    function _extractIssuer(bytes32 hash, bytes calldata _sig) internal view returns (address){
        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(hash);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sig);
        require(governance.hasRole(passport.ISSUER_ROLE(), issuer), "INVALID_ISSUER");
    }

        function _verifyIssuerMintOnBehalfOf(
        address _minter,
        address _recipient,
        uint256 _tokenId,
        bytes32 _quadDID,
        bytes32 _aml,
        bytes32 _country,
        uint256 _issuedAt,
        bytes calldata _sig
    ) internal view returns(bytes32,address){
        bytes32 hash = keccak256(abi.encode(_minter, _recipient, _tokenId, _quadDID, _aml, _country,  _issuedAt));
        require(!passport._usedHashes(hash), "SIGNATURE_ALREADY_USED");
        return (hash, _extractIssuer(hash, _sig));
    }

    /// @notice Update or set a new attribute for your existing passport
    /// @dev Only when authorized by an eligible issuer
    /// @param _tokenId tokenId of the Passport (1 for now)
    /// @param _attribute keccak256 of the attribute type (ex: keccak256("COUNTRY"))
    /// @param _value keccak256 of the value of the attribute (ex: keccak256("FRANCE"))
    /// @param _issuedAt epoch when the operation has been authorized by the Issuer
    /// @param _sig ECDSA signature computed by an eligible issuer to authorize the operation
    function setAttribute(
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) external payable {
        require(msg.value == governance.mintPricePerAttribute(_attribute), "INVALID_ATTR_MINT_PRICE");
        (bytes32 hash, address issuer) = _verifyIssuerSetAttr(msg.sender, _tokenId, _attribute, _value, _issuedAt, _sig);

        passport.setAccountBalancesEth(governance.issuersTreasury(issuer), governance.mintPricePerAttribute(_attribute));
        passport.useHash(hash);
        passport.executeSetAttribute(msg.sender, _tokenId, _attribute, _value, _issuedAt, issuer);
    }

    function _verifyIssuerSetAttr(
        address _account,
        uint256 _tokenId,
        bytes32 _attribute,
        bytes32 _value,
        uint256 _issuedAt,
        bytes calldata _sig
    ) internal view returns(bytes32,address) {
        bytes32 hash = keccak256(abi.encode(_account, _tokenId, _attribute, _value, _issuedAt));

        require(!passport._usedHashes(hash), "SIGNATURE_ALREADY_USED");

        bytes32 signedMsg = ECDSAUpgradeable.toEthSignedMessageHash(hash);
        address issuer = ECDSAUpgradeable.recover(signedMsg, _sig);
        require(governance.hasRole(passport.ISSUER_ROLE(), issuer), "INVALID_ISSUER");

        return (hash, issuer);
    }

    /// @notice Burn your Quadrata passport
    /// @dev Only owner of the passport
    /// @param _tokenId tokenId of the Passport (1 for now)
    function burnPassport(
        uint256 _tokenId
    ) external {
        require(passport.balanceOf(msg.sender, _tokenId) == 1, "CANNOT_BURN_ZERO_BALANCE");
        passport.executeBurn(_tokenId, msg.sender);
    }

    function setGovernance(QuadGovernance _governance) external onlyOwner {
        governance = _governance;
    }

    function setPassport(QuadPassport _passport) external onlyOwner {
        passport = _passport;
    }
}