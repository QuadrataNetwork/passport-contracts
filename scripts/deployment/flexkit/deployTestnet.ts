import { ethers } from "hardhat";

const { deployQuadrata } = require("../../utils/deployment.ts");

// const {
//   GOVERNANCE_ROLE,
//   DEFAULT_ADMIN_ROLE,
// } = require("../../utils/constant.ts");

// const {
//   QUADRATA_TREASURY,
//   TIMELOCK,
//   MULTISIG,
//   TOKEN_IDS,
//   ISSUERS,
//   MAX_GAS_FEE,
// } = require("../data/testnet.ts");

(async () => {
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

})();
