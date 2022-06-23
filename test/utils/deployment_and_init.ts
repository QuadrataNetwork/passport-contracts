import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { id } from "ethers/lib/utils";
import { ethers } from "hardhat";

const {
  deployPassport,
  deployGovernance,
  deployReader
} = require("../../utils/deployment.ts");

export const deployPassportEcosystem = async (
  admin: SignerWithAddress,
  issuers: SignerWithAddress[],
  treasury: SignerWithAddress,
  issuerTreasuries: SignerWithAddress[],
  uri: string,
  opts: any
): Promise<[Promise<Contract>, Promise<Contract>, Promise<Contract>, any, any, any]> => {

  // Deploy Governance
  const governance = await deployGovernance(admin);
  for(var i = 0; i < issuers.length; i++) {
    await governance
      .connect(admin)
      .setIssuer(issuers[i].address, issuerTreasuries[i].address);
  }

  // Deploy Passport
  const passport = await deployPassport(governance, uri);
  await governance.connect(admin).setPassportContractAddress(passport.address);

  // Deploy Reader
  const reader = await deployReader(governance, passport);

  // Deploy Oracle
  const UniswapAnchoredView = await ethers.getContractFactory(
    "UniswapAnchoredView"
  );
  const oracle = await UniswapAnchoredView.deploy();
  await oracle.deployed();

  // Deploy USDC
  const ERC20 = await ethers.getContractFactory("USDC");
  const usdc = await ERC20.deploy();
  await usdc.deployed();

  // Deploy Governance
  if(!opts?.skipOracle) {
    await governance.connect(admin).setOracle(oracle.address);
  }
  await governance.connect(admin).allowTokenPayment(usdc.address, true);
  await governance.connect(admin).setTreasury(treasury.address);
  await governance.connect(admin).grantRole(id("READER_ROLE"), reader.address);

  // Deploy DeFi
  const DeFi = await ethers.getContractFactory("DeFi");
  const defi = await DeFi.deploy(passport.address, reader.address);
  await defi.deployed();

  return [governance, passport, reader, usdc, defi, oracle];
};
