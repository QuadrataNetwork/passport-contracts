import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import { deployPassport, deployGovernance, deployPassportHelper } from "../../utils/deployment";

export const deployPassportAndGovernance = async (
  admin: SignerWithAddress,
  issuer: SignerWithAddress,
  treasury: SignerWithAddress,
  issuerTreasury: SignerWithAddress,
  uri: string
): Promise<[Contract, Contract, Contract, any, any, any]> => {
  // Deploy Governance
  const governance = await deployGovernance(admin);
  await governance
    .connect(admin)
    .addIssuer(issuer.address, issuerTreasury.address);

  // Deploy Passport
  const passport = await deployPassport(governance, uri);
  await governance.connect(admin).setPassportContractAddress(passport.address);

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
  await governance.connect(admin).setOracle(oracle.address);
  await governance.connect(admin).allowTokenPayment(usdc.address, true);
  await governance.connect(admin).setTreasury(treasury.address);

  // Deploy PassportHelper
  const passportHelper = await deployPassportHelper(passport, governance);


  // Deploy DeFi
  const DeFi = await ethers.getContractFactory("DeFi");
  const defi = await DeFi.deploy(passport.address);
  await defi.deployed();

  return [governance, passport, passportHelper, usdc, defi, oracle];
};
