import * as dotenv from "dotenv";
import { getAddress } from "ethers/lib/utils";
dotenv.config();

const { expect } = require("chai");
const { constants } = require("ethers");
const { ethers } = require("hardhat");

const {
  // reversePrint,
  ATTRIBUTE_AML,
  ATTRIBUTE_DID,
  ALL_ATTRIBUTES,
  ALL_ACCOUNT_LEVEL_ATTRIBUTES,
  ALL_ATTRIBUTES_BY_DID,
  ALL_ROLES,
  GOVERNANCE_ROLE,
  PAUSER_ROLE,
  ISSUER_ROLE,
  DEFAULT_ADMIN_ROLE,
  READER_ROLE,
  TIMELOCK_ADMIN_ROLE,
  PROPOSER_ROLE,
  EXECUTOR_ROLE,
  ISSUER_SPLIT,
  OPERATOR_ROLE,
} = require("../../utils/constant.ts");

const {
  QUADRATA_TREASURY,
  TIMELOCK,
  MULTISIG,
  ISSUERS,
  OPERATOR,
  READER_ONLY,

  QUAD_GOVERNANCE,
  QUAD_PASSPORT,
  QUAD_READER,
} = require("../data/dev_testnet.ts");

// Multisig accounts
const FAB_MULTISIG = getAddress("0x4A0BF9Dcb73636A75b325d33E8700A1945523CE7");
const HUY_MULTISIG = getAddress("0x303c6d0c96887650B2B1101aCb6b04ad4abC826D");
const DEPLOYER = getAddress("0x1F5A2c30A77D9B8613204E8f0244a98572679692");

