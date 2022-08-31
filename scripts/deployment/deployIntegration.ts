import { ethers } from "hardhat";

const { deployQuadrata } = require("../../utils/deployment.ts");

const {
  GOVERNANCE_ROLE,
  DEFAULT_ADMIN_ROLE,
} = require("../../utils/constant.ts");

const {
  QUADRATA_TREASURY,
  TIMELOCK,
  MULTISIG,
  TOKEN_IDS,
  ISSUERS,
  MAX_GAS_FEE,
} = require("../data/integration.ts");

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
  if (deployer && deployer.provider) {
    deployer.provider.getFeeData = async () => ({
      maxFeePerGas: MAX_GAS_FEE,
      maxPriorityFeePerGas: MAX_GAS_FEE.sub(1),
      gasPrice: MAX_GAS_FEE,
    });

    console.log(`Deployer address: ${deployer.address}`);

    const [governance] = await deployQuadrata(
      TIMELOCK,
      ISSUERS,
      QUADRATA_TREASURY,
      MULTISIG,
      TOKEN_IDS,
      deployer,
      true, // Verbose = true,
      MAX_GAS_FEE
    );

    let tx = await governance
      .connect(deployer)
      .renounceRole(GOVERNANCE_ROLE, deployer.address);
    await tx.wait();
    console.log(`[QuadGovernance] deployer renounce GOVERNANCE_ROLE`);
    tx = await governance
      .connect(deployer)
      .renounceRole(DEFAULT_ADMIN_ROLE, deployer.address);
    await tx.wait();
    console.log(`[QuadGovernance] deployer renounce DEFAULT_ADMIN_ROLE`);
  } else {
    throw new Error("No Provider");
  }
})();
