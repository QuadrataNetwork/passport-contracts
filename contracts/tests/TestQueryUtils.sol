// SPDX-License-Identifier: MIT
pragma solidity >= 0.5.0;

import "../utility/QueryUtils.sol";

contract TestQueryUtils {
    using QueryUtils for bytes32;

    function isBusinessTrue(bytes32 _attrValue) public pure returns(bool) {
        return _attrValue.isBusinessTrue();
    }

    function isBusinessFalse(bytes32 _attrValue) public pure returns(bool) {
        return _attrValue.isBusinessFalse();
    }

    function countryIsEqual(bytes32 _attrValue, string memory _expectedString) public pure returns(bool) {
        return _attrValue.countryIsEqual(_expectedString);
    }

    function amlIsEqual(bytes32 _attrValue, uint256 _expectedInt) public pure returns(bool) {
        return _attrValue.amlIsEqual(_expectedInt);
    }

    function amlGreaterThan(bytes32 _attrValue, uint256 _lowerBound) public pure returns(bool) {
        return _attrValue.amlGreaterThan(_lowerBound);
    }

    function amlGreaterThanEqual(bytes32 _attrValue, uint256 _lowerBound) public pure returns(bool) {
        return _attrValue.amlGreaterThanEqual(_lowerBound);
    }

    function amlLessThan(bytes32 _attrValue, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.amlLessThan(_upperBound);
    }

    function amlLessThanEqual(bytes32 _attrValue, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.amlLessThanEqual(_upperBound);
    }

    function amlBetweenInclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.amlBetweenInclusive(_lowerBound, _upperBound);
    }

    function amlBetweenExclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.amlBetweenExclusive(_lowerBound, _upperBound);
    }

    function vantageScoreIteratorLessThan(bytes32 _attrValue, bytes32 _startingHash, uint256 _iteratorThreshold) public pure returns(bool) {
        return _attrValue.vantageScoreIteratorLessThan(_startingHash, _iteratorThreshold);
    }

    function credProtocolScoreIsEqual(bytes32 _attrValue, uint256 _expectedInt) public pure returns(bool) {
        return _attrValue.credProtocolScoreIsEqual(_expectedInt);
    }

    function credProtocolScoreGreaterThan(bytes32 _attrValue, uint256 _lowerBound) public pure returns(bool) {
        return _attrValue.credProtocolScoreGreaterThan(_lowerBound);
    }

    function credProtocolScoreGreaterThanEqual(bytes32 _attrValue, uint256 _lowerBound) public pure returns(bool) {
        return _attrValue.credProtocolScoreGreaterThanEqual(_lowerBound);
    }

    function credProtocolScoreLessThan(bytes32 _attrValue, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.credProtocolScoreLessThan(_upperBound);
    }

    function credProtocolScoreLessThanEqual(bytes32 _attrValue, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.credProtocolScoreLessThanEqual(_upperBound);
    }

    function credProtocolScoreBetweenInclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.credProtocolScoreBetweenInclusive(_lowerBound, _upperBound);
    }

    function credProtocolScoreBetweenExclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns(bool) {
        return _attrValue.credProtocolScoreBetweenExclusive(_lowerBound, _upperBound);
    }

}
