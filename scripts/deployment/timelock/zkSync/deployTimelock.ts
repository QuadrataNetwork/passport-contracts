import { Wallet } from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "hardhat";
import * as hre from "hardhat";

const { MULTISIG } = require("../../../data/mainnet.ts");
const { recursiveRetry } = require("../../../utils/retries.ts");

const MIN_DELAY = 86400; // 1 day

(async () => {
  if (!MULTISIG) {
    throw new Error("GNOSISSAFE/MULTISIG not set");
  }
  // Retrieve address filter by Network
  const signers: any = await ethers.getSigners();
  const network = await signers[0].provider.getNetwork();
  const multisigPerNetwork = MULTISIG[network.chainId];

  // Initialize the wallet.
  // @ts-ignore
  const zkWallet = new Wallet(process.env.MAINNET_PRIVATE_KEY);
  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, zkWallet);

  console.log(`Deployer address: ${zkWallet.address}`);
  console.log(`Will grant PROPOSER_ROLE to ${multisigPerNetwork}`);

  const TimelockController = await deployer.loadArtifact("TimelockController");

  const timelock = await recursiveRetry(async () => {
    return await deployer.deploy(TimelockController, [
      MIN_DELAY,
      [multisigPerNetwork],
      [ethers.constants.AddressZero],
      ethers.constants.AddressZero,
    ]);
  });
  await recursiveRetry(async () => {
    await timelock.deployed();
    console.log(
      `[TimelockController] deployed at address: ${timelock.address}`
    );
  });
})();
