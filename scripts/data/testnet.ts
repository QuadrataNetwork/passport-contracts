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
  [NETWORK_IDS.FUJI]: getAddress(
    "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1"
  ),
  [NETWORK_IDS.CELO_TESTNET]: getAddress(
    "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1"
  ),
  [NETWORK_IDS.ARBITRUM_TESTNET]: getAddress(
    "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1"
  ),
  [NETWORK_IDS.OPTIMISM_TESTNET]: getAddress(
    "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1"
  ),
  [NETWORK_IDS.FANTOM_TESTNET]: getAddress(
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
  [NETWORK_IDS.FUJI]: getAddress(
    "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1"
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
export const MAX_GAS_FEE = ethers.utils.parseUnits("413.37", "gwei");

export const ISSUERS = [
  {
    wallet: getAddress("0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38"), // SpringLabs L/E issuers
    treasury: getAddress("0xf36F155486299eCAff2D4F5160ed5114C1f66000"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_CRED_PROTOCOL_SCORE
    ],
  },

  {
    wallet: getAddress("0x8859c986F102924DBeC3767b67497b8d89Be2463"), // SpringLabs L/E issuers
    treasury: getAddress("0xf36F155486299eCAff2D4F5160ed5114C1f66000"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_CRED_PROTOCOL_SCORE
    ],
  },

  {
    wallet: getAddress("0x3097988FD29cD00f2C27B2b964F99Ac974d30A41"), // SpringLabs L/E issuers
    treasury: getAddress("0xf36F155486299eCAff2D4F5160ed5114C1f66000"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_CRED_PROTOCOL_SCORE
    ],
  },

  {
    wallet: getAddress("0x4c7E4C698f7D955981912FdDBA84cBFE84101d1E"), // SpringLabs L/E issuers
    treasury: getAddress("0xf36F155486299eCAff2D4F5160ed5114C1f66000"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_CRED_PROTOCOL_SCORE
    ],
  },

  {
    wallet: getAddress("0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431"), // SpringLabs L/E issuers
    treasury: getAddress("0xf36F155486299eCAff2D4F5160ed5114C1f66000"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_CRED_PROTOCOL_SCORE
    ],
  },

  {
    wallet: getAddress("0xAB5f37eA10Bd98228CDd5cD59605241DfE811701"), // SpringLabs Prod testnet
    treasury: getAddress("0xf36F155486299eCAff2D4F5160ed5114C1f66000"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_CRED_PROTOCOL_SCORE
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
      ATTRIBUTE_CRED_PROTOCOL_SCORE
    ],
  },

  {
    wallet: getAddress("0x175DB8512CF71c3848F2bB90E5021Fc60A877ADf"), // Quadrata Sandbox 2
    treasury: getAddress("0xf36F155486299eCAff2D4F5160ed5114C1f66000"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_CRED_PROTOCOL_SCORE
    ],
  },
];
