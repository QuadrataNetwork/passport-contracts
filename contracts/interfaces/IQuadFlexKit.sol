//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./interfaces/IQuadPassportStore.sol";
import "./storage/QuadFlexKitStore.sol";

interface IQuadFlexKit{
    event WriteEvent(address indexed _account, address indexed _caller, bytes32 _attribute);
    event QueryEvent(address indexed _account, address indexed _caller, bytes32 _attribute);
    event WithdrawEvent(address indexed _caller, uint256 _fee);

    function setAttributes(
        bytes32 _issuerAndAttr,
        bytes32 _attrValue,
        address _account,
        bytes calldata _sigAccount
    ) external;

    function queryFee(address _account,  bytes32 _attribute) external view returns(uint256);

    function queryFeeBulk(
        address _account,
        bytes32[] calldata _attributes
    ) external view returns(uint256 fee);

    function getAttributes(
        address _account, bytes32 _attribute
    ) external payable returns(IQuadPassportStore.Attribute[] memory attributes);

    function getAttributesLegacy(
        address _account, bytes32 _attribute
    ) external payable returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers);

    function getAttributesBulkLegacy(
        address _account, bytes32[] calldata _attributes
    ) external payable returns(bytes32[] memory values, uint256[] memory epochs, address[] memory issuers);

    function getAttributesBulk(
        address _account,
        bytes32[] calldata _attributes
    ) external payable returns(IQuadPassportStore.Attribute[] memory);

    function getAttributeKey(address _issuer, bytes32 _attrName) external pure returns(bytes32);
    function withdraw() external;
    function setQueryFee(bytes32 _rawAttrName, uint256 _amount) external;
    function setQuadrataFee(uint256 _amount) external;
    function setRevokedAttributes(bytes32 _attrName, bool _status) external;
}
