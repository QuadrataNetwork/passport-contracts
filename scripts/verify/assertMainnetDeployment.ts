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
  NETWORK_IDS,
  OPERATOR_ROLE,
} = require("../../utils/constant.ts");

const {
  QUADRATA_TREASURY,
  TIMELOCK,
  MULTISIG,
  ISSUERS,
} = require("../data/mainnet.ts");

// ------------ BEGIN - TO MODIFY --------------- //
const QUAD_GOV = getAddress("0xBfa59A31b379A62304327386bC2b03096D7695B3");
const QUAD_PASSPORT = getAddress("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d");
const QUAD_READER = getAddress("0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da");

const DEPLOYER = getAddress("0x33CDAD2fB7eD4F37b2C9B8C3471786d417C0e5BD");

// GnosisSafe multisig
const FAB_MULTISIG = getAddress("0x1f0B49e4871e2f7aaB069d78a8Fa31687b1eA91B");
const HUY_MULTISIG = getAddress("0x8Adbed5dB1Fa983A4Ae2bcaFEa26Aeac5Aee867c");

// Passport Holders
const ETH_HOLDER_1 = getAddress("0xfdfe44e9e9c80a1a5b14cfcd5d9259d294904ee7");
const ETH_HOLDER_2 = getAddress("0x560c9baF6487b9c237afE82213b92287261Be5F8");
const ETH_HOLDER_3 = getAddress("0x99e06477ab269a4e62c62442635FAf43016f234e");

// Customers Contract
const ETH_FRIGG = getAddress("0xBCc3dB2316d8793f84c822953B622Bd292424C68");
const ETH_TRUFIN = getAddress("0x5701773567A4A903eF1DE459D0b542AdB2439937");

const POLYGON_ENSURO = getAddress("0x0CE31c3BB29E33afbf8ae8f0912838C9d657AE12");
const POLYGON_TELLER = getAddress("0x01cB63960553E220C14d8876c4c9689927239DBd");
const POLYGON_TRUFIN = getAddress("0x9EeC6065a3Ffd02eB3d60d2113A876FC723D9BCD");
const POLYGON_TRUFIN_2 = getAddress(
  "0x32226F1Df2EFfFC190c5764219e1d1E9294f4d2b"
);

// Quadrata Operator Only
const OPERATOR_ONLY = getAddress("0x5b88baae69b810df88A53aB5e1400A92d4d2BD28");

// Quadrata Reader Only
const READER_ONLY = getAddress("0x1A01f08Ef4Ee82313FaceF33bCEC1C399f92bF57");

// List of contracts been preapproved
const PREAPPROVED_ADDRESSES = {
  [NETWORK_IDS.MAINNET]: [
    READER_ONLY, // Reader Only
    ETH_FRIGG, // Frigg
    ETH_TRUFIN,
  ],

  [NETWORK_IDS.POLYGON]: [
    READER_ONLY, // Reader Only
    POLYGON_TRUFIN,
    POLYGON_TRUFIN_2,
    POLYGON_TELLER,
    POLYGON_ENSURO,
  ],
};
// ------------ END - TO MODIFY --------------- //

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// MAINNET CHECKS
(async () => {
  const signers = await ethers.getSigners();
  const network = await signers[0].provider.getNetwork();

  const EXPECTED_ROLES_QUAD_GOVERNANCE = [
    // Passport Holders
    { USER: ETH_HOLDER_1, ROLES: [] },
    { USER: ETH_HOLDER_2, ROLES: [] },
    { USER: ETH_HOLDER_3, ROLES: [] },

    // Customer smart contracts
    { USER: ETH_FRIGG, ROLES: [] },
    { USER: ETH_TRUFIN, ROLES: [] },
    { USER: POLYGON_TELLER, ROLES: [] },
    { USER: POLYGON_ENSURO, ROLES: [] },
    { USER: POLYGON_TRUFIN, ROLES: [] },

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

    // Customer smart contracts
    { USER: ETH_FRIGG, ROLES: [] },
    { USER: ETH_TRUFIN, ROLES: [] },
    { USER: POLYGON_TELLER, ROLES: [] },
    { USER: POLYGON_ENSURO, ROLES: [] },
    { USER: POLYGON_TRUFIN, ROLES: [] },

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
  console.log("Starting Deployment Verification on Mainnet/Polygon ..");
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
  });
  console.log("[QuadGovernance] All issuers have been correctly set: OK");

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
  console.log("[QuadGovernance] attribute ligibility correctly set: OK");

  // Check Preapproved addresses
  for (const customerContractAddr of PREAPPROVED_ADDRESSES[network.chainId]) {
    expect(await governance.preapproval(customerContractAddr)).equals(true);
  }
  expect(await governance.preapproval(ETH_HOLDER_1)).equals(false);
  expect(await governance.preapproval(ETH_HOLDER_2)).equals(false);

  // Check QueryFee
  expect(await reader.queryFee(ETH_HOLDER_1, ATTRIBUTE_AML)).equals(0);
  expect(
    await reader.queryFeeBulk(ETH_HOLDER_2, [ATTRIBUTE_AML, ATTRIBUTE_DID])
  ).equals(0);

  // Check AccessControl (Roles)
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
