import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
const { ethers, upgrades } = require("hardhat");
import { BigNumber, Contract } from "ethers";

export const deployPassport = async (
  governance: SignerWithAddress
): Promise<Contract> => {
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
  admin: SignerWithAddress
): Promise<Contract> => {
  const QuadGovernance = await ethers.getContractFactory("QuadGovernance");
  const governance = await upgrades.deployProxy(
    QuadGovernance,
    [admin.address],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor"] }
  );
  await governance.deployed();
  return governance;
};

export const deployReader = async (
  governance: SignerWithAddress,
  passport: SignerWithAddress
): Promise<Contract> => {
  const QuadReader = await ethers.getContractFactory("QuadReader");
  const reader = await upgrades.deployProxy(
    QuadReader,
    [governance.address, passport.address],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor"] }
  );
  await reader.deployed();
  return reader;
};
