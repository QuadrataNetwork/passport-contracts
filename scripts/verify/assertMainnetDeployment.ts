import { network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const { expect } = require("chai");
const { constants } = require("ethers");
const { ethers } = require("hardhat");

const {
  ALL_ATTRIBUTES,
  ALL_ACCOUNT_LEVEL_ATTRIBUTES,
  ALL_ATTRIBUTES_BY_DID,
  ALL_TIMELOCK_ROLES,
  ALL_PASSPORT_ROLES,
  GOVERNANCE_ROLE,
  PAUSER_ROLE,
  ISSUER_ROLE,
  DEFAULT_ADMIN_ROLE,
  READER_ROLE,
  PRICE_PER_ATTRIBUTES_ETH,
  PRICE_PER_BUSINESS_ATTRIBUTES_ETH,
  TIMELOCK_ADMIN_ROLE,
  PROPOSER_ROLE,
  EXECUTOR_ROLE,
  ISSUER_SPLIT,
} = require("../../utils/constant.ts");

const {
  QUADRATA_TREASURY,
  TIMELOCK,
  MULTISIG,
  TOKEN_IDS,
  ISSUERS,
} = require("../data/mainnet.ts");

// ------------ BEGIN - TO MODIFY --------------- //
const QUAD_GOV = "";
const QUAD_PASSPORT = "";
const QUAD_READER = "";

const DEPLOYER = "";

const TEDDY = "0xffE462ed723275eF8E7655C4883e8cD428826669";
const DANIEL = "0x5501CC22Be0F12381489D0980f20f872e1E6bfb9";
const TRAVIS = "0xD71bB1fF98D84ae00728f4A542Fa7A4d3257b33E";
// ------------ END - TO MODIFY --------------- //

const EXPECTED_USER_ROLES_PASSPORT = [
  { USER: TEDDY, ROLES: [] },
  { USER: DANIEL, ROLES: [] },
  { USER: TRAVIS, ROLES: [] },
  { USER: ISSUERS[0].wallet, ROLES: [ISSUER_ROLE] },
  { USER: QUADRATA_TREASURY, ROLES: [PAUSER_ROLE] }, // we expect treasury to be a pauser bc it is our multisig
  { USER: ISSUERS[0].treasury, ROLES: [] },
  { USER: DEPLOYER, ROLES: [] },
  { USER: TIMELOCK, ROLES: [DEFAULT_ADMIN_ROLE, GOVERNANCE_ROLE] },
  { USER: MULTISIG, ROLES: [PAUSER_ROLE] },
  { USER: QUAD_READER, ROLES: [READER_ROLE] },
  { USER: QUAD_GOV, ROLES: [] },
  { USER: QUAD_PASSPORT, ROLES: [] },
];

const EXPECTED_USER_ROLES_TIMELOCK = [
  { USER: TEDDY, ROLES: [EXECUTOR_ROLE] },
  { USER: DANIEL, ROLES: [] },
  { USER: TRAVIS, ROLES: [] },
  { USER: ISSUERS[0].wallet, ROLES: [] },
  { USER: QUADRATA_TREASURY, ROLES: [PROPOSER_ROLE] }, // we expect treasury to be a proposer bc it is our multisig
  { USER: ISSUERS[0].treasury, ROLES: [] },
  { USER: DEPLOYER, ROLES: [] },
  { USER: TIMELOCK, ROLES: [TIMELOCK_ADMIN_ROLE] },
  { USER: MULTISIG, ROLES: [PROPOSER_ROLE] },
  { USER: QUAD_READER, ROLES: [] },
  { USER: QUAD_GOV, ROLES: [] },
  { USER: QUAD_PASSPORT, ROLES: [] },
];

// MAINNET CHECKS
(async () => {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.ETHEREUM_MAINNET,
        },
      },
    ],
  });

  const passport = await ethers.getContractAt("QuadPassport", QUAD_PASSPORT);
  const governance = await ethers.getContractAt("QuadGovernance", QUAD_GOV);
  const reader = await ethers.getContractAt("QuadReader", QUAD_READER);
  const timelock = await ethers.getContractAt(
    "IAccessControlUpgradeable",
    TIMELOCK
  );

  // --------------- QuadPassport --------------------
  // Check Initialize
  expect(await passport.symbol()).equals("QP");
  expect(await passport.name()).equals("Quadrata Passport");
  expect(await passport.governance()).equals(QUAD_GOV);
  expect(await passport.pendingGovernance()).equals(constants.AddressZero);
  console.log("[QuadPassport] Initializer: OK");

  // --------------- QuadReader --------------------
  // Check Initialize
  expect(await reader.governance()).equals(QUAD_GOV);
  expect(await reader.passport()).equals(QUAD_PASSPORT);
  console.log("[QuadReader] Initializer: OK");

  // --------------- QuadGovernance --------------------
  // Check Passport Correctly linked
  expect(await governance.passport()).equals(QUAD_PASSPORT);
  console.log("[QuadGovernance] QuadPassport correctly linked: OK");

  // Check Treasury correctly set
  const treasury = await governance.treasury();
  expect(treasury.toLowerCase()).equals(QUADRATA_TREASURY.toLowerCase());
  console.log("[QuadGovernance] Protocol treasury correctly set: OK");

  // Check that all issuers have been set
  const issuers = await governance.getIssuers();
  expect(await governance.getIssuersLength()).equals(ISSUERS.length);
  expect(issuers.length).equals(ISSUERS.length);

  ISSUERS.forEach(async (issuer: any) => {
    expect(await governance.issuersTreasury(issuer.wallet)).equals(
      issuer.treasury
    );
    expect(await governance.getIssuerStatus(issuer.wallet)).equals(true);
    ALL_ATTRIBUTES.forEach(async (attrType: string) => {
      if (attrType in issuer.attributesPermission) {
        expect(
          await governance.getIssuerAttributePermission(issuer.wallet, attrType)
        ).equals(true);
      } else {
        expect(
          await governance.getIssuerAttributePermission(issuer.wallet, attrType)
        ).equals(false);
      }
    });
  });
  console.log("[QuadGovernance] All issuers have been correctly set: OK");

  // Check that Revenue split have been correctly set
  expect(await governance.revSplitIssuer()).equals(ISSUER_SPLIT);
  console.log("[QuadGovernance] revSplitIssuer correctly set: OK");

  // Check that Price have been correctly set
  ALL_ATTRIBUTES.forEach(async (attrType: string) => {
    expect(await governance.pricePerAttributeFixed(attrType)).equals(
      PRICE_PER_ATTRIBUTES_ETH[attrType]
    );
    expect(await governance.pricePerBusinessAttributeFixed(attrType)).equals(
      PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attrType]
    );
  });
  console.log("[QuadGovernance] Price for query correctly set: OK");

  // Check that tokenId have been correctly set
  TOKEN_IDS.forEach(async (tokenId: any) => {
    expect(await governance.eligibleTokenId(tokenId.id)).equals(true); // Default Quadrata Passport

    expect(await passport.uri(tokenId)).equals(tokenId.uri);
  });
  expect(
    await governance.eligibleTokenId(TOKEN_IDS[TOKEN_IDS.length - 1].id + 1)
  ).equals(false);
  expect(await governance.getMaxEligibleTokenId()).to.equal(TOKEN_IDS.length);
  console.log("[QuadGovernance] TokenId have been correctly set: OK");

  // Check attribute eligibility
  for (const attribute of ALL_ATTRIBUTES) {
    expect(await governance.eligibleAttributesByDID(attribute)).equals(
      ALL_ATTRIBUTES_BY_DID.includes(attribute)
    );
  }
  console.log(
    "[QuadGovernance] attribute by DID eligibility correctly set: OK"
  );
  for (const attribute of ALL_ATTRIBUTES) {
    expect(await governance.eligibleAttributes(attribute)).equals(
      ALL_ACCOUNT_LEVEL_ATTRIBUTES.includes(attribute)
    );
  }
  console.log("[QuadGovernance] attribute  eligibility correctly set: OK");

  // Check AccessControl
  const checkUserRoles = async (
    expectedUserRoles: any,
    allRoles: any,
    accessControlContract: any
  ) => {
    for (const userRoles of expectedUserRoles) {
      console.log(userRoles);
      for (const role of allRoles) {
        console.log(role);
        expect(
          await accessControlContract.hasRole(role, userRoles.USER)
        ).equals(userRoles.ROLES.includes(role));
      }
    }
  };

  await checkUserRoles(
    EXPECTED_USER_ROLES_PASSPORT,
    ALL_PASSPORT_ROLES,
    governance
  );
  console.log("[QuadGovernance] Access Control verified: OK");
  await checkUserRoles(
    EXPECTED_USER_ROLES_TIMELOCK,
    ALL_TIMELOCK_ROLES,
    timelock
  );
  console.log("[Timelock] Access Control verified: OK");
})();
