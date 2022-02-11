import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
const { ethers, upgrades } = require("hardhat");

export const deployPassport = async (
  governance: Contract,
  uri: string
): Promise<Contract> => {
  const QuadPassport = await ethers.getContractFactory("QuadPassport");
  const passport = await upgrades.deployProxy(
    QuadPassport,
    [governance.address, uri],
    { initializer: "initialize", kind: "uups" }
  );
  await passport.deployed();
  // console.log(`QuadPassport is deployed: ${passport.address}`);
  return passport;
};

export const deployGovernance = async (
  admin: SignerWithAddress
): Promise<Contract> => {
  const QuadGovernance = await ethers.getContractFactory("QuadGovernance");
  const governance = await upgrades.deployProxy(
    QuadGovernance,
    [admin.address],
    { initializer: "initialize", kind: "uups" }
  );
  await governance.deployed();
  // console.log(`QuadGovernance is deployed: ${governance.address}`);
  return governance;
};

export const deployPassportHelper = async(
  passport: Contract,
  governance: Contract
): Promise<Contract> => {

  const PassportHelper = await ethers.getContractFactory("QuadPassportHelper");
  const passportHelper = await PassportHelper.deploy(passport.address, governance.address);
  await passportHelper.deployed();

  return passportHelper;
};
