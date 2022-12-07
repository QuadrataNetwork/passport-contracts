// SPDX-License-Identifier: MIT
pragma solidity >= 0.5.0;

library QueryUtils {
  // IsBusiness
  function IsBusinessTrue(bytes32 _attrValue) public pure returns (bool) {
    return(_attrValue == keccak256("TRUE"));
  }

  function IsBusinessFalse(bytes32 _attrValue) public pure returns (bool) {
    return(_attrValue == keccak256("FALSE"));
  }

  // Country
  function CountryIsEqual(bytes32 _attrValue, string memory _expectedString) public pure returns (bool) {
    return(_attrValue == keccak256(abi.encodePacked(_expectedString)));
  }

  // AML
  function AmlIsEqual(bytes32 _attrValue, uint256 _expectedInt) public pure returns (bool) {
    return(uint256(_attrValue) == _expectedInt);
  }

  function AmlGreaterThan(bytes32 _attrValue, uint256 _lowerBound) public pure returns (bool) {
    return(uint256(_attrValue) > _lowerBound);
  }

  function AmlGreaterThanEqual(bytes32 _attrValue, uint256 _lowerBound) public pure returns (bool) {
    return(uint256(_attrValue) >= _lowerBound);
  }

  function AmlLessThan(bytes32 _attrValue, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) < _upperBound);
  }

  function AmlLessThanEqual(bytes32 _attrValue, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) <= _upperBound);
  }

  function AmlBetweenInclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) <= _upperBound && uint256(_attrValue) >= _lowerBound);
  }

  function AmlBetweenExclusive(bytes32 _attrValue, uint256 _lowerBound, uint256 _upperBound) public pure returns (bool) {
    return(uint256(_attrValue) < _upperBound && uint256(_attrValue) > _lowerBound);
  }

  // Cred Protocol Score
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

