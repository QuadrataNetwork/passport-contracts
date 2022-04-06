//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

abstract contract IQuadGovernance is AccessControlUpgradeable, UUPSUpgradeable {
    function setTreasury(address _treasury) external virtual;

    function setPassportContractAddress(address _passportAddr) external virtual;

    function updateGovernanceInPassport(address _newGovernance) external virtual;

    function setPassportVersion(uint256 _version) external virtual;

    function setMintPrice(uint256 _mintPrice) external virtual;

    function setEligibleTokenId(uint256 _tokenId, bool _eligibleStatus) external virtual;

    function setEligibleAttribute(bytes32 _attribute, bool _eligibleStatus) external virtual;

    function setEligibleAttributeByDID(bytes32 _attribute, bool _eligibleStatus) external virtual;

    function setAttributePrice(bytes32 _attribute, uint256 _price) external virtual;

    function setBusinessAttributePrice(bytes32 _attribute, uint256 _price) external virtual;

    function setAttributeMintPrice(bytes32 _attribute, uint256 _price) external virtual;

     function setOracle(address _oracleAddr) external virtual;

     function setRevSplitIssuer(uint256 _split) external virtual;

     function addIssuer(address _issuer, address _treasury) external virtual;

     function deleteIssuer(address _issuer) external virtual;

     function allowTokenPayment(
        address _tokenAddr,
        bool _isAllowed
    ) external virtual;

    function getSupportedAttributesLength() external virtual view returns(uint256);

    function getPrice(address _tokenAddr) external virtual view returns (uint);

    function getPriceETH() external virtual view returns (uint);

    function getIssuersLength() external virtual view returns (uint256);

    function mintPrice() external virtual view returns (uint256);

    function eligibleTokenId(uint256) external virtual view returns(bool);

    function issuersTreasury(address) external virtual view returns (address);

    function mintPricePerAttribute(bytes32) external virtual view returns(uint256);

    function eligibleAttributes(bytes32) external virtual view returns(bool);

    function eligibleAttributesByDID(bytes32) external virtual view returns(bool);

    function supportedAttributes(uint256) external virtual view returns(bytes32);

    function issuers(uint256) external virtual view returns(address);

    function pricePerAttribute(bytes32) external virtual view returns(uint256);

    function pricePerBusinessAttribute(bytes32) external virtual view returns(uint256);


    function revSplitIssuer() external virtual view returns (uint256);


    function treasury() external virtual view returns (address);


}
