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

export const DEACTIVATED = 0;
export const ACTIVE = 1;

export const PRICE_PER_ATTRIBUTES = {
  [ATTRIBUTE_AML]: 0,
  [ATTRIBUTE_COUNTRY]: 1,
  [ATTRIBUTE_DID]: 2,
  [ATTRIBUTE_IS_BUSINESS]: 0
};

export const PRICE_PER_BUSINESS_ATTRIBUTES = {
  [ATTRIBUTE_AML]: 0,
  [ATTRIBUTE_COUNTRY]: 5,
  [ATTRIBUTE_DID]: 10,
  [ATTRIBUTE_IS_BUSINESS]: 0
};

export const PRICE_SET_ATTRIBUTE = {
  [ATTRIBUTE_AML]: parseEther("0.01"),
  [ATTRIBUTE_COUNTRY]: parseEther("0.01"),
  [ATTRIBUTE_IS_BUSINESS]: parseEther("0.00"),
};

export const ISSUER_STATUS = {
  ACTIVE: 0,
  DEACTIVATED: 1
}

export const MINT_PRICE = parseEther("0.003");
export const ISSUER_SPLIT = 50;
