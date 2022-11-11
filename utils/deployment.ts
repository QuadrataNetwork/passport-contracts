import { Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
const { ethers, upgrades } = require("hardhat");

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_AML,
  ATTRIBUTE_IS_BUSINESS,
  PRICE_PER_ATTRIBUTES,
  PRICE_PER_BUSINESS_ATTRIBUTES,
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
  readerAddress: string = ""
) => {
  const signers: any = await ethers.getSigners();
  const network = await signers[0].provider.getNetwork();
  //const governance = await deployGovernance(governanceAddress);
  const governance = await ethers.getContractAt("QuadGovernance", "0xCF6bA3a3d18bA1e35A41db79B3dBF2F6023F6071")
  if (verbose) console.log(`QuadGovernance is deployed: ${governance.address}`);
  //const passport = await deployPassport(governance, passportAddress);
  const passport = await ethers.getContractAt("QuadPassport", "0x1950814a8fB4a69Eb4f77A28f22FAfBfb9a4a6CA")
  if (verbose) console.log(`QuadPassport is deployed: ${passport.address}`);
  //const reader = await deployReader(governance, passport, readerAddress);
  const reader = await ethers.getContractAt("QuadReader", "0x890D01d52A8C31b285f1534F9A146C5C06B375eE");
  if (verbose) console.log("QuadReader is deployed: ", reader.address);

  // Set Protocol Treasury
  //await governance.setTreasury(treasury);
  //if (verbose)
  //  console.log(
  //    `[QuadGovernance] Protocol Treasury has been set to ${treasury}`
  //  );

  // Link Governance & Passport contracts
  //await governance.setPassportContractAddress(passport.address);
  //if (verbose)
  //  console.log(
  //    `[QuadGovernance] setPassportContractAddress with ${passport.address}`
  //  );

  //await governance.setEligibleTokenId(
  //  tokenIds[2].id,
  //  true,
  //  tokenIds[2].uri,
  //);
  //  console.log(
  //    tokenIds.length
  //  );


  // Set Eligible Attributes
  //await governance.setEligibleAttribute(ATTRIBUTE_DID, true);
  //if (verbose)
  //  console.log(`[QuadGovernance] setEligibleAttribute for ATTRIBUTE_DID`);
  //await governance.setEligibleAttribute(ATTRIBUTE_COUNTRY, true);
  //if (verbose)
  //  console.log(`[QuadGovernance] setEligibleAttribute for ATTRIBUTE_COUNTRY`);
  //await governance.setEligibleAttribute(ATTRIBUTE_IS_BUSINESS, true);
  //if (verbose)
  //  console.log(
  //    `[QuadGovernance] setEligibleAttribute for ATTRIBUTE_IS_BUSINESS`
  //  );
  //
  //// Set Eligible Attributes by DID
  //await governance.setEligibleAttributeByDID(ATTRIBUTE_AML, true);
  //if (verbose)
  //  console.log(`[QuadGovernance] setEligibleAttributeByDID for ATTRIBUTE_AML`);


  //await governance.addIssuer(
  //  issuers[6].wallet,
  //  issuers[6].treasury,
  //);
  //  console.log(
  //    6
  //  );
  //
  //  await governance.addIssuer(
  //    issuers[7].wallet,
  //    issuers[7].treasury,
  //  );
  //    console.log(
  //      7
  //    );

  console.log(issuers[7].attributesPermission.length)
  console.log(issuers[7].attributesPermission[0])
  //await governance.setIssuerAttributePermission(
  //  issuers[7].wallet,
  //  issuers[7].attributesPermission[0],
  //  true,
  //  {
  //    gasLimit: "100000"
  //  }
  //);
  //console.log("a")
  await governance.setIssuerAttributePermission(
    issuers[7].wallet,
    issuers[7].attributesPermission[1],
    true,{
      gasLimit: "100000"
    }
  );  console.log("ab")

  await governance.setIssuerAttributePermission(
    issuers[7].wallet,
    issuers[7].attributesPermission[2],
    true,{
      gasLimit: "100000"
    }
  );  console.log("ac")

  await governance.setIssuerAttributePermission(
    issuers[7].wallet,
    issuers[7].attributesPermission[3],
    true,{
      gasLimit: "100000"
    }
  );  console.log("ad")

  // Set Rev Split
  /* await governance.setRevSplitIssuer(50);
   if (verbose) console.log(`[QuadGovernance] setRevSplitIssuer with 50`);

   // Set Query Fee
   const attributeTypes = [ATTRIBUTE_DID, ATTRIBUTE_AML, ATTRIBUTE_COUNTRY];

   for (const attr of attributeTypes) {
     await governance.setAttributePriceFixed(
       attr,
       PRICE_PER_ATTRIBUTES[network.chainId][attr],
     );

     await governance.setBusinessAttributePriceFixed(
       attr,
       PRICE_PER_BUSINESS_ATTRIBUTES[network.chainId][attr],
     );
   }
   if (verbose)
     console.log(`[QuadGovernance] setAttributePriceFixed for all attributes`);
   if (verbose)
     console.log(
       `[QuadGovernance] setBusinessAttributePriceFixed for all attributes`
     );

   // Set QuadReader as READER_ROLE
   await governance.grantRole(READER_ROLE, reader.address);
   if (verbose)
     console.log(`[QuadGovernance] grant READER_ROLE to ${reader.address}`);

   // Grant `GOVERNANCE_ROLE` and `DEFAULT_ADMIN_ROLE` to Timelock
   await governance.grantRole(GOVERNANCE_ROLE, timelock);
   if (verbose)
     console.log(`[QuadGovernance] grant GOVERNANCE_ROLE to ${timelock}`);
   await governance.grantRole(DEFAULT_ADMIN_ROLE, timelock);
   if (verbose)
     console.log(`[QuadGovernance] grant DEFAULT_ADMIN_ROLE to ${timelock}`);

   // GRANT `PAUSER_ROLE` to MULTISIG
   await governance.grantRole(PAUSER_ROLE, multisig);
   if (verbose) console.log(`[QuadGovernance] grant PAUSER_ROLE to ${multisig}`);

   // Deploy TestQuadrata contracts
   const TestQuadrata = await ethers.getContractFactory("TestQuadrata");
   const testQuadrata = await TestQuadrata.deploy();
   await testQuadrata.deployed();

   if (verbose)
     console.log(`[TestQuadrata] deployed at address ${testQuadrata.address}`);
   await testQuadrata.setReader(reader.address, { maxFeePerGas });
   if (verbose)
     console.log(
       `[TestQuadrata] setting QuadReader address with ${reader.address}`
     );
     */

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
  const passport = await upgrades.deployProxy(
    QuadPassport,
    [governance.address],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor"] }
  );
  await passport.deployed();
  return passport;
};

export const deployGovernance = async (
  governanceAddress: string = ""
): Promise<Contract> => {
  if (governanceAddress !== "") {
    return await ethers.getContractAt("QuadGovernance", governanceAddress);
  }
  const QuadGovernance = await ethers.getContractFactory("QuadGovernance");
  const governance = await upgrades.deployProxy(QuadGovernance, [], {
    initializer: "initialize",
    kind: "uups",
    unsafeAllow: ["constructor"],
  });
  await governance.deployed();
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
  const reader = await upgrades.deployProxy(
    QuadReader,
    [governance.address, passport.address],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor"] }
  );
  await reader.deployed();
  return reader;
};
