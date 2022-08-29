import { ethers } from "hardhat";

const { deployQuadrata } = require("../../utils/deployment.ts");
const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
} = require("../../utils/constant.ts");

const QUADRATA_TREASURY = "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1";

const TIMELOCK = "0x484ea071fB248B63Cbf4bf10BeAf01D6e65Ba4CD"; // Goerli

const MULTISIG = "0x8c3026C6f065dEcE3E7F641F4daC8f57BF9C4BE1"; // Goerli

const TOKEN_IDS = [
  {
    id: 1,
    uri: "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu",
  },
];

const MAX_GAS_FEE = ethers.utils.parseUnits("4", "gwei");

const ISSUERS = [
  {
    wallet: "0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38", // SpringLabs L/E issuers
    treasury: "0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38",
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: "0x8859c986F102924DBeC3767b67497b8d89Be2463", // SpringLabs L/E issuers

    treasury: "0x8859c986F102924DBeC3767b67497b8d89Be2463",
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: "0x3097988FD29cD00f2C27B2b964F99Ac974d30A41", // SpringLabs L/E issuers

    treasury: "0x3097988FD29cD00f2C27B2b964F99Ac974d30A41",
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: "0x4c7E4C698f7D955981912FdDBA84cBFE84101d1E", // SpringLabs L/E issuers

    treasury: "0x4c7E4C698f7D955981912FdDBA84cBFE84101d1E",
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: "0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431", // SpringLabs L/E issuers

    treasury: "0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431",
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: "0xAB5f37eA10Bd98228CDd5cD59605241DfE811701", // SpringLabs Prod testnet
    treasury: "0xe5eF9Ce921f90086d55f0E8f541EF7892796268A",
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: "0x19c6525E6927554e311Cd83491d34623fF04605a", // Quadrata Sandbox
    treasury: "0x19c6525E6927554e311Cd83491d34623fF04605a",
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },

  {
    wallet: "0x175DB8512CF71c3848F2bB90E5021Fc60A877ADf", // Quadrata Sandbox 2
    treasury: "0x175DB8512CF71c3848F2bB90E5021Fc60A877ADf",
    attributesPermission: [
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ],
  },
];

(async () => {
  if (!QUADRATA_TREASURY) {
    throw new Error("QUADRATA_TREASURY not set");
  }
  if (ISSUERS.length === 0) {
    throw new Error("ISSUERS not set");
  }

  if (!TIMELOCK) {
    throw new Error("TIMELOCK not set");
  }

  if (!MULTISIG) {
    throw new Error("MULTISIG not set");
  }

  if (TOKEN_IDS.length === 0) {
    throw new Error("TOKEN_IDS not set");
  }
  if (!MAX_GAS_FEE) {
    throw new Error("MAX_GAS_FEE not set");
  }
  console.log(
    `Set maxFeePerGas to ${ethers.utils.formatUnits(MAX_GAS_FEE, "gwei")} Gwei`
  );

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  if (deployer && deployer.provider) {
    deployer.provider.getFeeData = async () => ({
      maxFeePerGas: MAX_GAS_FEE,
      maxPriorityFeePerGas: MAX_GAS_FEE,
    });
    console.log(`Deployer address: ${deployer.address}`);

    await deployQuadrata(
      TIMELOCK,
      ISSUERS,
      QUADRATA_TREASURY,
      MULTISIG,
      TOKEN_IDS,
      deployer,
      true, // Verbose = true,
      MAX_GAS_FEE
    );
  } else {
    throw Error("deployer or provider not set");
  }
})();
