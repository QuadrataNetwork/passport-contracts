import { ethers } from "hardhat";
import { getAddress } from "ethers/lib/utils";

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_ACCREDITED_INVESTOR_US,
  ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
  NETWORK_IDS,
  ATTRIBUTE_CRED_PROTOCOL_SCORE,
} = require("../../utils/constant.ts");

export const QUAD_GOVERNANCE = {
  [NETWORK_IDS.MAINNET]: getAddress(
    "0xBfa59A31b379A62304327386bC2b03096D7695B3"
  ),
  [NETWORK_IDS.POLYGON]: getAddress(
    "0xBfa59A31b379A62304327386bC2b03096D7695B3"
  ),
  [NETWORK_IDS.AVALANCHE]: getAddress(
    "0x757d32e9384A8882c325D306edc93E2c82d52e29"
  ),
  [NETWORK_IDS.EVMOS]: getAddress("0xBfa59A31b379A62304327386bC2b03096D7695B3"),
};

export const QUAD_PASSPORT = {
  [NETWORK_IDS.MAINNET]: getAddress(
    "0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d"
  ),
  [NETWORK_IDS.POLYGON]: getAddress(
    "0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d"
  ),
  [NETWORK_IDS.AVALANCHE]: getAddress(
    "0x97058A9B7D0ce525009083F9b2C219336ce97736"
  ),
  [NETWORK_IDS.EVMOS]: getAddress("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d"),
};

export const QUAD_READER = {
  [NETWORK_IDS.MAINNET]: getAddress(
    "0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da"
  ),
  [NETWORK_IDS.POLYGON]: getAddress(
    "0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da"
  ),
  [NETWORK_IDS.AVALANCHE]: getAddress(
    "0x673ab050Db82DB186e9D238Fb6969c88cd329aD1"
  ),
  [NETWORK_IDS.EVMOS]: getAddress("0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da"),
};

export const MULTISIG = {
  [NETWORK_IDS.MAINNET]: getAddress(
    "0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21"
  ),
  [NETWORK_IDS.POLYGON]: getAddress(
    "0x6d0E07D8b8F698EFcDb7F118F050717F9075f2ca"
  ),
  [NETWORK_IDS.AVALANCHE]: getAddress(
    "0xA8FD64E229B8685d55D726F934771800105ee587"
  ),
  [NETWORK_IDS.EVMOS]: getAddress("0x6E2b44A8F191cEE0ebD9F2dCA3592F205C235a3e"),
};

export const QUADRATA_TREASURY = MULTISIG;

export const TIMELOCK = {
  [NETWORK_IDS.MAINNET]: getAddress(
    "0x76694A182dB047067521c73161Ebf3Db5Ca988d3"
  ),
  [NETWORK_IDS.POLYGON]: getAddress(
    "0x76694A182dB047067521c73161Ebf3Db5Ca988d3"
  ),
  [NETWORK_IDS.AVALANCHE]: getAddress(
    "0x76694A182dB047067521c73161Ebf3Db5Ca988d3"
  ),
  [NETWORK_IDS.EVMOS]: getAddress("0x6E2b44A8F191cEE0ebD9F2dCA3592F205C235a3e"),
};

// Careful - this doesn't work for Contract Deployment today
export const MAX_GAS_FEE = {
  [NETWORK_IDS.MAINNET]: ethers.utils.parseUnits("10.001", "gwei"),
  [NETWORK_IDS.POLYGON]: ethers.utils.parseUnits("50.001", "gwei"),
  [NETWORK_IDS.AVALANCHE]: ethers.utils.parseUnits("50.001", "gwei"),
  [NETWORK_IDS.EVMOS]: ethers.utils.parseUnits("50.001", "gwei"),
};

export const ISSUERS: any[] = [
  {
    wallet: getAddress("0x7256a9eE71fFFc02a92CAbBf950ea6e27f71bBF5"), // Quadrata
    treasury: getAddress("0x6d0E07D8b8F698EFcDb7F118F050717F9075f2ca"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      // Quadrata does not have yet the authorization to post CRED_PROTOCOL_SCORE
      // ATTRIBUTE_CRED_PROTOCOL_SCORE,
      ATTRIBUTE_ACCREDITED_INVESTOR_US,
    ],
  },
  {
    wallet: getAddress("0xaa0a9bEa892E11C5F5E7786B510F4A78d23C2682"), // SpringLabs
    treasury: getAddress("0x5F3f69808772C56Daee7A5d3176990733C67A123"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
    ],
  },
];

export const OPERATOR = "0x5b88baae69b810df88A53aB5e1400A92d4d2BD28";
export const READER_ONLY = "0x1A01f08Ef4Ee82313FaceF33bCEC1C399f92bF57";
