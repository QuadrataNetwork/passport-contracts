import { getAddress } from "ethers/lib/utils";

export const {
  MULTISIG,
  QUADRATA_TREASURY,
  TIMELOCK,
  MAX_GAS_FEE,
  ISSUERS,
  OPERATOR,
  READER_ONLY,
} = require("./int_testnet.ts");

const { NETWORK_IDS, HARDHAT_CHAIN_ID } = require("../../utils/constant.ts");

export const QUAD_GOVERNANCE = {
  [NETWORK_IDS.GOERLI]: getAddress(
    "0x0ec036A8801578B11413a9b3Aa2Be32078c93731"
  ),
  [NETWORK_IDS.SEPOLIA]: getAddress(
    "0x0ec036A8801578B11413a9b3Aa2Be32078c93731"
  ),
  [NETWORK_IDS.MUMBAI]: getAddress(
    "0x0ec036A8801578B11413a9b3Aa2Be32078c93731"
  ),
  [NETWORK_IDS.FUJI]: getAddress("0x0ec036A8801578B11413a9b3Aa2Be32078c93731"),
  [NETWORK_IDS.TEVMOS]: getAddress(
    "0x0ec036A8801578B11413a9b3Aa2Be32078c93731"
  ),
  [NETWORK_IDS.ARBITRUM_GOERLI]: getAddress(
    "0x0ec036A8801578B11413a9b3Aa2Be32078c93731"
  ),
  [NETWORK_IDS.OPTIMISM_GOERLI]: getAddress(
    "0x0ec036A8801578B11413a9b3Aa2Be32078c93731"
  ),
  [NETWORK_IDS.KAVA_TESTNET]: getAddress(
    "0x0ec036A8801578B11413a9b3Aa2Be32078c93731"
  ),
  [HARDHAT_CHAIN_ID]: getAddress(
    "0x596ce077ff6959d6b427AF70E2675d4E9BDd5A84"
  ),
};

export const QUAD_PASSPORT = {
  [NETWORK_IDS.GOERLI]: getAddress(
    "0x50602dd387511Dc85695f66bFE0A192D4c4BA7fC"
  ),
  [NETWORK_IDS.SEPOLIA]: getAddress(
    "0x50602dd387511Dc85695f66bFE0A192D4c4BA7fC"
  ),
  [NETWORK_IDS.MUMBAI]: getAddress(
    "0x50602dd387511Dc85695f66bFE0A192D4c4BA7fC"
  ),
  [NETWORK_IDS.FUJI]: getAddress("0x50602dd387511Dc85695f66bFE0A192D4c4BA7fC"),
  [NETWORK_IDS.TEVMOS]: getAddress(
    "0x50602dd387511Dc85695f66bFE0A192D4c4BA7fC"
  ),
  [NETWORK_IDS.ARBITRUM_GOERLI]: getAddress(
    "0x50602dd387511Dc85695f66bFE0A192D4c4BA7fC"
  ),
  [NETWORK_IDS.OPTIMISM_GOERLI]: getAddress(
    "0x50602dd387511Dc85695f66bFE0A192D4c4BA7fC"
  ),
  [NETWORK_IDS.KAVA_TESTNET]: getAddress(
    "0x50602dd387511Dc85695f66bFE0A192D4c4BA7fC"
  ),
  [HARDHAT_CHAIN_ID]: getAddress(
    "0xaAeB1836e71f10Fb0435aF4852DC45D202C9F5E5"
  ),
};

export const QUAD_READER = {
  [NETWORK_IDS.GOERLI]: getAddress(
    "0x4503f347595862Fa120D964D5F8c9DFBdc6B2731"
  ),
  [NETWORK_IDS.SEPOLIA]: getAddress(
    "0x4503f347595862Fa120D964D5F8c9DFBdc6B2731"
  ),
  [NETWORK_IDS.MUMBAI]: getAddress(
    "0x4503f347595862Fa120D964D5F8c9DFBdc6B2731"
  ),
  [NETWORK_IDS.FUJI]: getAddress("0x4503f347595862Fa120D964D5F8c9DFBdc6B2731"),
  [NETWORK_IDS.TEVMOS]: getAddress(
    "0x4503f347595862Fa120D964D5F8c9DFBdc6B2731"
  ),
  [NETWORK_IDS.ARBITRUM_GOERLI]: getAddress(
    "0x4503f347595862Fa120D964D5F8c9DFBdc6B2731"
  ),
  [NETWORK_IDS.OPTIMISM_GOERLI]: getAddress(
    "0x4503f347595862Fa120D964D5F8c9DFBdc6B2731"
  ),
  [NETWORK_IDS.KAVA_TESTNET]: getAddress(
    "0x4503f347595862Fa120D964D5F8c9DFBdc6B2731"
  ),
  [HARDHAT_CHAIN_ID]: getAddress(
    "0xA41e864248d5e0C79F1d9b70909EF722516Ca22f"
  ),
};
