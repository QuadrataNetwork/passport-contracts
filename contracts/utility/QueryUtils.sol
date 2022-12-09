//SPDX-License-Identifier: BUSL-1.1
pragma solidity >= 0.5.0;

library QueryUtils {
  /// @dev Checks if IsBusiness return value is true
  /// @param _attrValue return value of query
  function isBusinessTrue(bytes32 _attrValue) public pure returns (bool) {
    return(_attrValue == keccak256("TRUE"));
  }

  /// @dev Checks if IsBusiness return value is false
  /// @param _attrValue return value of query
  function isBusinessFalse(bytes32 _attrValue) public pure returns (bool) {
    return(_attrValue == keccak256("FALSE") || _attrValue == bytes32(0));
  }

  /// @dev Checks if Country return value is equal to a given string value
  /// @param _attrValue return value of query
  /// @param _expectedString expected country value as string
  function countryIsEqual(bytes32 _attrValue, string memory _expectedString) public pure returns (bool) {
    return(_attrValue == keccak256(abi.encodePacked(_expectedString)));
  }

  /// @dev Checks if AML return value is equal to a given uint256 value
  /// @param _attrValue return value of query
  /// @param _expectedInt expected AML value as uint256
  function amlIsEqual(bytes32 _attrValue, uint256 _expectedInt) public pure returns (bool) {
    return(uint256(_attrValue) == _expectedInt);
  }

  /// @dev Checks if AML return value is greater than a given uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound AML value as uint256
  function amlGreaterThan(bytes32 _attrValue, uint256 _lowerBound) public pure returns (bool) {
    return(uint256(_attrValue) > _lowerBound);
  }

  /// @dev Checks if AML return value is greater than or equal to a given uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound AML value as uint256
  function amlGreaterThanEqual(bytes32 _attrValue, uint256 _lowerBound) public pure returns (bool) {
    return(uint256(_attrValue) >= _lowerBound);
  }

  /// @dev Checks if AML return value is less than a given uint256 value
  /// @param _attrValue return value of query
  /// @param _upperBound upper bound AML value as uint256
  function amlLessThan(bytes32 _attrValue, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) < _upperBound);
  }

  /// @dev Checks if AML return value is less than or equal to a given uint256 value
  /// @param _attrValue return value of query
  /// @param _upperBound upper bound AML value as uint256
  function amlLessThanEqual(bytes32 _attrValue, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) <= _upperBound);
  }

  /// @dev Checks if AML return value is inclusively between two uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound AML value as uint256
  /// @param _upperBound upper bound AML value as uint256
  function amlBetweenInclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) <= _upperBound && uint256(_attrValue) >= _lowerBound);
  }

  /// @dev Checks if AML return value is exlusively between two uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound AML value as uint256
  /// @param _upperBound upper bound AML value as uint256
  function amlBetweenExclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) < _upperBound && uint256(_attrValue) > _lowerBound);
  }

  /// @dev Checks if supplied hash is within threshold of Vantage Score value
  /// @param _attrValue return value of query
  /// @param _startingHiddenScore starting hidden score hash
  /// @param _iteratorThreshold maximum number of hashing to meet criteria
  function vantageScoreIteratorLessThanEqual(bytes32 _attrValue, bytes32 _startingHiddenScore, uint256 _iteratorThreshold) public pure returns (bool){
    if(_attrValue == bytes32(0)){
      return false;
    }

    uint256 count = 0 ;
    bytes32 hashIterator = _startingHiddenScore;

    for(uint256 i = 0; i < 25; i++){
      if(hashIterator==_attrValue){
        return(count <= _iteratorThreshold);
      }
      hashIterator = keccak256(abi.encodePacked(hashIterator));
      count += 1;
    }

    return false;
  }

  /// @dev Checks if CredProtocolScore return value is equal to a given uint256 value
  /// @param _attrValue return value of query
  /// @param _expectedInt expected CredProtocolScore value as uint256
  function credProtocolScoreIsEqual(bytes32 _attrValue, uint256 _expectedInt) public pure returns (bool) {
    return(uint256(_attrValue) == _expectedInt);
  }

  /// @dev Checks if CredProtocolScore return value is greater than a given uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound CredProtocolScore value as uint256
  function credProtocolScoreGreaterThan(bytes32 _attrValue, uint256 _lowerBound) public pure returns (bool) {
    return(uint256(_attrValue) > _lowerBound);
  }

  /// @dev Checks if CredProtocolScore return value is greater than or equal to a given uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound CredProtocolScore value as uint256
  function credProtocolScoreGreaterThanEqual(bytes32 _attrValue, uint256 _lowerBound) public pure returns (bool) {
    return(uint256(_attrValue) >= _lowerBound);
  }

  /// @dev Checks if CredProtocolScore return value is less than a given uint256 value
  /// @param _attrValue return value of query
  /// @param _upperBound upper bound CredProtocolScore value as uint256
  function credProtocolScoreLessThan(bytes32 _attrValue, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) < _upperBound);
  }

  /// @dev Checks if CredProtocolScore return value is less than or equal to a given uint256 value
  /// @param _attrValue return value of query
  /// @param _upperBound upper bound CredProtocolScore value as uint256
  function credProtocolScoreLessThanEqual(bytes32 _attrValue, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) <= _upperBound);
  }

  /// @dev Checks if CredProtocolScore return value is inclusively between two uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound CredProtocolScore value as uint256
  /// @param _upperBound upper bound CredProtocolScore value as uint256
  function credProtocolScoreBetweenInclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) <= _upperBound && uint256(_attrValue) >= _lowerBound);
  }

  /// @dev Checks if CredProtocolScore return value is exlusively between two uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound CredProtocolScore value as uint256
  /// @param _upperBound upper bound CredProtocolScore value as uint256
  function credProtocolScoreBetweenExclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) < _upperBound && uint256(_attrValue) > _lowerBound);
  }

}

