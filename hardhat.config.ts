import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";

require('dotenv').config({ path: require('find-config')('.env') })

const config = {
  solidity: {
    compilers: [
      {
        version: "0.8.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  networks: {
    mumbai: {
      url: process.env.MUMBAI_URI || "",
      accounts:
        process.env.MUMBAI_PRIVATE_KEY !== undefined
          ? [process.env.MUMBAI_PRIVATE_KEY]
          : [],
      chainId: 80001,
    },
    goerli: {
      url: process.env.GOERLI_URI || "",
      accounts:
        process.env.GOERLI_PRIVATE_KEY !== undefined
          ? [process.env.GOERLI_PRIVATE_KEY]
          : [],
      chainId: 5,
    },
    mainnet: {
      url: process.env.MAINNET_URI || "",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 1,
    },
    polygon: {
      url: process.env.POLYGON_URI || "",
      accounts:
        process.env.POLYGON_PRIVATE_KEY !== undefined
          ? [process.env.POLYGON_PRIVATE_KEY]
          : [],
      chainId: 137,
    },
  },
  gasReporter: {
    enabled: true,
  },
  etherscan: {
    apiKey: {
      // ethereum
      mainnet: process.env.ETHERSCAN_API_KEY || "",

      goerli: process.env.ETHERSCAN_API_KEY || "",
      rinkeby: process.env.ETHERSCAN_API_KEY || "",

      // polygon
      polygon: process.env.POLYGON_ETHERSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGON_ETHERSCAN_API_KEY || "",
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
    // should overloads with full signatures like deposit(uint256) be generated always,
    // even if there are no overloads?
    alwaysGenerateOverloads: false,
  },
};

export default config;


task("deployFEUtils", "Example: npx hardhat deployFEUtils --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --passport 0xF4d4F629eDD73680767eb7b509C7C2D1fE551522 --network goerli")
  .addParam("governance", "Governance Address")
  .addParam("passport", "Passport Address")
  .setAction(async function (taskArgs, hre) {
    const { deployFEUtils } = require("./utils/deployment");

    const ethers = hre.ethers;

    const governanceAddress = taskArgs.governance;
    const passportAddress = taskArgs.passport;

    const governance = await ethers.getContractAt("QuadGovernance", governanceAddress);
    const passport = await ethers.getContractAt("QuadPassport", passportAddress);

    const feUtils = await deployFEUtils(governance, passport);

    console.log("FE Utils Deployed At:")
    console.log(feUtils.address)
  });
