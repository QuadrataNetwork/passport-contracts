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
    avax_testnet: {
      url: "https://ava-testnet.public.blastapi.io/ext/bc/C/rpc",
      accounts:
        process.env.TESTNET_PRIVATE_KEY_2 !== undefined
          ? [process.env.TESTNET_PRIVATE_KEY_2]
          : [],
      chainId: 43113,
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-2-s3.binance.org:8545",
      accounts:
        process.env.TESTNET_PRIVATE_KEY !== undefined
          ? [process.env.TESTNET_PRIVATE_KEY]
          : [],
      chainId: 97,
    },
    arbitrum_goerli: {
      url: "https://arb-goerli.g.alchemy.com/v2/demo",
      accounts:
        process.env.TESTNET_PRIVATE_KEY !== undefined
          ? [process.env.TESTNET_PRIVATE_KEY]
          : [],
      chainId: 421613,
    },
    optimism_goerli: {
      url: "https://opt-goerli.g.alchemy.com/v2/demo",
      accounts:
        process.env.TESTNET_PRIVATE_KEY !== undefined
          ? [process.env.TESTNET_PRIVATE_KEY]
          : [],
      chainId: 420,
    },
    fantom_testnet: {
      url: "https://rpc.ankr.com/fantom_testnet",
      accounts:
        process.env.TESTNET_PRIVATE_KEY !== undefined
          ? [process.env.TESTNET_PRIVATE_KEY]
          : [],
      chainId: 4002,
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
        console.log("Error Adding Issuer");
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

    const promises = [];

    for (const issuerAddress of issuerAddresses) {

      const addIssuerRetry = async () => {
        try {
          await governance.addIssuer(issuerAddress, issuerAddress);
          console.log("added " + issuerAddress)
        } catch (e) {
          console.log("failed to add" + issuerAddress);
          console.log("retrying in 5ish seconds");
          let wait = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));
          await wait(4000 + Math.random() * 2000);
          await addIssuerRetry();
        }
      }

      promises.push(addIssuerRetry());
    }

    await Promise.all(promises);

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

  /*

  // usage for getting all issuers for all testnets
  (copy and paste all of the following into terminal)

  npx hardhat getIssuers --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network goerli
  npx hardhat getIssuers --governance 0xC1fcC7790291FF3D9DC378bfA16047eC3002a83a --network avax_testnet
  npx hardhat getIssuers --governance 0xCF6bA3a3d18bA1e35A41db79B3dBF2F6023F6071 --network bsc_testnet
  npx hardhat getIssuers --governance 0x2B212B47Faf2040cA4782e812048F5aE8ad5Fa2f --network celo_testnet
  npx hardhat getIssuers --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network arbitrum_goerli
  npx hardhat getIssuers --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network optimism_goerli
  npx hardhat getIssuers --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network fantom_testnet

  */

  /*

  // usage for adding all issuers for all testnets
  (copy and paste all of the following into terminal)

  npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network goerli &&
  npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0xC1fcC7790291FF3D9DC378bfA16047eC3002a83a --network avax_testnet &&
  npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0xCF6bA3a3d18bA1e35A41db79B3dBF2F6023F6071 --network bsc_testnet &&
  npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0x2B212B47Faf2040cA4782e812048F5aE8ad5Fa2f --network celo_testnet &&
  npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network arbitrum_goerli &&
  npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network optimism_goerli &&
  npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network fantom_testnet

  */