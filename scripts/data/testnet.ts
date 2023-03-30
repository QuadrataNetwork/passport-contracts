import { ethers } from "hardhat";
import { getAddress } from "ethers/lib/utils";

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_CRED_PROTOCOL_SCORE,
  NETWORK_IDS,
} = require("../../utils/constant.ts");

// Treasury is the same as `MLTISIG` in testnet
export const QUADRATA_TREASURY = {
  [NETWORK_IDS.MUMBAI]: getAddress(
    "0x096A0Fb5954998Aa9F711B98E4d1A65f342F69Db"
  ),
  [NETWORK_IDS.GOERLI]: getAddress(
    "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1"
  ),
};

export const TIMELOCK = getAddress(
  "0x484ea071fB248B63Cbf4bf10BeAf01D6e65Ba4CD"
);

export const MULTISIG = {
  [NETWORK_IDS.MUMBAI]: getAddress(
    "0x096A0Fb5954998Aa9F711B98E4d1A65f342F69Db"
  ),
  [NETWORK_IDS.GOERLI]: getAddress(
    "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1"
  ),
};

export const TOKEN_IDS = [
  {
    id: 1,
    uri: "ipfs://QmTgCFpyGdSDJehhpYJ8fHFo5wRfchdVxz8mAdGud5RcYc",
  },
  {
    id: 2,
    uri: "ipfs://QmTtANgqFTKZVwLxqebbBQdDYqoi4YnMLaRtW2PpE196uE",
  },
  {
    id: 3,
    uri: "ipfs://QmSJXYHPRDgQUFFMYGjoW6oDy7JuPQLcDJnSaqcB7TFRed",
  },
  {
    id: 4,
    uri: "ipfs://QmTFKP2b9moWzAhdWLELg2XGQkMMirgSxVvJDGArT7o4Cd",
  },
  {
    id: 5,
    uri: "ipfs://QmVisUZ78Hr9uTg9MaRi2M5PWRs39P3JGKwwTayJXdhUjD",
  },
  {
    id: 6,
    uri: "ipfs://QmUgZ9rP7iRAAaA6UBTNoid1NS1k3GbMaiXKN6VccUfw6h",
  },
  {
    id: 7,
    uri: "ipfs://QmU9Srf9P4Sh93tHJyStR3Y9YXr1EeD79dH6v1j1wQZoWv",
  },
  {
    id: 8,
    uri: "ipfs://QmcomrcMoSjm1yGdGr81P7JDwu3cYMx1sexXHL933k4nTE",
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
      ATTRIBUTE_CRED_PROTOCOL_SCORE,
    ],
  },

  {
    wallet: getAddress("0x19c6525E6927554e311Cd83491d34623fF04605a"), // Quadrata Sandbox
    treasury: getAddress("0xf36F155486299eCAff2D4F5160ed5114C1f66000"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_CRED_PROTOCOL_SCORE,
    ],
  },
];
