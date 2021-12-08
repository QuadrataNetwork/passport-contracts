import { parseEther } from "ethers/lib/utils";
const { ethers } = require("hardhat");

export const ISSUER_ROLE = ethers.utils.id("ISSUER_ROLE");
export const PAUSER_ROLE = ethers.utils.id("PAUSER_ROLE");
export const GOVERNANCE_ROLE = ethers.utils.id("GOVERNANCE_ROLE");
export const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;

export const ATTRIBUTE_AML = ethers.utils.id("AML");
export const ATTRIBUTE_COUNTRY = ethers.utils.id("COUNTRY");
export const ATTRIBUTE_DID = ethers.utils.id("DID");
export const TOKEN_ID = 1;

export const PRICE_PER_ATTRIBUTES = {
  [ATTRIBUTE_AML]: 0,
  [ATTRIBUTE_COUNTRY]: 0,
  [ATTRIBUTE_DID]: 2,
};

export const MINT_PRICE = parseEther("0.03");
export const ISSUER_SPLIT = 50;
