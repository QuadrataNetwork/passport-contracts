import * as dotenv from "dotenv";
import { getAddress } from "ethers/lib/utils";
dotenv.config();

const { expect } = require("chai");
const { constants } = require("ethers");
const { ethers } = require("hardhat");

const {
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
  // reversePrint,
} = require("../../utils/constant.ts");

const {
  QUADRATA_TREASURY,
  TIMELOCK,
  MULTISIG,
  ISSUERS,
} = require("../data/testnet.ts");

// ------------ BEGIN - TO MODIFY --------------- //
// AWS DEV ENVIRONMENT
const QUAD_GOV = getAddress("0x0ec036A8801578B11413a9b3Aa2Be32078c93731"); // Goerli / Mumbai Testnet Address
const QUAD_PASSPORT = getAddress("0x50602dd387511Dc85695f66bFE0A192D4c4BA7fC"); // Goerli / Mumbai Testnet Address
const QUAD_READER = getAddress("0x4503f347595862Fa120D964D5F8c9DFBdc6B2731"); // Goerli / Mumbai Testnet Address

const DEPLOYER = getAddress("0x1F5A2c30A77D9B8613204E8f0244a98572679692");

// GnosisSafe multisig
const FAB_MULTISIG = getAddress("0x1f0B49e4871e2f7aaB069d78a8Fa31687b1eA91B");
const HUY_MULTISIG = getAddress("0x8Adbed5dB1Fa983A4Ae2bcaFEa26Aeac5Aee867c");

// Passport Holders
const ETH_HOLDER_1 = getAddress("0x1BF3Ed394b904D53Db85FDdF931132f22c430829");
const ETH_HOLDER_2 = getAddress("0x3e49fEe0402ed32F80DF4A72E13B705C2E007DEa");
const ETH_HOLDER_3 = getAddress("0x93979d24056f3dC64FB3802BdFCF03bdc232632a");

// Quadrata Operator Only
const OPERATOR_ONLY = getAddress("0x0C19DFd4Edc2545b456AdFF3f4948929a06a206C");

// Quadrata Reader Only
const READER_ONLY = getAddress("0xA88948CA8912c1D3C5639f1694adbc1907F9A931");
// ------------ END - TO MODIFY --------------- //

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GOERLI CHECKS
(async () => {
  const signers = await ethers.getSigners();
  const network = await signers[0].provider.getNetwork();

  const EXPECTED_ROLES_QUAD_GOVERNANCE = [
    // Passport Holders
    { USER: ETH_HOLDER_1, ROLES: [] },
    { USER: ETH_HOLDER_2, ROLES: [] },
    { USER: ETH_HOLDER_3, ROLES: [] },

    // Multisig operators
    { USER: HUY_MULTISIG, ROLES: [] },
    { USER: FAB_MULTISIG, ROLES: [] },

    // Issuers
    { USER: ISSUERS[0].wallet, ROLES: [ISSUER_ROLE] },
    { USER: ISSUERS[0].treasury, ROLES: [] },
    { USER: QUADRATA_TREASURY[network.chainId], ROLES: [PAUSER_ROLE] }, // we expect treasury to be a pauser bc it is our multisig
    { USER: ISSUERS[0].treasury, ROLES: [] },

    // Deployer
    { USER: DEPLOYER, ROLES: [] },

    // Timelock Contract
    {
      USER: TIMELOCK[network.chainId],
      ROLES: [DEFAULT_ADMIN_ROLE, GOVERNANCE_ROLE],
    },

    // GnosisSafe
    { USER: MULTISIG[network.chainId], ROLES: [PAUSER_ROLE] },

    // Quadrata Contracts
    { USER: QUAD_READER, ROLES: [READER_ROLE] },
    { USER: QUAD_GOV, ROLES: [] },
    { USER: QUAD_PASSPORT, ROLES: [] },

    // Quadrata specific users
    { USER: READER_ONLY, ROLE: [READER_ROLE] },
    { USER: OPERATOR_ONLY, ROLE: [OPERATOR_ROLE] },
  ];

  const EXPECTED_ROLES_TIMELOCK = [
    { USER: ETH_HOLDER_1, ROLES: [] },
    { USER: ETH_HOLDER_2, ROLES: [] },
    { USER: ETH_HOLDER_3, ROLES: [] },

    // Multisig operators
    { USER: HUY_MULTISIG, ROLES: [EXECUTOR_ROLE] },
    { USER: FAB_MULTISIG, ROLES: [EXECUTOR_ROLE] },

    // Issuer
    { USER: ISSUERS[0].wallet, ROLES: [] },
    { USER: ISSUERS[0].treasury, ROLES: [] },
    {
      USER: QUADRATA_TREASURY[network.chainId],
      ROLES: [PROPOSER_ROLE, EXECUTOR_ROLE],
    }, // we expect treasury to be a proposer bc it is our multisig

    { USER: DEPLOYER, ROLES: [] },
    { USER: TIMELOCK[network.chainId], ROLES: [TIMELOCK_ADMIN_ROLE] },
    { USER: MULTISIG[network.chainId], ROLES: [PROPOSER_ROLE, EXECUTOR_ROLE] },

    // Quadrata Contracts
    { USER: QUAD_READER, ROLES: [] },
    { USER: QUAD_GOV, ROLES: [] },
    { USER: QUAD_PASSPORT, ROLES: [] },

    // Quadrata specific users
    { USER: READER_ONLY, ROLE: [] },
    { USER: OPERATOR_ONLY, ROLE: [] },
  ];

  console.log("!!!!! Make sure you have updated all contract addresses !!!!!!");
  console.log("Starting Deployment Verification ..");
  const passport = await ethers.getContractAt("QuadPassport", QUAD_PASSPORT);
  const governance = await ethers.getContractAt("QuadGovernance", QUAD_GOV);
  const reader = await ethers.getContractAt("QuadReader", QUAD_READER);
  const timelock = await ethers.getContractAt(
    "IAccessControlUpgradeable",
    TIMELOCK[network.chainId]
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
    expect(await governance.issuersTreasury(issuer.wallet)).equals(
      issuer.treasury
    );
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

  // // Check that Price have been correctly set
  // ALL_ATTRIBUTES.forEach(async (attrType: string) => {
  //   await delay(1000);
  //   expect(await governance.pricePerAttributeFixed(attrType)).equals(
  //     PRICE_PER_ATTRIBUTES[network.chainId][attrType]
  //   );
  //   expect(await governance.pricePerBusinessAttributeFixed(attrType)).equals(
  //     PRICE_PER_BUSINESS_ATTRIBUTES[network.chainId][attrType]
  //   );
  // });
  // console.log("[QuadGovernance] Price for query correctly set: OK");

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
  console.log("[QuadGovernance] attributeeligibility correctly set: OK");

  // Check Preapproved addresses
  // All addresses are preApproved on testnet
  expect(await governance.preapproval(ETH_HOLDER_1)).equals(true);
  expect(await governance.preapproval(ETH_HOLDER_2)).equals(true);

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
        // console.log(
        //   `Checking Role ${
        //     reversePrint[role]
        //   } for User ${account} with expected roles ${
        //     reversePrint[expectedRoles[0]]
        //   }`
        // );
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
