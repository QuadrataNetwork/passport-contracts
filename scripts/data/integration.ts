import { ethers } from "hardhat";
import { getAddress } from "ethers/lib/utils";

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
} = require("../../utils/constant.ts");

export const QUADRATA_TREASURY = getAddress(
  "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1"
);

export const TIMELOCK = getAddress(
  "0x484ea071fB248B63Cbf4bf10BeAf01D6e65Ba4CD"
); // Goerli

export const MULTISIG = getAddress(
  "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1"
); // Goerli

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
export const MAX_GAS_FEE = ethers.utils.parseUnits("4.1337", "gwei");

export const ISSUERS = [
  {
    wallet: getAddress("0xAB5f37eA10Bd98228CDd5cD59605241DfE811701"), // SpringLabs Prod testnet
    treasury: getAddress("0xf36F155486299eCAff2D4F5160ed5114C1f66000"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },
];
