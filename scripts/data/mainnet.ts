import { ethers } from "hardhat";
import { getAddress } from "ethers/lib/utils";

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
  NETWORK_IDS,
} = require("../../utils/constant.ts");

export const QUADRATA_TREASURY = {
  [NETWORK_IDS.MAINNET]: getAddress(
    "0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21"
  ),
  [NETWORK_IDS.POLYGON]: getAddress(
    "0x6d0E07D8b8F698EFcDb7F118F050717F9075f2ca"
  ),
};

export const TIMELOCK = getAddress(
  "0x76694A182dB047067521c73161Ebf3Db5Ca988d3"
);

export const MULTISIG = {
  [NETWORK_IDS.MAINNET]: getAddress(
    "0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21"
  ),
  [NETWORK_IDS.POLYGON]: getAddress(
    "0x6d0E07D8b8F698EFcDb7F118F050717F9075f2ca"
  ),
};

export const TOKEN_IDS = [
  {
    id: 1,
    uri: "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu",
  },
  {
    id: 2,
    uri: "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu",
  },
  {
    id: 3,
    uri: "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu",
  },
];

// Careful - this doesn't work for Contract Deployment today
export const MAX_GAS_FEE = {
  [NETWORK_IDS.MAINNET]: ethers.utils.parseUnits("4.001", "gwei"),
  [NETWORK_IDS.POLYGON]: ethers.utils.parseUnits("50.001", "gwei"),
};

export const ISSUERS: any[] = [
  {
    wallet: getAddress("0x38a08d73153F32DBB2f867338d0BD6E3746E3391"), // SpringLabs
    treasury: getAddress("0x5F3f69808772C56Daee7A5d3176990733C67A123"), // SpringLabs Issuer
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },
];
