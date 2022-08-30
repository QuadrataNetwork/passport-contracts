import { network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const { expect } = require("chai");
const { constants } = require("ethers");
const { id, hexZeroPad } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

const { COUNTRY_CODES } = require("./countryCodes.ts");

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
} = require("../../utils/constant.ts");

const TIMELOCK = "0x76694A182dB047067521c73161Ebf3Db5Ca988d3";
const MULTISIG = "0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21";
const DEPLOYER = "0xc4f9dfd524dd6b639846e2bd80b2e6f0e2e2c660";

const EXPECTED_TREASURY = "0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21"; // same as MULTISIG today
const EXPECTED_SPRINGLABS_ISSUER = "0x38a08d73153F32DBB2f867338d0BD6E3746E3391";
const EXPECTED_SPRINGLABS_TREASURY =
  "0x5F3f69808772C56Daee7A5d3176990733C67A123";
const EXPECTED_ISSUER_COUNT = "1";
const EXPECTED_REV_SPLIT_ISSUER = "50";

const TEDDY = "0xffE462ed723275eF8E7655C4883e8cD428826669";
const DANIEL = "0x5501CC22Be0F12381489D0980f20f872e1E6bfb9";
const TRAVIS = "0xD71bB1fF98D84ae00728f4A542Fa7A4d3257b33E";

const QUAD_PASSPORT = "0x32791980a332F1283c69660eC8e426de3aD66E7f";
const QUAD_GOV = "0xA16E936425df96b9dA6125B03f19C4d34b315212";
const QUAD_READER = "0x7907bD4Be498cC9a7E2CF1a31dEeFCD8B132bca9";

const EXPECTED_AML_SCORE_TEDDY = hexZeroPad("0x01", 32);
const EXPECTED_COUNTRY_SCORE_TEDDY = id("US");

const EXPECTED_AML_SCORE_DANIEL = hexZeroPad("0x03", 32);
const EXPECTED_AML_SCORE_TRAVIS = hexZeroPad("0x03", 32);

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

const EXPECTED_TOKEN_ID = 1;

