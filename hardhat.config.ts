import * as dotenv from "dotenv";

import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

// import "@matterlabs/hardhat-zksync-verify";
// upgradable plugin
import "@matterlabs/hardhat-zksync-upgradable";

require("dotenv").config({ path: require("find-config")(".env") });

const config = {
  zksolc: {
    version: "latest", // Uses latest available in https://github.com/matter-labs/zksolc-bin/
    settings: {},
  },
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
      zksync: false,
    },
    goerli: {
      url: process.env.GOERLI_URI || "",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 5,
      zksync: false,
    },
    celo_testnet: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 44787,
      zksync: false,
    },
    fuji: {
      url: "https://avalanche-fuji.infura.io/v3/f0e0276299f84378863e56b8daf7c4d8",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 43113,
      zksync: false,
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-2-s3.binance.org:8545",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 97,
      zksync: false,
    },
    arbitrum_goerli: {
      url: "https://arbitrum-goerli.publicnode.com",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 421613,
      zksync: false,
    },
    arbitrum: {
      url: "https://arbitrum-one.publicnode.com",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 42161,
      zksync: false,
    },
    optimism_goerli: {
      url: "https://goerli.optimism.io",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 420,
      zksync: false,
    },
    optimism: {
      url: process.env.OPTIMISM_URI || "",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 10,
      zksync: false,
    },
    fantom_testnet: {
      url: "https://rpc.ankr.com/fantom_testnet",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 4002,
      zksync: false,
    },
    mainnet: {
      url: process.env.MAINNET_URI || "",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 1,
      zksync: false,
    },
    polygon: {
      url: process.env.POLYGON_URI || "",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 137,
      zksync: false,
    },
    avalanche: {
      url: process.env.AVALANCHE_URI || "",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 43114,
      zksync: false,
    },
    sepolia: {
      url: "https://rpc2.sepolia.org",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 11155111,
      zksync: false,
    },
    tevmos: {
      url: "https://jsonrpc-t.evmos.nodestake.top",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 9000,
      zksync: false,
    },
    evmos: {
      url: "https://jsonrpc.evmos.nodestake.top",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 9001,
      zksync: false,
    },
    kava_testnet: {
      url: "https://evm.testnet.kava.io",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      chainId: 2221,
      zksync: false,
    },
    kava: {
      url: "https://evm.kava.io",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
      chainId: 2222,
      zksync: false,
    },
    zkSyncTestnet: {
      url: "https://testnet.era.zksync.dev",
      accounts:
        process.env.TESTNET_DEPLOY_KEY !== undefined
          ? [process.env.TESTNET_DEPLOY_KEY]
          : [],
      ethNetwork: "goerli", // or a Goerli RPC endpoint from Infura/Alchemy/Chainstack etc.
      verifyURL:
        "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
      zksync: true,
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

      kava_testnet: "cannot_be_empty",
      kava: "cannot_be_empty",
      zkSyncTestnet: process.env.ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "kava_testnet",
        chainId: 2221,
        urls: {
          apiURL: "https://explorer.testnet.kava.io/api",
          browserURL: "https://explorer.testnet.kava.io",
        },
      },
      {
        network: "kava",
        chainId: 2222,
        urls: {
          apiURL: "https://explorer.kava.io/api",
          browserURL: "https://explorer.kava.io",
        },
      },
    ],
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
