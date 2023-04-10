import { Contract } from "ethers";
const { ethers, upgrades } = require("hardhat");

import { recursiveRetry } from "../scripts/utils/retries";

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_AML,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_CRED_PROTOCOL_SCORE,
  READER_ROLE,
  GOVERNANCE_ROLE,
  DEFAULT_ADMIN_ROLE,
  PAUSER_ROLE,
} = require("./constant.ts");

export const deployQuadrata = async (
  timelock: string,
  issuers: any[],
  treasury: string,
  multisig: string,
  tokenIds: any[],
  verbose: boolean = false,
  maxFeePerGas: any = ethers.utils.parseUnits("3", "gwei"),
  governanceAddress: string = "",
  passportAddress: string = "",
  readerAddress: string = "",
  useGovTestMock: boolean = false
) => {
  // Deploy QuadGovernance
  const governance = await recursiveRetry(async () => {
    return await deployGovernance(governanceAddress, useGovTestMock);
  });
  if (verbose) console.log(`QuadGovernance is deployed: ${governance.address}`);
  // Deploy QuadPassport
  const passport = await recursiveRetry(async () => {
    return await deployPassport(governance, passportAddress);
  });
  if (verbose) console.log(`QuadPassport is deployed: ${passport.address}`);
  // Deploy QuadReader
  const reader = await recursiveRetry(async () => {
    return await deployReader(governance, passport, readerAddress);
  });
  if (verbose) console.log("QuadReader is deployed: ", reader.address);

  // Set Protocol Treasury
  await recursiveRetry(async () => {
    const tx = await governance.setTreasury(treasury, { maxFeePerGas });
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
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] setEligibleAttribute for ATTRIBUTE_DID`);
  });

  await recursiveRetry(async () => {
    const tx = await governance.setEligibleAttribute(ATTRIBUTE_COUNTRY, true, {
      maxFeePerGas,
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
    });
    await tx.wait();
    if (verbose)
      console.log(
        `[QuadGovernance] setEligibleAttributeByDID for ATTRIBUTE_AML`
      );
  });

  // Add all Issuers & their respective treasury
  for (let i = 0; i < issuers.length; i++) {
    await recursiveRetry(async () => {
      const tx = await governance.addIssuer(
        issuers[i].wallet,
        issuers[i].treasury,
        { maxFeePerGas }
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
          { maxFeePerGas }
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
    const tx = await governance.setRevSplitIssuer(50, { maxFeePerGas });
    await tx.wait();
    if (verbose) console.log(`[QuadGovernance] setRevSplitIssuer with 50`);
  });

  // Set QuadReader as READER_ROLE
  await recursiveRetry(async () => {
    const tx = await governance.grantRole(READER_ROLE, reader.address, {
      maxFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] grant READER_ROLE to ${reader.address}`);
  });

  // Grant `GOVERNANCE_ROLE` and `DEFAULT_ADMIN_ROLE` to Timelock
  await recursiveRetry(async () => {
    const tx = await governance.grantRole(GOVERNANCE_ROLE, timelock, {
      maxFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] grant GOVERNANCE_ROLE to ${timelock}`);
  });
  await recursiveRetry(async () => {
    const tx = await governance.grantRole(DEFAULT_ADMIN_ROLE, timelock, {
      maxFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] grant DEFAULT_ADMIN_ROLE to ${timelock}`);
  });

  // GRANT `PAUSER_ROLE` to MULTISIG
  await recursiveRetry(async () => {
    const tx = await governance.grantRole(PAUSER_ROLE, multisig, {
      maxFeePerGas,
    });
    await tx.wait();
    if (verbose)
      console.log(`[QuadGovernance] grant PAUSER_ROLE to ${multisig}`);
  });

  return [governance, passport, reader];
};

export const deployPassport = async (
  governance: Contract,
  passportAddress: string = ""
): Promise<Contract> => {
  if (passportAddress !== "") {
    return await ethers.getContractAt("QuadPassport", passportAddress);
  }
  const QuadPassport = await ethers.getContractFactory("QuadPassport");
  const passport = await recursiveRetry(async () => {
    return await upgrades.deployProxy(QuadPassport, [governance.address], {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor"],
    });
  });
  await recursiveRetry(async () => {
    await passport.deployed();
  });
  return passport;
};

export const deployGovernance = async (
  governanceAddress: string = "",
  useGovTestMock: boolean = false
): Promise<Contract> => {
  if (governanceAddress !== "") {
    return await ethers.getContractAt("QuadGovernance", governanceAddress);
  }
  const contractName = useGovTestMock
    ? "QuadGovernanceTestnet"
    : "QuadGovernance";
  const QuadGovernance = await ethers.getContractFactory(contractName);
  const governance = await recursiveRetry(async () => {
    return await upgrades.deployProxy(QuadGovernance, [], {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor"],
    });
  });
  await recursiveRetry(async () => {
    await governance.deployed();
  });
  return governance;
};

export const deployReader = async (
  governance: Contract,
  passport: Contract,
  readerAddress: string = ""
): Promise<Contract> => {
  if (readerAddress !== "") {
    return await ethers.getContractAt("QuadReader", readerAddress);
  }
  const QuadReader = await ethers.getContractFactory("QuadReader");
  const reader = await recursiveRetry(async () => {
    return await upgrades.deployProxy(
      QuadReader,
      [governance.address, passport.address],
      { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor"] }
    );
  });
  await recursiveRetry(async () => {
    await reader.deployed();
  });
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
