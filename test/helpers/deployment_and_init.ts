import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const { deployQuadrata } = require("../../utils/deployment.ts");

const {
  GOVERNANCE_ROLE,
  DEFAULT_ADMIN_ROLE,
} = require("../../utils/constant.ts");

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
    });
  }

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const tokenIds = [{ id: 1, uri: "https://wwww.quadrata.com/ipfs" }];
  const [governance, passport, reader] = await deployQuadrata(
    admin.address,
    issuersToAdd,
    treasury.address,
    admin.address,
    tokenIds,
    deployer
  );

  // Revoke Deployer Role
  await governance.connect(admin).revokeRole(GOVERNANCE_ROLE, deployer.address);
  await governance
    .connect(admin)
    .revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);

  // Deploy DeFi
  const DeFi = await ethers.getContractFactory("DeFi");
  const defi = await DeFi.deploy(passport.address, reader.address);
  await defi.deployed();

  // Deploy MockBusiness
  const MockBusiness = await ethers.getContractFactory("MockBusiness");
  const mockbusiness = await MockBusiness.deploy(defi.address);
  await mockbusiness.deployed();

  return [governance, passport, reader, defi, mockbusiness];
};
