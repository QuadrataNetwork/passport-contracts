//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/IAccessControlUpgradeable.sol";

import "./interfaces/IQuadReader.sol";
import "./interfaces/IQuadGovernance.sol";
import "./interfaces/IQuadPassportStore.sol";
import "./storage/QuadConstant.sol";

contract SocialAttributeReader is UUPSUpgradeable, QuadConstant{
    using SafeMath for uint256;

    // keccak256(userAddress, issuerAddr, attrType))
    mapping(bytes32 => IQuadPassportStore.Attribute) internal _attributes;
    mapping(address=>mapping(address=>bool)) public allowList;
    mapping(address=>mapping(bytes32=>uint256)) public queryFeeMap;
    mapping(address=>uint256) public funds;

    uint256 public quadrataFee;

    IQuadGovernance public governance;
    IQuadReader public reader;

    // used to prevent logic contract self destruct take over
    constructor() initializer {}

    function initialize(
        address _governance,
        address _reader
    ) public initializer {
        require(_governance != address(0), "GOVERNANCE_ADDRESS_ZERO");
        require(_reader != address(0), "READER_ADDRESS_ZERO");

        governance = IQuadGovernance(_governance);
        reader = IQuadReader(_reader);
    }

    function writeAttributes(bytes32 _attrName, bytes32 _attrValue, address _targetAddr) public {
        require(allowList[_targetAddr][msg.sender], 'NOT_ALLOWED');
        require(!_isPassportAttribute(_attrName), 'ATTR_NAME_NOT_ALLOWED');

        bytes32 attrKey = keccak256(abi.encode(_targetAddr, msg.sender, _attrName));

        IQuadPassportStore.Attribute memory attr = IQuadPassportStore.Attribute({
            value: _attrValue,
            epoch: block.timestamp,
            issuer: msg.sender
        });

        _attributes[attrKey] = attr;
    }

    function _isPassportAttribute(bytes32 _attrName) public view returns(bool) {
        return governance.eligibleAttributes(_attrName) || governance.eligibleAttributesByDID(_attrName);
    }

    function queryFeeBulk(
        address _issuer,
        address _account,
        bytes32[] calldata _attrNames) public view returns(uint256){
        uint256 fee;
        for(uint256 i = 0; i < _attrNames.length; i++){
            if(!_isPassportAttribute(_attrNames[i])){
                (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_issuer, _attrNames[i]);
                fee = fee.add(interimIssuer.add(interimQuadrata));
            } else {
                fee = fee.add(reader.queryFee(_account, _attrNames[i]));
            }
        }

        return fee;
    }

    function getAttributes(
        address _issuer,
        address _account,
        bytes32[] calldata _attrNames
    ) payable public returns(IQuadPassportStore.Attribute[] memory){
        uint256 quadrataFee;
        uint256 issuerFee;
        uint256 quadReaderFee;

        IQuadPassportStore.Attribute[] memory attributes = new IQuadPassportStore.Attribute[](_attrNames.length);

        for(uint256 i = 0; i < _attrNames.length; i++){
            if(!_isPassportAttribute(_attrNames[i])){
                bytes32 attrKey = keccak256(abi.encode(_account, _issuer, _attrNames[i]));
                attributes[i] = _attributes[attrKey];

                (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_issuer, _attrNames[i]);
                issuerFee = issuerFee.add(interimIssuer);
                quadrataFee = quadrataFee.add(interimQuadrata);

            } else {
                quadReaderFee = reader.queryFee(_account, _attrNames[i]);
                attributes[i] = reader.getAttributes{value: quadReaderFee}(_account, _attrNames[i])[0];
            }
        }
        require(msg.value == (quadrataFee.add(issuerFee)), "INVALID_FEE");

        funds[governance.treasury()] = funds[governance.treasury()].add(quadrataFee);
        funds[_issuer] = funds[_issuer].add(issuerFee);

        return attributes;
    }

    function calculateSocialFees(address _issuer, bytes32 _attrName) view internal returns (uint256 quadrataFee, uint256 issuerFee){
         if(queryFeeMap[_issuer][_attrName].div(uint256(2)) > quadrataFee) {
             issuerFee = queryFeeMap[_issuer][_attrName].div(uint256(2));
             quadrataFee = queryFeeMap[_issuer][_attrName].sub(issuerFee);
         }else{
             issuerFee = queryFeeMap[_issuer][_attrName].div(uint256(2));
             quadrataFee = quadrataFee;
         }
     }

    function allowance(address _addr, bool _allow) public {
        allowList[msg.sender][_addr] = _allow;
    }

    function withdraw() public {
        require(funds[msg.sender] > 0, "CANNOT_WITHDRAW");
        uint256 amount = funds[msg.sender];
        funds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value:amount}("");
        require(success, "TRANSFER_FAILED");
    }

    function setQueryFee(bytes32 _attrName, uint256 _amount) public {
        queryFeeMap[msg.sender][_attrName] = _amount;
    }

    function setQuadrataFee(uint256 _amount) public {
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
        quadrataFee = _amount;
    }

    function _authorizeUpgrade(address) internal view override {
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }
}
