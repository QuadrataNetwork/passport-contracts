import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const { deployQuadrata } = require("../../utils/deployment.ts");

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
  GOVERNANCE_ROLE,
  DEFAULT_ADMIN_ROLE,
  ALLOW_LIST_AML_THRESHOLD
} = require("../../utils/constant.ts");

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const deployPassportEcosystem = async (
  admin: SignerWithAddress,
  issuers: SignerWithAddress[],
  treasury: SignerWithAddress,
  issuerTreasuries: SignerWithAddress[]
): Promise<
  [Promise<Contract>, Promise<Contract>, Promise<Contract>, any, any]
> => {
  const issuersToAdd: any[] = [];
  for (let i = 0; i < issuers.length; i++) {
    issuersToAdd.push({
      wallet: issuers[i].address,
      treasury: issuerTreasuries[i].address,
      attributesPermission: [
        ATTRIBUTE_DID,
        ATTRIBUTE_AML,
        ATTRIBUTE_COUNTRY,
        ATTRIBUTE_IS_BUSINESS,
      ],
    });
  }

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const tokenIds = [{ id: 1, uri: "https://wwww.quadrata.com/ipfs" }];
  const [governance, passport, reader, maxFeePerGas] = await deployQuadrata(
    admin.address,
    issuersToAdd,
    treasury.address,
    admin.address,
    tokenIds,
    true
  );
  console.log("Completed deploying quadrata")

  // Revoke Deployer Role
  //await governance.revokeRole(GOVERNANCE_ROLE, deployer.address, {maxFeePerGas});
  //await governance.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address, {maxFeePerGas});

  console.log("revoked")

  // Deploy DeFi
  const DeFi = await ethers.getContractFactory("DeFi");
  const defi = await DeFi.deploy(passport.address, reader.address);
  await defi.deployed();
  console.log("deployed defi")

  // Deploy MockBusiness
  const MockBusiness = await ethers.getContractFactory("MockBusiness");
  const mockbusiness = await MockBusiness.deploy(defi.address);
  await mockbusiness.deployed();
  console.log("deployed mock business")

  // Add QuadPassport as Admin of AllowList
  const TX_ALLOW_LIST_ADDRESS = "0x0200000000000000000000000000000000000002";

  //console.log("allow list setting admin")
  //await allowList.setAdmin(passport.address, {maxFeePerGas});
  const allowList = await ethers.getContractAt(
    "IAllowList",
    TX_ALLOW_LIST_ADDRESS,
    admin
  );
  await allowList.connect(admin).setAdmin(passport.address);

  console.log("governance setting allow list threshold")
  await governance.setAllowListAMLThreshold(ALLOW_LIST_AML_THRESHOLD, {maxFeePerGas});

  console.log("ecosystem deployed")

  return [governance, passport, reader, defi, mockbusiness];
};
