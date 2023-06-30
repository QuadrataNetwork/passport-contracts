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
      url: "https://arbitrum-goerli.publicnode.com",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 421613,
    },
    arbitrum: {
      url: "https://arbitrum-one.publicnode.com",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 42161,
    },
    optimism_goerli: {
      url: "https://goerli.optimism.io",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 420,
    },
    optimism: {
      url: "https://mainnet.optimism.io",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 10,
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
    avalanche: {
      url: process.env.AVALANCHE_URI || "",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 43114,
    },
    sepolia: {
      url: "https://rpc2.sepolia.org",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 11155111,
    },
    tevmos: {
      url: "https://eth.bd.evmos.dev:8545",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 9000,
    },
    evmos: {
      url: "https://eth.bd.evmos.org:8545",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 9001,
    },
    kava_testnet: {
      url: "https://evm.testnet.kava.io",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 2221,
    },
    kava: {
      url: "https://evm.kava.io",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 2222,
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
      sepolia: process.env.ETHERSCAN_API_KEY || "",

      // polygon
      polygon: process.env.POLYGON_ETHERSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGON_ETHERSCAN_API_KEY || "",

      // avalanche
      avalancheFujiTestnet: process.env.ETHERSCAN_API_KEY || "",
      avalanche: process.env.AVALANCHE_ETHERSCAN_API_KEY || "",

      // arbitrum
      arbitrumOne: process.env.ARBITRUM_ETHERSCAN_API_KEY || "",
      arbitrumGoerli: process.env.ARBITRUM_ETHERSCAN_API_KEY || "",

      // Optimism
      optimisticEthereum: process.env.OPTIMISM_ETHERSCAN_API_KEY || "",
      optimisticGoerli: process.env.OPTIMISM_ETHERSCAN_API_KEY || "",
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
