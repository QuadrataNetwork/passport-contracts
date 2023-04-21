import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const { deployQuadrata } = require("../../utils/deployment.ts");

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
  ATTRIBUTE_ACCREDITED_INVESTOR_US,
  GOVERNANCE_ROLE,
  DEFAULT_ADMIN_ROLE,
} = require("../../utils/constant.ts");

const { OPERATOR, READER_ONLY } = require("../../scripts/data/testnet.ts");

export const deployPassportEcosystem = async (
  admin: SignerWithAddress,
  issuers: SignerWithAddress[],
  treasury: SignerWithAddress,
  issuerTreasuries: SignerWithAddress[],
  opts: any = {}
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
        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
        ATTRIBUTE_ACCREDITED_INVESTOR_US,
      ],
    });
  }

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const [governance, passport, reader] = await deployQuadrata(
    admin.address,
    issuersToAdd,
    treasury.address,
    admin.address,
    OPERATOR,
    READER_ONLY,
    false
  );

  // Deploy DeFi
  const DeFi = await ethers.getContractFactory("DeFi");
  const defi = await DeFi.deploy(passport.address, reader.address);
  await defi.deployed();

  // Deploy MockBusiness
  const MockBusiness = await ethers.getContractFactory("MockBusiness");
  const mockbusiness = await MockBusiness.deploy(defi.address);
  await mockbusiness.deployed();

  // let signers be preapproved
  if (!opts.skipPreapproval) {
    const addressesToApprove = [
      defi.address,
      mockbusiness.address,
      admin.address,
      deployer.address,
    ];
    const preapprovalStatuses = addressesToApprove.map(() => true);
    await governance
      .connect(admin)
      .setPreapprovals(addressesToApprove, preapprovalStatuses);
  }

  // Revoke Deployer Role
  await governance.connect(admin).revokeRole(GOVERNANCE_ROLE, deployer.address);
  await governance
    .connect(admin)
    .revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);

  return [governance, passport, reader, defi, mockbusiness];
};
