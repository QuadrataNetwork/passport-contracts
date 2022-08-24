const { ethers } = require("hardhat");

const { deployQuadrata } = require("../../utils/deployment.ts");

const QUADRATA_TREASURY = "";

const TIMELOCK = "";

const MULTISIG = "";

const TOKEN_IDS = [1, 2, 3];

const ISSUERS = [
  {
    wallet: "0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38", // SpringLabs L/E issuers
    treasury: "0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38",
  },

  {
    wallet: "0x8859c986F102924DBeC3767b67497b8d89Be2463", // SpringLabs L/E issuers

    treasury: "0x8859c986F102924DBeC3767b67497b8d89Be2463",
  },

  {
    wallet: "0x3097988FD29cD00f2C27B2b964F99Ac974d30A41", // SpringLabs L/E issuers

    treasury: "0x3097988FD29cD00f2C27B2b964F99Ac974d30A41",
  },

  {
    wallet: "0x4c7E4C698f7D955981912FdDBA84cBFE84101d1E", // SpringLabs L/E issuers

    treasury: "0x4c7E4C698f7D955981912FdDBA84cBFE84101d1E",
  },

  {
    wallet: "0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431", // SpringLabs L/E issuers

    treasury: "0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431",
  },

  {
    wallet: "0xAB5f37eA10Bd98228CDd5cD59605241DfE811701", // SpringLabs Prod testnet
    treasury: "0xe5eF9Ce921f90086d55f0E8f541EF7892796268A",
  },

  {
    wallet: "0x19c6525E6927554e311Cd83491d34623fF04605a", // Quadrata Sandbox
    treasury: "0x19c6525E6927554e311Cd83491d34623fF04605a",
  },
];

(async () => {
  if (QUADRATA_TREASURY === "") {
    throw new Error("QUADRATA_TREASURY not set");
  }
  if (ISSUERS.length === 0) {
    throw new Error("ISSUERS not set");
  }

  if (TIMELOCK === "") {
    throw new Error("TIMELOCK not set");
  }

  if (MULTISIG === "") {
    throw new Error("MULTISIG not set");
  }

  if (TOKEN_IDS.length === 0) {
    throw new Error("TOKEN_IDS not set");
  }
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  console.log(`Deployer address: ${deployer.address}`);

  await deployQuadrata(
    TIMELOCK,
    ISSUERS,
    QUADRATA_TREASURY,
    MULTISIG,
    TOKEN_IDS,
    true // Verbose = true
  );
})();
