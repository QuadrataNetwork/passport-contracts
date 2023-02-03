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
import { run } from "hardhat";

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
        process.env.TESTNET_PRIVATE_KEY_2 !== undefined
          ? [process.env.TESTNET_PRIVATE_KEY_2]
          : [],
      chainId: 5,
    },
    celo_testnet: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts:
        process.env.TESTNET_PRIVATE_KEY_2 !== undefined
          ? [process.env.TESTNET_PRIVATE_KEY_2]
          : [],
      chainId: 44787,
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

task("addIssuer", "Example: npx hardhat addIssuer --issuer 0x696969696943441bbAB7f34740d0d62e21e678A4b --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network goerli")
  .addParam("issuer", "Issuer Address")
  .addParam("governance", "Governance Address")
  .setAction(async function (taskArgs, hre) {
    const ethers = hre.ethers;

    const issuerAddress = taskArgs.issuer;
    const governanceAddress = taskArgs.governance;

    const governance = await ethers.getContractAt("QuadGovernance", governanceAddress);

    const addIssuerRetry = async () => {
      try {
        await governance.addIssuer(issuerAddress, issuerAddress);
        console.log("Issuer Added");
      } catch (e) {
        console.log(e);
        console.log("retrying in 5ish seconds");
        setTimeout(addIssuerRetry, 4000 + Math.random() * 2000);
      }
    }

    await addIssuerRetry();
  });

task("addIssuers", "Example: npx hardhat addIssuers --issuers 0x696969696943441bbAB7f34740d0d62e21e678A4b,0x696969696943441bbAB7f34740d0d62e21e678A4b --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network goerli")
  .addParam("issuers", "Issuer Addresses")
  .addParam("governance", "Governance Address")
  .setAction(async function (taskArgs, hre) {
    const ethers = hre.ethers;

    const issuerAddresses = taskArgs.issuers.split(",");
    const governanceAddress = taskArgs.governance;

    const governance = await ethers.getContractAt("QuadGovernance", governanceAddress);

    for (const issuerAddress of issuerAddresses) {
      const addIssuerRetry = async () => {
        try {
          await governance.addIssuer(issuerAddress, issuerAddress);
          console.log("added " + issuerAddress)
        } catch (e) {
          console.log("failed to add" + e);
          console.log("retrying in 5ish seconds");
          setTimeout(addIssuerRetry, 4000 + Math.random() * 2000);
        }
      }
      await addIssuerRetry();
    }

  });

task("getIssuers", "Example: npx hardhat getIssuers --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network goerli")
  .addParam("governance", "Governance Address")
  .setAction(async function (taskArgs, hre) {
    const ethers = hre.ethers;

    const governanceAddress = taskArgs.governance;

    const governance = await ethers.getContractAt("QuadGovernance", governanceAddress);

    const issuers = await governance.getIssuers();

    console.log(issuers);
  });