//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/QuadGovernanceStore.sol";
import "./IQuadPassport.sol";

interface IQuadGovernance{
    function setTreasury(address _treasury) external;

    function setPassportContractAddress(address _passportAddr) external;

    function updateGovernanceInPassport(address _newGovernance) external;

    function setPassportVersion(uint256 _version) external;

    function setMintPrice(uint256 _mintPrice) external;

    function setEligibleTokenId(uint256 _tokenId, bool _eligibleStatus) external;

    function getEligibleTokenId(uint256 _tokenId) external returns(bool);

    function setEligibleAttribute(bytes32 _attribute, bool _eligibleStatus) external;

    function getEligibleAttribute(bytes32 _attribute) external returns(bool);

    function setEligibleAttributeByDID(bytes32 _attribute, bool _eligibleStatus) external;

    function getEligibleAttributeByDID(bytes32 _attribute) external returns(bool);

    function getEligibleAttributeArray(uint256 _index) external returns(bytes32);

    function setAttributePrice(bytes32 _attribute, uint256 _price) external;

    function setBusinessAttributePrice(bytes32 _attribute, uint256 _price) external;

    function setAttributeMintPrice(bytes32 _attribute, uint256 _price) external;

    function setOracle(address _oracleAddr) external;

    function setRevSplitIssuer(uint256 _split) external;

    function setIssuer(address _issuer, address _treasury) external;

    function getMintPricePerAttribute(bytes32 _attribute) external returns(uint256);

    function deleteIssuer(address _issuer) external;

    function setIssuerStatus(address _issuer, QuadGovernanceStore.IssuerStatus _status) external;

    function allowTokenPayment(address _tokenAddr, bool _isAllowed) external;

    function getEligibleAttributesLength() external view returns(uint256);

    function getPrice(address _tokenAddr) external view returns (uint);

    function getPriceETH() external view returns (uint);

    function mintPrice() external view returns (uint256);

    function treasury() external view returns (address);

    function getIssuerTreasury(address _issuer) external returns (address);

    function oracle() external view returns (address);

    function passport() external view returns (IQuadPassport);

    function getIssuersLength() external view returns (uint256);

    function getIssuers() external view returns (QuadGovernanceStore.Issuer[] memory);

    function getIssuerStatus(address _issuer) external view returns(QuadGovernanceStore.IssuerStatus);

    function passportVersion() external view returns(uint256);

    function revSplitIssuer() external view returns(uint256);

    function getHasRole(bytes32 _role, address _sender) external returns(bool);
}
