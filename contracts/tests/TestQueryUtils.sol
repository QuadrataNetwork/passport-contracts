// SPDX-License-Identifier: MIT
pragma solidity >= 0.5.0;

import "../utility/QueryUtils.sol";

contract TestQueryUtils {
    using QueryUtils for bytes32;

    function IsBusinessTrue(bytes32 _attrValue) public pure returns(bool) {
        return _attrValue.IsBusinessTrue();
    }

    function IsBusinessFalse(bytes32 _attrValue) public pure returns(bool) {
        return _attrValue.IsBusinessFalse();
    }

    function CountryIsEqual(bytes32 _attrValue, string memory _expectedString) public pure returns(bool) {
        return _attrValue.CountryIsEqual(_expectedString);
    }

    function AmlIsEqual(bytes32 _attrValue, uint256 _expectedInt) public pure returns(bool) {
        return _attrValue.AmlIsEqual(_expectedInt);
    }

    function AmlGreaterThan(bytes32 _attrValue, uint256 _lowerBound) public pure returns(bool) {
        return _attrValue.AmlGreaterThan(_lowerBound);
    }

    function AmlGreaterThanEqual(bytes32 _attrValue, uint256 _lowerBound) public pure returns(bool) {
        return _attrValue.AmlGreaterThanEqual(_lowerBound);
    }

    function AmlLessThan(bytes32 _attrValue, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.AmlLessThan(_upperBound);
    }

    function AmlLessThanEqual(bytes32 _attrValue, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.AmlLessThanEqual(_upperBound);
    }

    function AmlBetweenInclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.AmlBetweenInclusive(_lowerBound, _upperBound);
    }

    function AmlBetweenExclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.AmlBetweenExclusive(_lowerBound, _upperBound);
    }

    function TuCreditScoreIteratorLessThan(bytes32 _attrValue, bytes32 _startingHash, uint256 _iteratorThreshold) public pure returns(bool) {
        return _attrValue.TuCreditScoreIteratorLessThan(_startingHash, _iteratorThreshold);
    }

    function CredProtocolScoreIsEqual(bytes32 _attrValue, uint256 _expectedInt) public pure returns(bool) {
        return _attrValue.CredProtocolScoreIsEqual(_expectedInt);
    }

    function CredProtocolScoreGreaterThan(bytes32 _attrValue, uint256 _lowerBound) public pure returns(bool) {
        return _attrValue.CredProtocolScoreGreaterThan(_lowerBound);
    }

    function CredProtocolScoreGreaterThanEqual(bytes32 _attrValue, uint256 _lowerBound) public pure returns(bool) {
        return _attrValue.CredProtocolScoreGreaterThanEqual(_lowerBound);
    }

    function CredProtocolScoreLessThan(bytes32 _attrValue, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.CredProtocolScoreLessThan(_upperBound);
    }

    function CredProtocolScoreLessThanEqual(bytes32 _attrValue, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.CredProtocolScoreLessThanEqual(_upperBound);
    }

    function CredProtocolScoreBetweenInclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.CredProtocolScoreBetweenInclusive(_lowerBound, _upperBound);
    }

    function CredProtocolScoreBetweenExclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.CredProtocolScoreBetweenExclusive(_lowerBound, _upperBound);
    }

}
