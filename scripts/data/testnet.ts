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
];

// Careful - this doesn't work for Contract Deployment today
export const MAX_GAS_FEE = ethers.utils.parseUnits("4.1337", "gwei");

export const ISSUERS = [
  {
    wallet: getAddress("0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38"), // SpringLabs L/E issuers
    treasury: getAddress("0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: getAddress("0x8859c986F102924DBeC3767b67497b8d89Be2463"), // SpringLabs L/E issuers
    treasury: getAddress("0x8859c986F102924DBeC3767b67497b8d89Be2463"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: getAddress("0x3097988FD29cD00f2C27B2b964F99Ac974d30A41"), // SpringLabs L/E issuers
    treasury: getAddress("0x3097988FD29cD00f2C27B2b964F99Ac974d30A41"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: getAddress("0x4c7E4C698f7D955981912FdDBA84cBFE84101d1E"), // SpringLabs L/E issuers
    treasury: getAddress("0x4c7E4C698f7D955981912FdDBA84cBFE84101d1E"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: getAddress("0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431"), // SpringLabs L/E issuers
    treasury: getAddress("0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: getAddress("0xAB5f37eA10Bd98228CDd5cD59605241DfE811701"), // SpringLabs Prod testnet
    treasury: getAddress("0xe5eF9Ce921f90086d55f0E8f541EF7892796268A"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: getAddress("0x19c6525E6927554e311Cd83491d34623fF04605a"), // Quadrata Sandbox
    treasury: getAddress("0x19c6525E6927554e311Cd83491d34623fF04605a"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: getAddress("0x175DB8512CF71c3848F2bB90E5021Fc60A877ADf"), // Quadrata Sandbox 2
    treasury: getAddress("0x175DB8512CF71c3848F2bB90E5021Fc60A877ADf"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },
];
