import { parseEther } from "ethers/lib/utils";
const { ethers } = require("hardhat");

export const ISSUER_ROLE = ethers.utils.id("ISSUER_ROLE");
export const PAUSER_ROLE = ethers.utils.id("PAUSER_ROLE");
export const READER_ROLE = ethers.utils.id("READER_ROLE");
export const GOVERNANCE_ROLE = ethers.utils.id("GOVERNANCE_ROLE");
export const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
export const TIMELOCK_ADMIN_ROLE =
  "0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5";
export const PROPOSER_ROLE =
  "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1";
export const EXECUTOR_ROLE =
  "0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63";

export const ATTRIBUTE_AML = ethers.utils.id("AML");
export const ATTRIBUTE_COUNTRY = ethers.utils.id("COUNTRY");
export const ATTRIBUTE_DID = ethers.utils.id("DID");
export const ATTRIBUTE_IS_BUSINESS = ethers.utils.id("IS_BUSINESS");
export const TOKEN_ID = 1;

export const ALL_PASSPORT_ROLES = [
  GOVERNANCE_ROLE,
  PAUSER_ROLE,
  ISSUER_ROLE,
  DEFAULT_ADMIN_ROLE,
  READER_ROLE,
];

export const ALL_TIMELOCK_ROLES = [
  TIMELOCK_ADMIN_ROLE,
  PROPOSER_ROLE,
  EXECUTOR_ROLE,
  DEFAULT_ADMIN_ROLE,
];

export const ALL_ATTRIBUTES = [
  ATTRIBUTE_AML,
  ATTRIBUTE_DID,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
];
export const ALL_ACCOUNT_LEVEL_ATTRIBUTES = [
  ATTRIBUTE_DID,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
];

export const ALL_ATTRIBUTES_BY_DID = [ATTRIBUTE_AML];

export const PRICE_PER_ATTRIBUTES_ETH = {
  [ATTRIBUTE_AML]: parseEther("0.0012"),
  [ATTRIBUTE_COUNTRY]: parseEther("0.0012"),
  [ATTRIBUTE_DID]: parseEther("0.0012"),
  [ATTRIBUTE_IS_BUSINESS]: parseEther("0"),
};

export const PRICE_PER_BUSINESS_ATTRIBUTES_ETH = {
  [ATTRIBUTE_AML]: parseEther("0.015"),
  [ATTRIBUTE_COUNTRY]: parseEther("0.015"),
  [ATTRIBUTE_DID]: parseEther("0.015"),
  [ATTRIBUTE_IS_BUSINESS]: parseEther("0"),
};

export const MINT_PRICE = parseEther("0.003");
export const ISSUER_SPLIT = 50;

export const DIGEST_TO_SIGN = ethers.utils.id(
  "Welcome to Quadrata! By signing, you agree to the Terms of Service."
);

export const HARDHAT_CHAIN_ID = 31337;
