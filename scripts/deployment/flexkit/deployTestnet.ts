import { ethers } from "hardhat";

const { deployFlexkit } = require("../../../utils/deployment.ts");

(async () => {
  // Integration Mumbai/Goerli Addresses
  const governanceAddress = '0x863db2c1A43441bbAB7f34740d0d62e21e678A4b';
  const readerAddress = '0x5C6b81212c0A654B6e247F8DEfeC9a95c63EF954';

  const flexkit = await deployFlexkit(governanceAddress, readerAddress);
  console.log(`Flexkit address: ${flexkit.address}`)
})();
