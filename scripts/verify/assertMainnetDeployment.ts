import { network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const { expect } = require("chai");
const { constants } = require("ethers");
const { ethers } = require("hardhat");

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
  GOVERNANCE_ROLE,
  PAUSER_ROLE,
  ISSUER_ROLE,
  DEFAULT_ADMIN_ROLE,
  READER_ROLE,
  PRICE_PER_ATTRIBUTES_ETH,
  PRICE_PER_BUSINESS_ATTRIBUTES_ETH,
} = require("../../utils/constant.ts");

const TIMELOCK = "0x76694A182dB047067521c73161Ebf3Db5Ca988d3";
const MULTISIG = "0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21";
const DEPLOYER = "0xc4f9dfd524dd6b639846e2bd80b2e6f0e2e2c660";

const EXPECTED_TOKEN_IDS = [
  {
    id: 1,
    uri: "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu",
  },
  {
    id: 2,
    uri: "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu",
  },
  {
    id: 3,
    uri: "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu",
  },
];

const EXPECTED_ISSUERS: any[] = [
  {
    wallet: "0x38a08d73153F32DBB2f867338d0BD6E3746E3391", // SpringLabs
    treasury: "0x5F3f69808772C56Daee7A5d3176990733C67A123", // SpringLabs Issuer
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },
];

const EXPECTED_TREASURY = "0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21"; // same as MULTISIG today
const EXPECTED_REV_SPLIT_ISSUER = "50";

const TEDDY = "0xffE462ed723275eF8E7655C4883e8cD428826669";
const DANIEL = "0x5501CC22Be0F12381489D0980f20f872e1E6bfb9";
const TRAVIS = "0xD71bB1fF98D84ae00728f4A542Fa7A4d3257b33E";

const QUAD_PASSPORT = "0x32791980a332F1283c69660eC8e426de3aD66E7f";
const QUAD_GOV = "0xA16E936425df96b9dA6125B03f19C4d34b315212";
const QUAD_READER = "0x7907bD4Be498cC9a7E2CF1a31dEeFCD8B132bca9";

const TIMELOCK_ADMIN_ROLE =
  "0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5";
const PROPOSER_ROLE =
  "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1";
const EXECUTOR_ROLE =
  "0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63";

const ALL_PASSPORT_ROLES = [
  GOVERNANCE_ROLE,
  PAUSER_ROLE,
  ISSUER_ROLE,
  DEFAULT_ADMIN_ROLE,
  READER_ROLE,
];

const ALL_TIMELOCK_ROLES = [
  TIMELOCK_ADMIN_ROLE,
  PROPOSER_ROLE,
  EXECUTOR_ROLE,
  DEFAULT_ADMIN_ROLE,
];

const ALL_ATTRIBUTES = [
  ATTRIBUTE_AML,
  ATTRIBUTE_DID,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
];
const ALL_EXPECTED_ACCOUNT_LEVEL_ATTRIBUTES = [
  ATTRIBUTE_DID,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
];
const ALL_EXPECTED_ELIGIBLE_ATTRIBUTES_BY_DID = [ATTRIBUTE_AML];

const EXPECTED_USER_ROLES_PASSPORT = [
  { USER: TEDDY, ROLES: [] },
  { USER: DANIEL, ROLES: [] },
  { USER: TRAVIS, ROLES: [] },
  { USER: EXPECTED_ISSUERS[0].wallet, ROLES: [ISSUER_ROLE] },
  { USER: EXPECTED_TREASURY, ROLES: [PAUSER_ROLE] }, // we expect treasury to be a pauser bc it is our multisig
  { USER: EXPECTED_ISSUERS[0].treasury, ROLES: [] },
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
  { USER: EXPECTED_ISSUERS[0].wallet, ROLES: [] },
  { USER: EXPECTED_TREASURY, ROLES: [PROPOSER_ROLE] }, // we expect treasury to be a proposer bc it is our multisig
  { USER: EXPECTED_ISSUERS[0].treasury, ROLES: [] },
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
  expect(treasury.toLowerCase()).equals(EXPECTED_TREASURY.toLowerCase());
  console.log("[QuadGovernance] Protocol treasury correctly set: OK");

  // Check that all issuers have been set
  const issuers = await governance.getIssuers();
  expect(await governance.getIssuersLength()).equals(EXPECTED_ISSUERS.length);
  expect(issuers.length).equals(EXPECTED_ISSUERS.length);

  EXPECTED_ISSUERS.forEach(async (issuer) => {
    expect(await governance.issuersTreasury(issuer.wallet)).equals(
      issuer.treasury
    );
    expect(await governance.getIssuerStatus(issuer.wallet)).equals(true);
    ALL_ATTRIBUTES.forEach(async (attrType) => {
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
  expect(await governance.revSplitIssuer()).equals(EXPECTED_REV_SPLIT_ISSUER);
  console.log("[QuadGovernance] revSplitIssuer correctly set: OK");

  // Check that Price have been correctly set
  ALL_ATTRIBUTES.forEach(async (attrType) => {
    expect(await governance.pricePerAttributeFixed(attrType)).equals(
      PRICE_PER_ATTRIBUTES_ETH[attrType]
    );
    expect(await governance.pricePerBusinessAttributeFixed(attrType)).equals(
      PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attrType]
    );
  });
  console.log("[QuadGovernance] Price for query correctly set: OK");

  // Check that tokenId have been correctly set
  EXPECTED_TOKEN_IDS.forEach(async (tokenId) => {
    expect(await governance.eligibleTokenId(tokenId.id)).equals(true); // Default Quadrata Passport

    expect(await passport.uri(tokenId)).equals(tokenId.uri);
  });
  expect(
    await governance.eligibleTokenId(
      EXPECTED_TOKEN_IDS[EXPECTED_TOKEN_IDS.length - 1].id + 1
    )
  ).equals(false);
  expect(await governance.getMaxEligibleTokenId()).to.equal(
    EXPECTED_TOKEN_IDS.length
  );
  console.log("[QuadGovernance] TokenId have been correctly set: OK");

  // Check attribute eligibility
  for (const attribute of ALL_ATTRIBUTES) {
    expect(await governance.eligibleAttributesByDID(attribute)).equals(
      ALL_EXPECTED_ELIGIBLE_ATTRIBUTES_BY_DID.includes(attribute)
    );
  }
  console.log(
    "[QuadGovernance] attribute by DID eligibility correctly set: OK"
  );
  for (const attribute of ALL_ATTRIBUTES) {
    expect(await governance.eligibleAttributes(attribute)).equals(
      ALL_EXPECTED_ACCOUNT_LEVEL_ATTRIBUTES.includes(attribute)
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
