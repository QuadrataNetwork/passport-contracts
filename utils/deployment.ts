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
    const tx = await governance.addIssuer(
      issuers[i].wallet,
      issuers[i].treasury
    );
    await tx.wait();
    if (verbose)
      console.log(
        `[QuadGovernance] addIssuer ${issuers[i].wallet} with treasury ${issuers[i].treasury}`
      );
  }

  // Set Protocol Treasury
  let tx = await governance.setTreasury(treasury);
  await tx.wait();
  if (verbose)
    console.log(
      `[QuadGovernance] Protocol Treasury has been set to ${treasury}`
    );

  // Link Governance & Passport contracts
  tx = await governance.setPassportContractAddress(passport.address);
  await tx.wait();
  if (verbose)
    console.log(
      `[QuadGovernance] setPassportContractAddress with ${passport.address}`
    );

  // Set Eligible TokenId
  for (let i = 0; i < tokenIds.length; i++) {
    tx = await governance.setEligibleTokenId(tokenIds[i], true);
    await tx.wait();
  }
  if (verbose)
    console.log(`[QuadGovernance] setEligibleTokenId for ${tokenIds}`);

  // Set Eligible Attributes
  tx = await governance.setEligibleAttribute(ATTRIBUTE_DID, true);
  await tx.wait();
  if (verbose)
    console.log(`[QuadGovernance] setEligibleAttribute for ATTRIBUTE_DID`);
  tx = await governance.setEligibleAttribute(ATTRIBUTE_COUNTRY, true);
  await tx.wait();
  if (verbose)
    console.log(`[QuadGovernance] setEligibleAttribute for ATTRIBUTE_COUNTRY`);
  tx = await governance.setEligibleAttribute(ATTRIBUTE_IS_BUSINESS, true);
  await tx.wait();
  if (verbose)
    console.log(
      `[QuadGovernance] setEligibleAttribute for ATTRIBUTE_IS_BUSINESS`
    );

  // Set Eligible Attributes by DID
  tx = await governance.setEligibleAttributeByDID(ATTRIBUTE_AML, true);
  await tx.wait();
  if (verbose)
    console.log(`[QuadGovernance] setEligibleAttributeByDID for ATTRIBUTE_AML`);

  // Set Rev Split
  tx = await governance.setRevSplitIssuer(50);
  await tx.wait();
  if (verbose) console.log(`[QuadGovernance] setRevSplitIssuer with 50`);

  // Set Query Fee
  const attributeTypes = [ATTRIBUTE_DID, ATTRIBUTE_AML, ATTRIBUTE_COUNTRY];

  for (const attr of attributeTypes) {
    tx = await governance.setAttributePriceFixed(
      attr,
      PRICE_PER_ATTRIBUTES_ETH[attr]
    );
    await tx.wait();

    tx = await governance.setBusinessAttributePriceFixed(
      attr,
      PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attr]
    );
    await tx.wait();
  }
  if (verbose)
    console.log(`[QuadGovernance] setAttributePriceFixed for all attributes`);
  if (verbose)
    console.log(
      `[QuadGovernance] setBusinessAttributePriceFixed for all attributes`
    );

  // Set QuadReader as READER_ROLE
  tx = await governance.grantRole(READER_ROLE, reader.address);
  await tx.wait();
  if (verbose)
    console.log(`[QuadGovernance] grant READER_ROLE to ${reader.address}`);

  // Grant `GOVERNANCE_ROLE` and `DEFAULT_ADMIN_ROLE` to Timelock
  tx = await governance.grantRole(GOVERNANCE_ROLE, timelock);
  await tx.wait();
  if (verbose)
    console.log(`[QuadGovernance] grant GOVERNANCE_ROLE to ${timelock}`);
  tx = await governance.grantRole(DEFAULT_ADMIN_ROLE, timelock);
  await tx.wait();
  if (verbose)
    console.log(`[QuadGovernance] grant DEFAULT_ADMIN_ROLE to ${timelock}`);

  // GRANT `PAUSER_ROLE` to MULTISIG
  tx = await governance.grantRole(PAUSER_ROLE, multisig);
  await tx.wait();
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
