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
    mapping(bytes32 => IQuadPassportStore.Attribute[]) internal _attributes;
    mapping(address=>mapping(address=>bool)) public allowList;
    mapping(address=>uint256) public issuerQueryFee;
    mapping(address=>uint256) public funds;

    IQuadGovernance public governance;
    IQuadReader public reader;

    // used to prevent logic contract self destruct take over
    constructor() initializer {}

    function initialize(
        uint256 _quadrataQueryFee,
        address _governance,
        address _reader
    ) public initializer {
        require(_governance != address(0), "GOVERNANCE_ADDRESS_ZERO");
        require(_reader != address(0), "READER_ADDRESS_ZERO");

        governance = IQuadGovernance(_governance);
        reader = IQuadReader(_reader);

        issuerQueryFee[governance.treasury()] = _quadrataQueryFee;

    }

    function writeAttributes(bytes32 _attrName, bytes32 _attrValue, address _targetAddr) public {
        require(allowList[_targetAddr][msg.sender], 'NOT_ALLOWED');
        bytes32 attrKey = keccak256(abi.encode(_targetAddr, msg.sender, _attrName));

        IQuadPassportStore.Attribute memory attr = IQuadPassportStore.Attribute({
            value:  _attrValue,
            epoch: block.timestamp,
            issuer: msg.sender
        });

        _attributes[attrKey].push(attr);
    }

    function _isSocialAttribute(bytes32 _attrName) internal view returns(bool) {
        return !governance.eligibleAttributes(_attrName) && !governance.eligibleAttributesByDID(_attrName);
    }

    function queryFee(
        address _issuer,
        address _account,
        bytes32[] calldata _attrNames) public view returns(uint256){
        uint256 fee;
        for(uint256 i = 0; i < _attrNames.length; i++){
            if(_isSocialAttribute(_attrNames[i])){
                (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_issuer);
                fee += (interimIssuer+interimQuadrata);
            } else {
                fee += reader.queryFee(_account, _attrNames[i]);
            }
        }

        return fee;
    }

    function getAttributesBulk(
        address _issuer,
        address _account,
        bytes32[] calldata _attrNames
    ) payable public returns(IQuadPassportStore.Attribute[] memory){
        uint256 quadrataFee;
        uint256 issuerFee;
        uint256 queryFee;

        IQuadPassportStore.Attribute[] memory attributes = new IQuadPassportStore.Attribute[](_attrNames.length);

        for(uint256 i = 0; i < _attrNames.length; i++){
            if(_isSocialAttribute(_attrNames[i])){
                bytes32 attrKey = keccak256(abi.encode(_account, _issuer, _attrNames[i]));
                attributes[i] = _attributes[attrKey][0];
                (uint256 interimIssuer, uint256 interimQuadrata) = calculateSocialFees(_issuer);
                issuerFee += interimIssuer;
                quadrataFee += interimQuadrata;
            } else {
                queryFee = reader.queryFee(_account, _attrNames[i]);
                attributes[i] = reader.getAttributes{value: queryFee}(_account, _attrNames[i])[0];
            }
        }
        require(msg.value == (quadrataFee + issuerFee), "INVALID_FEE");

        funds[governance.treasury()] += quadrataFee;
        funds[_issuer] += issuerFee;

        return attributes;
    }

    function calculateSocialFees(address _issuer) view internal returns (uint256, uint256){
        uint256 quadrataFee;
        uint256 issuerFee;
        if(issuerQueryFee[_issuer].div(uint256(2)) > issuerQueryFee[governance.treasury()]) {
            issuerFee = issuerQueryFee[_issuer].div(uint256(2));
            quadrataFee = issuerQueryFee[_issuer] - issuerFee;
        }else{
            issuerFee = issuerQueryFee[_issuer].div(uint256(2));
            quadrataFee = issuerQueryFee[governance.treasury()];
        }
        return(issuerFee, quadrataFee);
    }

    function allowAddress(address _addr, bool _allow) public {
        allowList[msg.sender][_addr] = _allow;
    }

    function withdraw() public {
        require(funds[msg.sender] > 0, "CANNOT_WITHDRAW");
        uint256 amount = funds[msg.sender];
        funds[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function setIssuerQueryFee(uint256 _amount) public {
        issuerQueryFee[msg.sender] = _amount;
    }

    function setQuadrataQueryFee(uint256 _amount) public {
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
        issuerQueryFee[governance.treasury()] = _amount;
    }

    function _authorizeUpgrade(address) internal view override {
        require(IAccessControlUpgradeable(address(governance)).hasRole(GOVERNANCE_ROLE, msg.sender), "INVALID_ADMIN");
    }
}
