//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

contract QuadConstant {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant READER_ROLE = keccak256("READER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    bytes32 public constant DIGEST_TO_SIGN = 0x40bcc49a8aa1e2bddcc6be2fa5edb7180e3b8d5f4c2d34fbccb65a41263dde31;
    bytes32 internal constant ATTRIBUTE_DID = 0x09deac0378109c72d82cccd3c343a90f7020f0f1af78dcd4fc949c6301aa9488;
    bytes32 internal constant ATTRIBUTE_IS_BUSINESS = 0xaf369ce728c816785c72f1ff0222ca9553b2cb93729d6a803be6af0d2369239b;
    bytes32 internal constant ATTRIBUTE_COUNTRY = 0xc4713d2897c0d675d85b414a1974570a575e5032b6f7be9545631a1f922b26ef;
    bytes32 internal constant ATTRIBUTE_AML = 0xaf192d67680c4285e52cd2a94216ce249fb4e0227d267dcc01ea88f1b020a119;
}
