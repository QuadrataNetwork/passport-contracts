// SPDX-License-Identifier: MIT
pragma solidity >= 0.5.0;

library QueryUtils {
  /// @dev Checks if IsBusiness return value is true
  /// @param _attrValue return value of query
  function IsBusinessTrue(bytes32 _attrValue) public pure returns (bool) {
    return(_attrValue == keccak256("TRUE"));
  }

  /// @dev Checks if IsBusiness return value is false
  /// @param _attrValue return value of query
  function IsBusinessFalse(bytes32 _attrValue) public pure returns (bool) {
    return(_attrValue == keccak256("FALSE"));
  }

  /// @dev Checks if Country return value is equal to a given string value
  /// @param _attrValue return value of query
  /// @param _expectedString expected country value as string
  function CountryIsEqual(bytes32 _attrValue, string memory _expectedString) public pure returns (bool) {
    return(_attrValue == keccak256(abi.encodePacked(_expectedString)));
  }

  /// @dev Checks if AML return value is equal to a given uint256 value
  /// @param _attrValue return value of query
  /// @param _expectedString expected AML value as uint256
  function AmlIsEqual(bytes32 _attrValue, uint256 _expectedInt) public pure returns (bool) {
    return(uint256(_attrValue) == _expectedInt);
  }

  /// @dev Checks if AML return value is greater than a given uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound AML value as uint256
  function AmlGreaterThan(bytes32 _attrValue, uint256 _lowerBound) public pure returns (bool) {
    return(uint256(_attrValue) > _lowerBound);
  }

  /// @dev Checks if AML return value is greater than or equal to a given uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound AML value as uint256
  function AmlGreaterThanEqual(bytes32 _attrValue, uint256 _lowerBound) public pure returns (bool) {
    return(uint256(_attrValue) >= _lowerBound);
  }

  /// @dev Checks if AML return value is less than a given uint256 value
  /// @param _attrValue return value of query
  /// @param _upperBound upper bound AML value as uint256
  function AmlLessThan(bytes32 _attrValue, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) < _upperBound);
  }

  /// @dev Checks if AML return value is less than or equal to a given uint256 value
  /// @param _attrValue return value of query
  /// @param _upperBound upper bound AML value as uint256
  function AmlLessThanEqual(bytes32 _attrValue, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) <= _upperBound);
  }

  /// @dev Checks if AML return value is inclusively between two uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound AML value as uint256
  /// @param _upperBound upper bound AML value as uint256
  function AmlBetweenInclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) <= _upperBound && uint256(_attrValue) >= _lowerBound);
  }

  /// @dev Checks if AML return value is exlusively between two uint256 value
  /// @param _attrValue return value of query
  /// @param _lowerBound lower bound AML value as uint256
  /// @param _upperBound upper bound AML value as uint256
  function AmlBetweenExclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) < _upperBound && uint256(_attrValue) > _lowerBound);
  }

  /// @dev Checks if supplied hash is within threshold of onchain Cred Protocol value
  /// @param _attrValue return value of query
  /// @param _startingHash starting proof hash
  /// @param _iteratorThreshold maximum number of hashing to meet criteria
  function CredProtocolScoreIteratorLessThan(bytes32 _attrValue, bytes32 _startingHash, uint256 _iteratorThreshold) public pure returns (bool){
    uint256 count = 0 ;
    bytes32 hashIterator = _startingHash;

    for(uint256 i = 0; i < 100; i++){
      if(hashIterator==_attrValue){
        return(count <= _iteratorThreshold);
      }
      hashIterator = keccak256(abi.encodePacked(hashIterator));
      count += 1;
    }

    return false;
  }
}

