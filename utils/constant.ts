const { ethers } = require("hardhat");

export const ISSUER_ROLE = ethers.utils.id("ISSUER_ROLE");
export const PAUSER_ROLE = ethers.utils.id("PAUSER_ROLE");
export const GOVERNANCE_ROLE = ethers.utils.id("GOVERNANCE_ROLE");
export const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;

export const ATTRIBUTE_AML = ethers.utils.id("AML");
export const ATTRIBUTE_COUNTRY = ethers.utils.id("COUNTRY");
