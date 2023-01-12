import { ethers } from "hardhat";

const { deployFlexkit } = require("../../utils/deployment.ts");

(async () => {
  const governanceAddress = '';
  const readerAddress = '';

  const flexkit = await deployFlexkit(governanceAddress, readerAddress);
  console.log(`Flexkit address: ${flexkit.address}`)

})();
