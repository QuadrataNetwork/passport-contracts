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
} = require("../data/testnet.ts");

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

  // Retrieve address filter by Network
  const signers: any = await ethers.getSigners();
  const network = await signers[0].provider.getNetwork();
  const treasuryPerNetwork = QUADRATA_TREASURY[network.chainId];
  const multisigPerNetwork = MULTISIG[network.chainId];

  const deployer = signers[0];

  console.log(`Deployer address: ${deployer.address}`);

  const [governance] = await deployQuadrata(
    TIMELOCK,
    ISSUERS,
    treasuryPerNetwork,
    multisigPerNetwork,
    TOKEN_IDS,
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
})();
