import * as dotenv from "dotenv";

import { existsSync } from "fs";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";

import "./tasks.ts";

dotenv.config();

let localConf;
if (existsSync("./local_rpc.json")) {
  const importedRpc = require("./local_rpc.json");
  localConf = importedRpc;
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

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
    local: {
      url: localConf.rpc,
      chainId: localConf.chainId,
      accounts: [
        "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
        "0xbb96b9527686f2ca62c92428e5c7592987b9a6244b48a0e25bd096ec4caea048", // AVAX Subnet Admin (0xaF15d1B05fF8C105F68E5d6F39E8e6010593F9e6)
        "0x7b4198529994b0dc604278c99d153cfd069d594753d471171a1d102a10438e07",
        "0x15614556be13730e9e8d6eacc1603143e7b96987429df8726384c2ec4502ef6e",
        "0x31b571bf6894a248831ff937bb49f7754509fe93bbd2517c9c73c4144c0e97dc",
        "0x6934bef917e01692b789da754a0eae31a8536eb465e7bff752ea291dad88c675",
        "0xe700bdbdbc279b808b1ec45f8c2370e4616d3a02c336e68d85d4668e08f53cff",
        "0xbbc2865b76ba28016bc2255c7504d000e046ae01934b04c694592a6276988630",
        "0xcdbfd34f687ced8c6968854f8a99ae47712c4f4183b78dcc4a903d1bfe8cbf60",
        "0x86f78c5416151fe3546dece84fda4b4b1e36089f2dbc48496faf3a950f16157c",
        "0x750839e9dbbd2a0910efe40f50b2f3b2f2f59f5580bb4b83bd8c1201cf9a010a",
        "0xf600bdbdbc279b808b1ec45f8c2370e4616d3a02c336e68d85d4668e08f53cff",
        "0xabc2865b76ba28016bc2255c7504d000e046ae01934b04c694592a6276988630",
        "0xadbfd34f687ced8c6968854f8a99ae47712c4f4183b78dcc4a903d1bfe8cbf60",
        "0x76f78c5416151fe3546dece84fda4b4b1e36089f2dbc48496faf3a950f16157c",
        "0x650839e9dbbd2a0910efe40f50b2f3b2f2f59f5580bb4b83bd8c1201cf9a010a",
      ],
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