const EXPECTED_USER_ROLES_PASSPORT = [
  { USER: TEDDY, ROLES: [] },
  { USER: DANIEL, ROLES: [] },
  { USER: TRAVIS, ROLES: [] },
  { USER: EXPECTED_SPRINGLABS_ISSUER, ROLES: [ISSUER_ROLE] },
  { USER: EXPECTED_TREASURY, ROLES: [PAUSER_ROLE] }, // we expect treasury to be a pauser bc it is our multisig
  { USER: EXPECTED_SPRINGLABS_TREASURY, ROLES: [] },
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
  { USER: EXPECTED_SPRINGLABS_ISSUER, ROLES: [] },
  { USER: EXPECTED_TREASURY, ROLES: [PROPOSER_ROLE] }, // we expect treasury to be a proposer bc it is our multisig
  { USER: EXPECTED_SPRINGLABS_TREASURY, ROLES: [] },
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

  const getCountry = async (
    user: any,
    reader: any,
    isoCodes: any
  ): Promise<string> => {
    const queryFeeCountry = await reader.queryFee(user, ATTRIBUTE_AML);
    const result = await reader.callStatic.getAttributes(
      user,
      ATTRIBUTE_COUNTRY,
      {
        value: queryFeeCountry,
      }
    );
    let userSymbol = "nothing found";
    isoCodes.forEach((code: any) => {
      if (code.HASH === result[0][0]) {
        userSymbol = code.SYMBOL;
        return;
      }
    });

    return userSymbol;
  };

  const getAML = async (user: any, reader: any) => {
    const queryFee = await reader.queryFee(user, ATTRIBUTE_AML);
    const result = await reader.callStatic.getAttributes(user, ATTRIBUTE_AML, {
      value: queryFee,
    });
    return result[0][0];
  };

  const getDID = async (user: any, reader: any) => {
    const queryFee = await reader.queryFee(user, ATTRIBUTE_DID);
    const result = await reader.callStatic.getAttributes(user, ATTRIBUTE_DID, {
      value: queryFee,
    });
    return result[0][0];
  };

  const getIsBusiness = async (user: any, reader: any) => {
    const queryFee = await reader.queryFee(user, ATTRIBUTE_IS_BUSINESS);
    const result = await reader.callStatic.getAttributes(
      user,
      ATTRIBUTE_IS_BUSINESS,
      { value: queryFee }
    );
    return result[0][0];
  };

  const getUserData = async (user: any, reader: any, isoCodes: any) => {
    const country = await getCountry(user, reader, isoCodes);
    const aml = await getAML(user, reader);
    const did = await getDID(user, reader);
    const isBusiness = await getIsBusiness(user, reader);

    return {
      country: country,
      aml: aml,
      did: did,
      isBusiness: isBusiness,
    };
  };

  // USER_1
  console.log("SAMPLING USER 1...");
  expect(
    await getCountry(
      "0x4e95fEdB012831e3207c8167be1690f812f964a5",
      reader,
      COUNTRY_CODES
    )
  ).equals("CH");
  console.log(
    await getUserData(
      "0x4e95fEdB012831e3207c8167be1690f812f964a5",
      reader,
      COUNTRY_CODES
    )
  );

  // USER_2
  console.log("SAMPLING USER 2...");
  expect(
    await getCountry(
      "0xE8c150212ecCE414202D4cC00e86ae24f95037c0",
      reader,
      COUNTRY_CODES
    )
  ).equals("GB");
  console.log(
    await getUserData(
      "0xE8c150212ecCE414202D4cC00e86ae24f95037c0",
      reader,
      COUNTRY_CODES
    )
  );

  expect(await passport.symbol()).equals("QP");
  expect(await passport.name()).equals("Quadrata Passport");
  expect(await passport.governance()).equals(QUAD_GOV);
  expect(await passport.pendingGovernance()).equals(constants.AddressZero);
  console.log("COMPLETE CHECKS ON TOKEN NAME");

  expect(await governance.eligibleTokenId(EXPECTED_TOKEN_ID)).equals(true); // Default Quadrata Passport
  expect(await governance.eligibleTokenId(EXPECTED_TOKEN_ID + 1)).equals(true); // Frigg
  expect(await governance.eligibleTokenId(EXPECTED_TOKEN_ID + 2)).equals(true); // TrueFi
  expect(await governance.eligibleTokenId(EXPECTED_TOKEN_ID + 3)).equals(false);
  console.log("COMPLETE CHECKS ON TOKEN ID");

  console.log("CHECKING ELIGIBLE ATTRIBUTES BY DID...");
  for (const attribute of ALL_ATTRIBUTES) {
    console.log(attribute);
    expect(await governance.eligibleAttributesByDID(attribute)).equals(
      ALL_EXPECTED_ELIGIBLE_ATTRIBUTES_BY_DID.includes(attribute)
    );
  }
  console.log("COMPLETE ATTRIBUTE ELIGIBILITY CHECKS BY DID");

  console.log("CHECKING ELIGIBLE ATTRIBUTES...");
  for (const attribute of ALL_ATTRIBUTES) {
    console.log(attribute);
    expect(await governance.eligibleAttributes(attribute)).equals(
      ALL_EXPECTED_ACCOUNT_LEVEL_ATTRIBUTES.includes(attribute)
    );
  }
  console.log("COMPLETE ATTRIBUTE ELIGIBILITY CHECKS");

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
  await checkUserRoles(
    EXPECTED_USER_ROLES_TIMELOCK,
    ALL_TIMELOCK_ROLES,
    timelock
  );

  console.log("COMPLETE ACCESS ROLE CHECKS");

  const queryFee = await reader.queryFee(TEDDY, ATTRIBUTE_AML);
  const resultTeddyGetAttributesETH = await reader.callStatic.getAttributes(
    TEDDY,
    ATTRIBUTE_AML,
    { value: queryFee }
  );
  expect(resultTeddyGetAttributesETH[0][0]).equals(EXPECTED_AML_SCORE_TEDDY);

  const queryFeeCountry = await reader.queryFee(TEDDY, ATTRIBUTE_AML);
  const resultTeddyGetAttributesETHCountry =
    await reader.callStatic.getAttributes(TEDDY, ATTRIBUTE_COUNTRY, {
      value: queryFeeCountry,
    });
  expect(resultTeddyGetAttributesETHCountry[0][0]).equals(
    EXPECTED_COUNTRY_SCORE_TEDDY
  );

  const resultDanielGetAttributesETH = await reader.callStatic.getAttributes(
    DANIEL,
    ATTRIBUTE_AML,
    { value: queryFee }
  );
  expect(resultDanielGetAttributesETH[0][0]).equals(EXPECTED_AML_SCORE_DANIEL);

  const resultTravisGetAttributesETH = await reader.callStatic.getAttributes(
    TRAVIS,
    ATTRIBUTE_AML,
    { value: queryFee }
  );
  expect(resultTravisGetAttributesETH[0][0]).equals(EXPECTED_AML_SCORE_TRAVIS);

  console.log("COMPLETE LOCAL STATIC CHECKS");

  const treasury = await governance.treasury();
  const issuers = await governance.getIssuers();
  const springLabs = issuers[0].issuer;
  const springLabsTreasury = await governance.issuersTreasury(springLabs);
  const issuerCount = await governance.getIssuersLength();
  const springLabsActivationStatus = await governance.getIssuerStatus(
    springLabs
  );
  const revSplitIssuer = await governance.revSplitIssuer();

  expect(treasury.toLowerCase()).equals(EXPECTED_TREASURY.toLowerCase());
  expect(springLabs.toLowerCase()).equals(
    EXPECTED_SPRINGLABS_ISSUER.toLowerCase()
  );
  expect(springLabsTreasury.toLowerCase()).equals(
    EXPECTED_SPRINGLABS_TREASURY.toLowerCase()
  );
  expect(issuerCount.toString()).equals(EXPECTED_ISSUER_COUNT);
  expect(springLabsActivationStatus.toString()).equals(true);
  expect(revSplitIssuer.toString()).equals(EXPECTED_REV_SPLIT_ISSUER);

  console.log("COMPLETE GOV STORAGE CHECKS");
})();

