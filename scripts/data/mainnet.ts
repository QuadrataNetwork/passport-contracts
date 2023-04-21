import { ethers } from "hardhat";
import { getAddress } from "ethers/lib/utils";

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_ACCREDITED_INVESTOR_US,
  NETWORK_IDS,
  ATTRIBUTE_CRED_PROTOCOL_SCORE,
} = require("../../utils/constant.ts");

export const QUADRATA_TREASURY = {
  [NETWORK_IDS.MAINNET]: getAddress(
    "0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21"
  ),
  [NETWORK_IDS.POLYGON]: getAddress(
    "0x6d0E07D8b8F698EFcDb7F118F050717F9075f2ca"
  ),
};

export const TIMELOCK = {
  [NETWORK_IDS.MAINNET]: getAddress(
    "0x76694A182dB047067521c73161Ebf3Db5Ca988d3"
  ),
  [NETWORK_IDS.POLYGON]: getAddress(
    "0x76694A182dB047067521c73161Ebf3Db5Ca988d3"
  ),
};

export const MULTISIG = {
  [NETWORK_IDS.MAINNET]: getAddress(
    "0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21"
  ),
  [NETWORK_IDS.POLYGON]: getAddress(
    "0x6d0E07D8b8F698EFcDb7F118F050717F9075f2ca"
  ),
};

// Careful - this doesn't work for Contract Deployment today
export const MAX_GAS_FEE = {
  [NETWORK_IDS.MAINNET]: ethers.utils.parseUnits("10.001", "gwei"),
  [NETWORK_IDS.POLYGON]: ethers.utils.parseUnits("50.001", "gwei"),
};

export const ISSUERS: any[] = [
  {
    wallet: getAddress("0x7256a9eE71fFFc02a92CAbBf950ea6e27f71bBF5"), // Quadrata
    treasury: getAddress("0x7256a9eE71fFFc02a92CAbBf950ea6e27f71bBF5"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_CRED_PROTOCOL_SCORE,
      ATTRIBUTE_ACCREDITED_INVESTOR_US,
    ],
  },
];

export const OPERATOR = "0x5b88baae69b810df88A53aB5e1400A92d4d2BD28";
export const READER_ONLY = "0x1A01f08Ef4Ee82313FaceF33bCEC1C399f92bF57";
