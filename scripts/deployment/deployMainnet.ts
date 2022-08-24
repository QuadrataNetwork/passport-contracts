import { ethers } from "hardhat";

const { deployQuadrata } = require("../../utils/deployment.ts");

const QUADRATA_TREASURY = "";

const TIMELOCK = "";

const MULTISIG = "";

const TOKEN_IDS = [1, 2, 3];

const ISSUERS: any[] = []; // {wallet: "0x....", treasury: "0x....."}

(async () => {
  if (!QUADRATA_TREASURY) {
    throw new Error("QUADRATA_TREASURY not set");
  }
  if (ISSUERS.length === 0) {
    throw new Error("ISSUERS not set");
  }

  if (!TIMELOCK) {
    throw new Error("TIMELOCK not set");
  }

  if (!MULTISIG) {
    throw new Error("MULTISIG not set");
  }

  if (TOKEN_IDS.length === 0) {
    throw new Error("TOKEN_IDS not set");
  }
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  console.log(`Deployer address: ${deployer.address}`);

  await deployQuadrata(
    TIMELOCK,
    ISSUERS,
    QUADRATA_TREASURY,
    MULTISIG,
    TOKEN_IDS,
    true // Verbose = true
  );
})();
