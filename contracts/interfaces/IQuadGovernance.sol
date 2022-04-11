//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IQuadGovernance {
    function setTreasury(address _treasury) external;

    function setPassportContractAddress(address _passportAddr) external;

    function updateGovernanceInPassport(address _newGovernance) external;

    function setPassportVersion(uint256 _version) external;

    function setMintPrice(uint256 _mintPrice) external;

    function setEligibleTokenId(uint256 _tokenId, bool _eligibleStatus) external;

    function setEligibleAttribute(bytes32 _attribute, bool _eligibleStatus) external;

    function setEligibleAttributeByDID(bytes32 _attribute, bool _eligibleStatus) external;

    function setAttributePrice(bytes32 _attribute, uint256 _price) external;

    function setBusinessAttributePrice(bytes32 _attribute, uint256 _price) external;

    function setAttributeMintPrice(bytes32 _attribute, uint256 _price) external;

     function setOracle(address _oracleAddr) external;

     function setRevSplitIssuer(uint256 _split) external;

     function addIssuer(address _issuer, address _treasury) external;

     function deleteIssuer(address _issuer) external;

     function allowTokenPayment(
        address _tokenAddr,
        bool _isAllowed
    ) external;

    function getSupportedAttributesLength() external view returns(uint256);

    function getPrice(address _tokenAddr) external view returns (uint);

    function getPriceETH() external view returns (uint);

    function getIssuersLength() external view returns (uint256);

    function mintPrice() external view returns (uint256);

    function eligibleTokenId(uint256) external view returns(bool);

    function issuersTreasury(address) external view returns (address);

    function mintPricePerAttribute(bytes32) external view returns(uint256);

    function eligibleAttributes(bytes32) external view returns(bool);

    function eligibleAttributesByDID(bytes32) external view returns(bool);

    function supportedAttributes(uint256) external view returns(bytes32);

    function issuers(uint256) external view returns(address);

    function pricePerAttribute(bytes32) external view returns(uint256);

    function pricePerBusinessAttribute(bytes32) external view returns(uint256);


    function revSplitIssuer() external view returns (uint256);


    function treasury() external view returns (address);

    function hasRole(bytes32, address) external view returns(bool);

    function getIssuers() external view returns (address[] memory);

}