// ------------ BEGIN - TO MODIFY --------------- //
// Passport Holders
const ETH_HOLDER_1 = getAddress("0xBe7903A33682ACe2d77bbC0FDEb80c58B5b42C0F");
const ETH_HOLDER_2 = getAddress("0xbC1e5DDC2e9576C06A6DAd271E740d56BC737e1c");
const ETH_HOLDER_3 = getAddress("0x78BC18fD141da03083ACBea9fab384B6FA50C9DB");
// ------------ END - TO MODIFY --------------- //

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GOERLI CHECKS
(async () => {
  const signers = await ethers.getSigners();
  const network = await signers[0].provider.getNetwork();
  const governanceAddress = QUAD_GOVERNANCE[network.chainId];
  const passportAddress = QUAD_PASSPORT[network.chainId];
  const readerAddress = QUAD_READER[network.chainId];

  const EXPECTED_ROLES_QUAD_GOVERNANCE = [
    // Passport Holders
    { USER: ETH_HOLDER_1, ROLES: [] },
    { USER: ETH_HOLDER_2, ROLES: [] },
    { USER: ETH_HOLDER_3, ROLES: [] },

    // MULTISIG Operators
    { USER: FAB_MULTISIG, ROLES: [] },
    { USER: HUY_MULTISIG, ROLES: [] },

    { USER: ISSUERS[0].wallet, ROLES: [ISSUER_ROLE] },
    // { USER: ISSUERS[0].treasury, ROLES: [] },
    { USER: QUADRATA_TREASURY[network.chainId], ROLES: [PAUSER_ROLE] }, // we expect treasury to be a pauser bc it is our multisig

    // Deployer
    { USER: DEPLOYER, ROLES: [] },

    // timelock contract
    {
      USER: TIMELOCK[network.chainId],
      ROLES: [DEFAULT_ADMIN_ROLE, GOVERNANCE_ROLE],
    },
    { USER: MULTISIG[network.chainId], ROLES: [PAUSER_ROLE] },

    // Quadrata contracts
    { USER: readerAddress, ROLES: [READER_ROLE] },
    { USER: governanceAddress, ROLES: [] },
    { USER: passportAddress, ROLES: [] },

    // Quadrata specific users
    { USER: READER_ONLY, ROLES: [READER_ROLE] },
    { USER: OPERATOR, ROLES: [OPERATOR_ROLE] },
  ];

  const EXPECTED_ROLES_TIMELOCK = [
    // Passport holders
    { USER: ETH_HOLDER_1, ROLES: [] },
    { USER: ETH_HOLDER_2, ROLES: [] },
    { USER: ETH_HOLDER_3, ROLES: [] },

    // Multisig operators
    { USER: FAB_MULTISIG, ROLES: [EXECUTOR_ROLE] },
    { USER: HUY_MULTISIG, ROLES: [EXECUTOR_ROLE] },

    { USER: ISSUERS[0].wallet, ROLES: [] },
    // { USER: ISSUERS[0].treasury, ROLES: [] },
    { USER: QUADRATA_TREASURY[network.chainId], ROLES: [PROPOSER_ROLE] }, // we expect treasury to be a proposer bc it is our multisig

    { USER: DEPLOYER, ROLES: [] },
    { USER: TIMELOCK[network.chainId], ROLES: [TIMELOCK_ADMIN_ROLE] },
    { USER: MULTISIG[network.chainId], ROLES: [PROPOSER_ROLE] },

    // Quadrata contracts
    { USER: readerAddress, ROLES: [] },
    { USER: governanceAddress, ROLES: [] },
    { USER: passportAddress, ROLES: [] },

    // Quadrata specific users
    { USER: READER_ONLY, ROLES: [] },
    { USER: OPERATOR, ROLES: [] },
  ];

  console.log("!!!!! Make sure you have updated all contract addresses !!!!!!");
  console.log("Starting Deployment Verification ..");
  const passport = await ethers.getContractAt("QuadPassport", passportAddress);
  const governance = await ethers.getContractAt(
    "QuadGovernance",
    governanceAddress
  );
  const reader = await ethers.getContractAt("QuadReader", readerAddress);
  const timelock = await ethers.getContractAt(
    "IAccessControlUpgradeable",
    TIMELOCK[network.chainId]
  );

  // --------------- QuadPassport --------------------
  // Check Initialize
  expect(await passport.symbol()).equals("QP");
  expect(await passport.name()).equals("Quadrata Passport");
  expect(await passport.governance()).equals(governanceAddress);
  expect(await passport.pendingGovernance()).equals(constants.AddressZero);
  console.log("[QuadPassport] Initializer: OK");

  // --------------- QuadReader --------------------
  // Check Initialize
  expect(await reader.governance()).equals(governanceAddress);
  expect(await reader.passport()).equals(passportAddress);
  console.log("[QuadReader] Initializer: OK");

  // --------------- QuadGovernance --------------------
  // Check Passport Correctly linked
  expect(await governance.passport()).equals(passportAddress);
  console.log("[QuadGovernance] QuadPassport correctly linked: OK");

  // Check Treasury correctly set
  const treasury = await governance.treasury();
  expect(treasury.toLowerCase()).equals(
    QUADRATA_TREASURY[network.chainId].toLowerCase()
  );
  console.log("[QuadGovernance] Protocol treasury correctly set: OK");

  // Check that all issuers have been set
  const issuers = await governance.getIssuers();
  expect(await governance.getIssuersLength()).equals(ISSUERS.length);
  expect(issuers.length).equals(ISSUERS.length);

  ISSUERS.forEach(async (issuer: any) => {
    await delay(1000);
    // expect(await governance.issuersTreasury(issuer.wallet)).equals(
    //   issuer.treasury
    // );
    expect(await governance.getIssuerStatus(issuer.wallet)).equals(true);
    ALL_ATTRIBUTES.forEach(async (attrType: string) => {
      await delay(1000);
      if (issuer.attributesPermission.includes(attrType)) {
        expect(
          await governance.getIssuerAttributePermission(issuer.wallet, attrType)
        ).equals(true);
      } else {
        expect(
          await governance.getIssuerAttributePermission(issuer.wallet, attrType)
        ).equals(false);
      }
    });
    console.log(
      `[QuadGovernance] Issuer (${issuer.wallet}) have been correctly set: OK`
    );
  });

  // Check that Revenue split have been correctly set
  expect(await governance.revSplitIssuer()).equals(ISSUER_SPLIT);
  console.log("[QuadGovernance] revSplitIssuer correctly set: OK");

  // Check attribute eligibility
  for (const attribute of ALL_ATTRIBUTES) {
    await delay(1000);
    expect(await governance.eligibleAttributesByDID(attribute)).equals(
      ALL_ATTRIBUTES_BY_DID.includes(attribute)
    );
  }
  console.log(
    "[QuadGovernance] attribute by DID eligibility correctly set: OK"
  );
  for (const attribute of ALL_ATTRIBUTES) {
    await delay(1000);
    expect(await governance.eligibleAttributes(attribute)).equals(
      ALL_ACCOUNT_LEVEL_ATTRIBUTES.includes(attribute)
    );
  }
  console.log("[QuadGovernance] attribute eligibility correctly set: OK");

  // Check Preapproved addresses
  for (const customerContractAddr of [
    ETH_HOLDER_1,
    FAB_MULTISIG,
    READER_ONLY,
    OPERATOR,
    DEPLOYER,
  ]) {
    expect(await governance.preapproval(customerContractAddr)).equals(true);
  }

  // Check QueryFee
  expect(await reader.queryFee(ETH_HOLDER_1, ATTRIBUTE_AML)).equals(0);
  expect(
    await reader.queryFeeBulk(ETH_HOLDER_2, [ATTRIBUTE_AML, ATTRIBUTE_DID])
  ).equals(0);

  // Check AccessControl
  const checkUserRoles = async (accountRoles: any, contract: any) => {
    accountRoles.forEach(async (accRole: any) => {
      const account = accRole.USER;
      const expectedRoles = accRole.ROLES;
      ALL_ROLES.forEach(async (role: string) => {
        await delay(1000);
        // console.log(`Checking Role ${reversePrint[role]} for User ${account}`);
        expect(await contract.hasRole(role, account)).equals(
          expectedRoles.includes(role)
        );
      });
      await delay(1000);
    });
  };

  await checkUserRoles(EXPECTED_ROLES_QUAD_GOVERNANCE, governance);
  console.log("[QuadGovernance] Access Control verified: OK");
  await checkUserRoles(EXPECTED_ROLES_TIMELOCK, timelock);
  console.log("[Timelock] Access Control verified: OK");
})();
