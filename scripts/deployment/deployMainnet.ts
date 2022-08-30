import { ethers } from "hardhat";

const { deployQuadrata } = require("../../utils/deployment.ts");
const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
} = require("../../utils/constant.ts");

const QUADRATA_TREASURY = "0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21";

const TIMELOCK = "0x76694A182dB047067521c73161Ebf3Db5Ca988d3";

const MULTISIG = "0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21";

const TOKEN_IDS = [
  {
    id: 1,
    uri: "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu",
  },
  {
    id: 2,
    uri: "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu",
  },
  {
    id: 3,
    uri: "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu",
  },
];

// Careful - this doesn't work for Contract Deployment today
const MAX_GAS_FEE = ethers.utils.parseUnits("12.001", "gwei");

const ISSUERS: any[] = [
  {
    wallet: "0x38a08d73153F32DBB2f867338d0BD6E3746E3391", // SpringLabs
    treasury: "0x5F3f69808772C56Daee7A5d3176990733C67A123", // SpringLabs Issuer
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
      maxPriorityFeePerGas: MAX_GAS_FEE.sub(1),
      gasPrice: MAX_GAS_FEE,
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
    throw new Error("No Provider");
  }
})();
