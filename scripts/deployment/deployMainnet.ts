import { ethers } from "hardhat";

const {
  deployPassport,
  deployGovernance,
  deployReader,
} = require("../../utils/deployment.ts");

(async () => {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  console.log(`Deployer address: ${deployer.address}`);
  const governance = await deployGovernance(deployer);
  console.log(`QuadGovernance is deployed: ${governance.address}`);
  const passport = await deployPassport(governance);
  console.log(`QuadPassport is deployed: ${passport.address}`);
  const reader = await deployReader(governance, passport);
  console.log("QuadReader is deployed: ", reader.address);
})();
