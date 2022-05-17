import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
const { ethers, upgrades } = require("hardhat");
import { BigNumber, Contract } from "ethers";

export const deployPassport = async (
  governance: SignerWithAddress,
  uri: string
): Promise<Contract> => {
  const QuadPassport = await ethers.getContractFactory("QuadPassport");
  const passport = await upgrades.deployProxy(
    QuadPassport,
    [governance.address, uri],
    { initializer: "initialize", kind: "uups" }
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
    { initializer: "initialize", kind: "uups" }
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
    [
      governance.address,
      passport.address
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await reader.deployed();
  return reader;
};


export const deployFaucetERC20 = async(
  name: string,
  symbol: string,
  decimal: BigNumber
): Promise<Contract> => {
  const contractFactory = await ethers.getContractFactory("FaucetERC20");
  const erc20 = await contractFactory.deploy(name, symbol, decimal)
  await erc20.deployed();
  return erc20;
};
