import { Contract } from "ethers";
const { ethers, upgrades } = require("hardhat");

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_AML,
  ATTRIBUTE_IS_BUSINESS,
  PRICE_PER_ATTRIBUTES_ETH,
  PRICE_PER_BUSINESS_ATTRIBUTES_ETH,
  READER_ROLE,
  GOVERNANCE_ROLE,
  DEFAULT_ADMIN_ROLE,
  PAUSER_ROLE,
} = require("./constant.ts");

export const deployQuadrata = async (
  timelock: string,
  issuers: any[],
  treasury: string,
  multisig: string,
  tokenIds: number[],
  verbose: boolean = false
) => {
  const governance = await deployGovernance();
  if (verbose) console.log(`QuadGovernance is deployed: ${governance.address}`);
  const passport = await deployPassport(governance);
  if (verbose) console.log(`QuadPassport is deployed: ${passport.address}`);
  const reader = await deployReader(governance, passport);
  if (verbose) console.log("QuadReader is deployed: ", reader.address);

  // Add all Issuers & their respective treasury
  for (let i = 0; i < issuers.length; i++) {
    await governance.addIssuer(issuers[i].wallet, issuers[i].treasury);
  }
  if (verbose)
    console.log(
      `[QuadGovernance] ${issuers.length} issuers have been added with their treasuries`
    );

  // Set Protocol Treasury
  await governance.setTreasury(treasury);
  if (verbose)
    console.log(
      `[QuadGovernance] Protocol Treasury has been set to ${treasury}`
    );

  // Link Governance & Passport contracts
  await governance.setPassportContractAddress(passport.address);
  if (verbose)
    console.log(
      `[QuadGovernance] setPassportContractAddress with ${passport.address}`
    );

  // Set Eligible TokenId
  for (let i = 0; i < tokenIds.length; i++) {
    await governance.setEligibleTokenId(tokenIds[i], true);
  }
  if (verbose)
    console.log(`[QuadGovernance] setEligibleTokenId for ${tokenIds}`);

  // Set Eligible Attributes
  await governance.setEligibleAttribute(ATTRIBUTE_DID, true);
  await governance.setEligibleAttribute(ATTRIBUTE_COUNTRY, true);
  await governance.setEligibleAttribute(ATTRIBUTE_IS_BUSINESS, true);
  if (verbose)
    console.log(`[QuadGovernance] setEligibleAttribute for ATTRIBUTE_DID`);
  if (verbose)
    console.log(`[QuadGovernance] setEligibleAttribute for ATTRIBUTE_COUNTRY`);
  if (verbose)
    console.log(
      `[QuadGovernance] setEligibleAttribute for ATTRIBUTE_IS_BUSINESS`
    );

  // Set Eligible Attributes by DID
  await governance.setEligibleAttributeByDID(ATTRIBUTE_AML, true);
  if (verbose)
    console.log(`[QuadGovernance] setEligibleAttributeByDID for ATTRIBUTE_AML`);

  // Set Rev Split
  await governance.setRevSplitIssuer(50);
  if (verbose) console.log(`[QuadGovernance] setRevSplitIssuer with 50`);

  // Set Query Fee
  const attributeTypes = [ATTRIBUTE_DID, ATTRIBUTE_AML, ATTRIBUTE_COUNTRY];

  for (const attr of attributeTypes) {
    await governance.setAttributePriceFixed(
      attr,
      PRICE_PER_ATTRIBUTES_ETH[attr]
    );

    await governance.setBusinessAttributePriceFixed(
      attr,
      PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attr]
    );
  }
  if (verbose)
    console.log(`[QuadGovernance] setAttributePriceFixed for all attributes`);
  if (verbose)
    console.log(
      `[QuadGovernance] setBusinessAttributePriceFixed for all attributes`
    );

  // Set QuadReader as READER_ROLE
  await governance.grantRole(READER_ROLE, reader.address);
  if (verbose)
    console.log(`[QuadGovernance] grant READER_ROLE to ${reader.address}`);

  // Grant `GOVERNANCE_ROLE` and `DEFAULT_ADMIN_ROLE` to Timelock
  await governance.grantRole(GOVERNANCE_ROLE, timelock);
  if (verbose)
    console.log(`[QuadGovernance] grant GOVERNANCE_ROLE to ${timelock}`);
  await governance.grantRole(DEFAULT_ADMIN_ROLE, timelock);
  if (verbose)
    console.log(`[QuadGovernance] grant DEFAULT_ADMIN_ROLE to ${timelock}`);

  // GRANT `PAUSER_ROLE` to MULTISIG
  await governance.grantRole(PAUSER_ROLE, multisig);
  if (verbose) console.log(`[QuadGovernance] grant PAUSER_ROLE to ${multisig}`);

  return [governance, passport, reader];
};

export const deployPassport = async (
  governance: Contract
): Promise<Contract> => {
  const QuadPassport = await ethers.getContractFactory("QuadPassport");
  const passport = await upgrades.deployProxy(
    QuadPassport,
    [governance.address],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor"] }
  );
  await passport.deployed();
  return passport;
};

export const deployGovernance = async (): Promise<Contract> => {
  const QuadGovernance = await ethers.getContractFactory("QuadGovernance");
  const governance = await upgrades.deployProxy(QuadGovernance, [], {
    initializer: "initialize",
    kind: "uups",
    unsafeAllow: ["constructor"],
  });
  await governance.deployed();
  return governance;
};

export const deployReader = async (
  governance: Contract,
  passport: Contract
): Promise<Contract> => {
  const QuadReader = await ethers.getContractFactory("QuadReader");
  const reader = await upgrades.deployProxy(
    QuadReader,
    [governance.address, passport.address],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor"] }
  );
  await reader.deployed();
  return reader;
};
