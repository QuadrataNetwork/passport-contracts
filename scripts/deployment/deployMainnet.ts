import { ethers } from "hardhat";

const { deployQuadrata } = require("../../utils/deployment.ts");

const QUADRATA_TREASURY = "";

const TIMELOCK = "";

const MULTISIG = "";

const TOKEN_IDS = [
  {
    id: 1,
    uri: "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu",
  },
];

const MAX_GAS_FEE = ethers.utils.parseUnits("4", "gwei");

const ISSUERS: any[] = []; // {wallet: "0x....", treasury: "0x.....", "attributesPermission": ["kecak256("AML")"]}

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

  if (!MAX_GAS_FEE) {
    throw new Error("MAX_GAS_FEE not set");
  }
  console.log(
    `Set maxFeePerGas to ${ethers.utils.formatUnits(MAX_GAS_FEE, "gwei")} Gwei`
  );

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const provider: any = deployer.provider;
  provider.getFeeData = async () => ({
    maxFeePerGas: MAX_GAS_FEE,
    maxPriorityFeePerGas: MAX_GAS_FEE,
  });
  console.log(`Deployer address: ${deployer.address}`);

  await deployQuadrata(
    TIMELOCK,
    ISSUERS,
    QUADRATA_TREASURY,
    MULTISIG,
    TOKEN_IDS,
    deployer,
    true, // Verbose = true,
    MAX_GAS_FEE
  );
})();
