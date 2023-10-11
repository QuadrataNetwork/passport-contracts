import { Contract } from "ethers";
import { recursiveRetry } from "../scripts/utils/retries";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallet } from "zksync-web3";
const { ethers, upgrades } = require("hardhat");

import * as hre from "hardhat";

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_AML,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_CRED_PROTOCOL_SCORE,

  ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
  ATTRIBUTE_INVESTOR_STATUS,
  READER_ROLE,
  GOVERNANCE_ROLE,
  OPERATOR_ROLE,
  DEFAULT_ADMIN_ROLE,
  PAUSER_ROLE,
  TOKEN_ID_1_URI,
} = require("./constant.ts");

export const deployQuadrata = async (
  timelock: string,
  issuers: any[],
  treasury: string,
  multisig: string,
  operator: string,
  readerOnly: string,
  opts: any = {}
) => {
  // opts
  const verbose: boolean = opts.verbose || false;
  const maxFeePerGas: any = opts.maxFeePerGas || undefined;
  const maxPriorityFeePerGas: any = opts.maxPriorityFeePerGas || undefined;
  const governanceAddress: string = opts.governanceAddress || "";
  const passportAddress: string = opts.passportAddress || "";
  const readerAddress: string = opts.readerAddress || "";
  const useGovTestMock: boolean = opts.useGovTestMock || false;
  const zkSync: boolean = opts.zkSync || false;
  const mainnet: boolean = opts.mainnet || false;

  // Deploy QuadGovernance
  const governance = await recursiveRetry(async () => {
    return await deployGovernance(
      governanceAddress,
      useGovTestMock,
      zkSync,
      mainnet
    );
  });
  if (verbose) console.log(`QuadGovernance is deployed: ${governance.address}`);
  // Deploy QuadPassport
  const passport = await recursiveRetry(async () => {
    return await deployPassport(governance, passportAddress, zkSync, mainnet);
  });
  if (verbose) console.log(`QuadPassport is deployed: ${passport.address}`);

  // Deploy QuadReader
  const reader = await recursiveRetry(async () => {
    return await deployReader(
      governance,
      passport,
      readerAddress,
      zkSync,
      mainnet
    );
  });
  if (verbose) console.log("QuadReader is deployed: ", reader.address);

  // Set Protocol Treasury
  await recursiveRetry(async () => {
    const tx = await governance.setTreasury(treasury, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(
        `[QuadGovernance] Protocol Treasury has been set to ${treasury}`
      );
  });

  // Link Governance & Passport contracts
  await recursiveRetry(async () => {
    const tx = await governance.setPassportContractAddress(passport.address, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(
        `[QuadGovernance] setPassportContractAddress with ${passport.address}`
      );
  });

  // Set Eligible Attributes
  await recursiveRetry(async () => {
    const tx = await governance.setEligibleAttribute(ATTRIBUTE_DID, true, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] setEligibleAttribute for ATTRIBUTE_DID`);
  });
  await recursiveRetry(async () => {
    const tx = await governance.setEligibleAttribute(
      ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
      true,
      {
        maxFeePerGas,
        maxPriorityFeePerGas,
      }
    );
    await tx.wait();
    if (verbose)
      console.log(
        `[QuadGovernance] setEligibleAttribute for ATTRIBUTE_TRANSUNION_CREDIT_SCORE`
      );
  });

  await recursiveRetry(async () => {
    const tx = await governance.setEligibleAttribute(ATTRIBUTE_COUNTRY, true, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(
        `[QuadGovernance] setEligibleAttribute for ATTRIBUTE_COUNTRY`
      );
  });
  await recursiveRetry(async () => {
    const tx = await governance.setEligibleAttribute(
      ATTRIBUTE_IS_BUSINESS,
      true,
      {
        maxFeePerGas,
        maxPriorityFeePerGas,
      }
    );
    await tx.wait();
    if (verbose)
      console.log(
        `[QuadGovernance] setEligibleAttribute for ATTRIBUTE_IS_BUSINESS`
      );
  });
  await recursiveRetry(async () => {
    const tx = await governance.setEligibleAttribute(
      ATTRIBUTE_CRED_PROTOCOL_SCORE,
      true,
      {
        maxFeePerGas,
        maxPriorityFeePerGas,
      }
    );
    await tx.wait();
    if (verbose)
      console.log(
        `[QuadGovernance] setEligibleAttribute for ATTRIBUTE_CRED_PROTOCOL_SCORE`
      );
  });

  // Set Eligible Attributes by DID
  await recursiveRetry(async () => {
    const tx = await governance.setEligibleAttributeByDID(ATTRIBUTE_AML, true, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(
        `[QuadGovernance] setEligibleAttributeByDID for ATTRIBUTE_AML`
      );
  });

  await recursiveRetry(async () => {
    const tx = await governance.setEligibleAttributeByDID(
      ATTRIBUTE_INVESTOR_STATUS,
      true,
      {
        maxFeePerGas,
        maxPriorityFeePerGas,
      }
    );
    await tx.wait();
    if (verbose)
      console.log(
        `[QuadGovernance] setEligibleAttributeByDID for ATTRIBUTE_INVESTOR_STATUS`
      );
  });

  // Add all Issuers & their respective treasury
  for (let i = 0; i < issuers.length; i++) {
    await recursiveRetry(async () => {
      const tx = await governance.addIssuer(
        issuers[i].wallet,
        issuers[i].treasury,
        { maxFeePerGas, maxPriorityFeePerGas }
      );
      await tx.wait();
      if (verbose)
        console.log(
          `[QuadGovernance] addIssuer ${issuers[i].wallet} with treasury ${issuers[i].treasury}`
        );
    });

    for (let j = 0; j < issuers[i].attributesPermission.length; j++) {
      await recursiveRetry(async () => {
        const tx = await governance.setIssuerAttributePermission(
          issuers[i].wallet,
          issuers[i].attributesPermission[j],
          true,
          { maxFeePerGas, maxPriorityFeePerGas }
        );
        await tx.wait();

        if (verbose)
          console.log(
            `[QuadGovernance] setIssuerAttributePermission ${issuers[i].wallet} for attribute ${issuers[i].attributesPermission[j]}`
          );
      });
    }
  }

  // Set Rev Split
  await recursiveRetry(async () => {
    const tx = await governance.setRevSplitIssuer(50, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose) console.log(`[QuadGovernance] setRevSplitIssuer with 50`);
  });

  // Set QuadReader as READER_ROLE
  await recursiveRetry(async () => {
    const tx = await governance.grantRole(READER_ROLE, reader.address, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] grant READER_ROLE to ${reader.address}`);
  });

  // Set ReaderOnly as READER_ROLE
  await recursiveRetry(async () => {
    const tx = await governance.grantRole(READER_ROLE, readerOnly, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] grant READER_ROLE to ${readerOnly}`);
  });
  // PreApproved ReaderOnly
  await recursiveRetry(async () => {
    const tx = await governance.setPreapprovals([readerOnly], [true], {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose) console.log(`[QuadGovernance] preApproved ${readerOnly}`);
  });

  // Set default tokenID(1) metadata
  await recursiveRetry(async () => {
    const tx = await governance.setTokenURI(1, TOKEN_ID_1_URI, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose) console.log("[QuadGovernance] setTokenURI to tokenID(1)");
  });

  // Grant `GOVERNANCE_ROLE` and `DEFAULT_ADMIN_ROLE` to Timelock
  await recursiveRetry(async () => {
    const tx = await governance.grantRole(GOVERNANCE_ROLE, timelock, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] grant GOVERNANCE_ROLE to ${timelock}`);
  });

  await recursiveRetry(async () => {
    const tx = await governance.grantRole(DEFAULT_ADMIN_ROLE, timelock, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] grant DEFAULT_ADMIN_ROLE to ${timelock}`);
  });

  // Grant `OPERATOR_ROLE` to OPERATOR
  await recursiveRetry(async () => {
    const tx = await governance.grantRole(OPERATOR_ROLE, operator, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] grant OPERATOR_ROLE to ${operator}`);
  });

  // GRANT `PAUSER_ROLE` to MULTISIG
  await recursiveRetry(async () => {
    const tx = await governance.grantRole(PAUSER_ROLE, multisig, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] grant PAUSER_ROLE to ${multisig}`);
  });

  return [governance, passport, reader];
};

export const deployPassport = async (
  governance: Contract,
  passportAddress: string = "",
  zkSync: boolean = false,
  mainnet: boolean = false
): Promise<Contract> => {
  if (passportAddress !== "") {
    return await ethers.getContractAt("QuadPassport", passportAddress);
  }
  let passport: Contract;

  if (zkSync) {
    // @ts-ignore
    const zkWallet = mainnet
      ? new Wallet(process.env.MAINNET_PRIVATE_KEY)
      : new Wallet(process.env.mainnet_DEPLOY_KEY);
    const deployer = new Deployer(hre, zkWallet);
    const QuadPassport = await deployer.loadArtifact("QuadPassport");
    passport = await recursiveRetry(async () => {
      return await hre.zkUpgrades.deployProxy(
        deployer.zkWallet,
        QuadPassport,
        [governance.address],
        {
          initializer: "initialize",
          kind: "uups",
          unsafeAllow: ["constructor"],
        }
      );
    });
  } else {
    const QuadPassport = await ethers.getContractFactory("QuadPassport");
    passport = await recursiveRetry(async () => {
      return await upgrades.deployProxy(QuadPassport, [governance.address], {
        initializer: "initialize",
        kind: "uups",
        unsafeAllow: ["constructor"],
      });
    });
    await recursiveRetry(async () => {
      await passport.deployed();
    });
  }

  return passport;
};

export const deployGovernance = async (
  governanceAddress: string = "",
  useGovTestMock: boolean = false,
  zkSync: boolean = false,
  mainnet: boolean = false
): Promise<Contract> => {
  if (governanceAddress !== "") {
    return await ethers.getContractAt("QuadGovernance", governanceAddress);
  }
  let governance: Contract;
  const contractName = useGovTestMock
    ? "QuadGovernancemainnet"
    : "QuadGovernance";

  if (zkSync) {
    // @ts-ignore
    const zkWallet = mainnet
      ? new Wallet(process.env.MAINNET_PRIVATE_KEY)
      : new Wallet(process.env.mainnet_DEPLOY_KEY);
    const deployer = new Deployer(hre, zkWallet);

    const QuadGovernance = await deployer.loadArtifact(contractName);
    governance = await recursiveRetry(async () => {
      return await hre.zkUpgrades.deployProxy(
        deployer.zkWallet,
        QuadGovernance,
        [],
        {
          initializer: "initialize",
          kind: "uups",
          unsafeAllow: ["constructor"],
        }
      );
    });
  } else {
    const QuadGovernance = await ethers.getContractFactory(contractName);
    governance = await recursiveRetry(async () => {
      return await upgrades.deployProxy(QuadGovernance, [], {
        initializer: "initialize",
        kind: "uups",
        unsafeAllow: ["constructor"],
      });
    });
  }
  await recursiveRetry(async () => {
    await governance.deployed();
  });
  return governance;
};

export const deployReader = async (
  governance: Contract,
  passport: Contract,
  readerAddress: string = "",
  zkSync: boolean = false,
  mainnet: boolean = false
): Promise<Contract> => {
  if (readerAddress !== "") {
    return await ethers.getContractAt("QuadReader", readerAddress);
  }
  let reader: Contract;
  if (zkSync) {
    // @ts-ignore
    const zkWallet = mainnet
      ? new Wallet(process.env.MAINNET_PRIVATE_KEY)
      : new Wallet(process.env.mainnet_DEPLOY_KEY);
    const deployer = new Deployer(hre, zkWallet);

    const QuadReader = await deployer.loadArtifact("QuadReader");
    reader = await recursiveRetry(async () => {
      return await hre.zkUpgrades.deployProxy(
        deployer.zkWallet,
        QuadReader,
        [governance.address, passport.address],
        {
          initializer: "initialize",
          kind: "uups",
          unsafeAllow: ["constructor"],
        }
      );
    });
  } else {
    const QuadReader = await ethers.getContractFactory("QuadReader");
    reader = await recursiveRetry(async () => {
      return await upgrades.deployProxy(
        QuadReader,
        [governance.address, passport.address],
        {
          initializer: "initialize",
          kind: "uups",
          unsafeAllow: ["constructor"],
        }
      );
    });
    await recursiveRetry(async () => {
      await reader.deployed();
    });
  }
  return reader;
};

export const deployFlexkit = async (
  governanceAddress: string = "",
  readerAddress: string = ""
): Promise<Contract> => {
  const QuadFlexkit = await ethers.getContractFactory("QuadFlexKit");
  const flexkit = await upgrades.deployProxy(
    QuadFlexkit,
    [governanceAddress, readerAddress],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor"] }
  );
  await flexkit.deployed();
  return flexkit;
};
