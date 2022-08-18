import { parseEther } from "ethers/lib/utils";
const { ethers } = require("hardhat");

export const ISSUER_ROLE = ethers.utils.id("ISSUER_ROLE");
export const PAUSER_ROLE = ethers.utils.id("PAUSER_ROLE");
export const READER_ROLE = ethers.utils.id("READER_ROLE");
export const GOVERNANCE_ROLE = ethers.utils.id("GOVERNANCE_ROLE");
export const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;

export const ATTRIBUTE_AML = ethers.utils.id("AML");
export const ATTRIBUTE_COUNTRY = ethers.utils.id("COUNTRY");
export const ATTRIBUTE_DID = ethers.utils.id("DID");
export const ATTRIBUTE_IS_BUSINESS = ethers.utils.id("IS_BUSINESS");
export const TOKEN_ID = 1;

export const PRICE_PER_ATTRIBUTES_ETH = {
  [ATTRIBUTE_AML]: parseEther("0.001"),
  [ATTRIBUTE_COUNTRY]: parseEther("0.002"),
  [ATTRIBUTE_DID]: parseEther("0.003"),
  [ATTRIBUTE_IS_BUSINESS]: parseEther("0"),
};

export const PRICE_PER_BUSINESS_ATTRIBUTES_ETH = {
  [ATTRIBUTE_AML]: parseEther("0.001"),
  [ATTRIBUTE_COUNTRY]: parseEther("0.002"),
  [ATTRIBUTE_DID]: parseEther("0.003"),
  [ATTRIBUTE_IS_BUSINESS]: parseEther("0"),
};

export const MINT_PRICE = parseEther("0.003");
export const ISSUER_SPLIT = 50;

export const DIGEST_TO_SIGN = ethers.utils.id("Quadrata");

export const HARDHAT_CHAIN_ID = 31337;
