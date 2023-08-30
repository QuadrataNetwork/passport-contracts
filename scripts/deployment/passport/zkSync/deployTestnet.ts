import { ethers } from "hardhat";
const { recursiveRetry } = require("../../..//utils/retries.ts");
const { deployQuadrata } = require("../../../../utils/deployment.ts");

const {
  GOVERNANCE_ROLE,
  DEFAULT_ADMIN_ROLE,
} = require("../../../../utils/constant.ts");

const {
  QUADRATA_TREASURY,
  ISSUERS,
  TIMELOCK,
  MULTISIG,
  MAX_GAS_FEE,
  OPERATOR,
  READER_ONLY,
} = require("../../../data/int_testnet.ts");
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

  if (!OPERATOR) {
    throw new Error("OPERATOR not set");
  }

  if (!READER_ONLY) {
    throw new Error("READER_ONLY not set");
  }

  if (!MULTISIG) {
    throw new Error("MULTISIG not set");
  }

  if (!MAX_GAS_FEE) {
    throw new Error("MAX_GAS_FEE not set");
  }

  // Retrieve address filter by Network
  const signers: any = await ethers.getSigners();
  const network = await signers[0].provider.getNetwork();
  const treasuryPerNetwork = QUADRATA_TREASURY[network.chainId];
  const multisigPerNetwork = MULTISIG[network.chainId];
  const maxGasPerNetwork = MAX_GAS_FEE[network.chainId];
  const timelockPerNetwork = TIMELOCK[network.chainId];

  if (maxGasPerNetwork) {
    console.log(
      `Set maxFeePerGas to ${ethers.utils.formatUnits(
        maxGasPerNetwork,
        "gwei"
      )} Gwei`
    );
  }

  const deployer = signers[0];
  console.log(`Deployer address: ${deployer.address}`);

  const opts = {
    verbose: true,
    useGovTestMock: true,
    maxFeePerGas: maxGasPerNetwork,
    zkSync: false,
  };

  const [governance] = await deployQuadrata(
    timelockPerNetwork,
    ISSUERS,
    treasuryPerNetwork,
    multisigPerNetwork,
    OPERATOR,
    READER_ONLY,
    opts
  );

  await recursiveRetry(async () => {
    const tx = await governance
      .connect(deployer)
      .renounceRole(GOVERNANCE_ROLE, deployer.address);
    await tx.wait();
    console.log(`[QuadGovernance] deployer renounce GOVERNANCE_ROLE`);
  });

  await recursiveRetry(async () => {
    const tx = await governance
      .connect(deployer)
      .renounceRole(DEFAULT_ADMIN_ROLE, deployer.address);
    await tx.wait();
    console.log(`[QuadGovernance] deployer renounce DEFAULT_ADMIN_ROLE`);
  });
})();
