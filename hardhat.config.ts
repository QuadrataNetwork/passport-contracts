import * as dotenv from "dotenv";

import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
require("dotenv").config({ path: require("find-config")(".env") });

const config = {
  solidity: {
    compilers: [
      {
        version: "0.8.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
    ],
  },
  networks: {
    mumbai: {
      url: process.env.MUMBAI_URI || "",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 80001,
    },
    goerli: {
      url: process.env.GOERLI_URI || "",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 5,
    },
    celo_testnet: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 44787,
    },
    fuji: {
      url: "https://avalanche-fuji.infura.io/v3/f0e0276299f84378863e56b8daf7c4d8",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 43113,
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-2-s3.binance.org:8545",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 97,
    },
    arbitrum_goerli: {
      url: "https://endpoints.omniatech.io/v1/arbitrum/goerli/public",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 421613,
    },
    optimism_goerli: {
      url: "https://goerli.optimism.io",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 420,
    },
    fantom_testnet: {
      url: "https://rpc.ankr.com/fantom_testnet",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
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
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
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

      avalancheFujiTestnet: process.env.ETHERSCAN_API_KEY || "",
      avalanche: process.env.ETHERSCAN_API_KEY || "",
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
