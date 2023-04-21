import { ethers } from "hardhat";
import { getAddress } from "ethers/lib/utils";

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_CRED_PROTOCOL_SCORE,
  ATTRIBUTE_ACCREDITED_INVESTOR_US,
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
  [NETWORK_IDS.FUJI]: getAddress("0x767B123Bd05697d8Dda135D1D0092a94ac5a7510"),
};

export const TIMELOCK = {
  [NETWORK_IDS.MUMBAI]: getAddress(
    "0x484ea071fB248B63Cbf4bf10BeAf01D6e65Ba4CD"
  ),
  [NETWORK_IDS.GOERLI]: getAddress(
    "0x484ea071fB248B63Cbf4bf10BeAf01D6e65Ba4CD"
  ),
  [NETWORK_IDS.FUJI]: getAddress("0xb496D9CFc65Ff223F3c08d188b2B9aDe58a335CA"),
};

export const MULTISIG = {
  [NETWORK_IDS.MUMBAI]: getAddress(
    "0x096A0Fb5954998Aa9F711B98E4d1A65f342F69Db"
  ),
  [NETWORK_IDS.GOERLI]: getAddress(
    "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1"
  ),
  [NETWORK_IDS.FUJI]: getAddress("0x767B123Bd05697d8Dda135D1D0092a94ac5a7510"),
};

// Careful - this doesn't work for Contract Deployment today
export const MAX_GAS_FEE = ethers.utils.parseUnits("70.1337", "gwei");

export const ISSUERS = [
  {
    wallet: getAddress("0x19c6525E6927554e311Cd83491d34623fF04605a"), // Quadrata Sandbox
    treasury: getAddress("0x19c6525E6927554e311Cd83491d34623fF04605a"),
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_CRED_PROTOCOL_SCORE,
      ATTRIBUTE_ACCREDITED_INVESTOR_US,
    ],
  },

  {
    wallet: getAddress("0x1E56ceCC4115aC14dE1DE645B4d1bB98B1Bf071E"), // SpringLabs
    treasury: getAddress("0x1E56ceCC4115aC14dE1DE645B4d1bB98B1Bf071E"),
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

export const OPERATOR = "0x0C19DFd4Edc2545b456AdFF3f4948929a06a206C";
export const READER_ONLY = "0xA88948CA8912c1D3C5639f1694adbc1907F9A931";
