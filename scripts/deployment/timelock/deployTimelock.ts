import { ethers } from "hardhat";

const { MULTISIG } = require("../../data/mainnet.ts");
const { recursiveRetry } = require("../../utils/retries.ts");

const MIN_DELAY = 86400; // 1 day

(async () => {
  if (!MULTISIG) {
    throw new Error("GNOSISSAFE/MULTISIG not set");
  }
  // Retrieve address filter by Network
  const signers: any = await ethers.getSigners();
  const network = await signers[0].provider.getNetwork();
  const multisigPerNetwork = MULTISIG[network.chainId];

  const deployer = signers[0];
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Will grant PROPOSER_ROLE to ${multisigPerNetwork}`);

  const TimelockController = await ethers.getContractFactory(
    "TimelockController"
  );

  const timelock = await recursiveRetry(async () => {
    return await TimelockController.deploy(
      MIN_DELAY,
      [multisigPerNetwork],
      [ethers.constants.AddressZero],
      ethers.constants.AddressZero
    );
  });
  await recursiveRetry(async () => {
    await timelock.deployed();
    console.log(
      `[TimelockController] deployed at address: ${timelock.address}`
    );
  });
})();
