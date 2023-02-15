import "./QuadReaderStore.sol";

contract QuadReaderStoreV2 is QuadReaderStore {
    mapping(bytes32 => bool) internal _flashSigs;

    bytes32 internal _secret;
}