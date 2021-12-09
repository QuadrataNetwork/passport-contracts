import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const { ISSUER_ROLE } = require("../../utils/constant.ts");

const {
  deployPassport,
  deployGovernance,
} = require("../../utils/deployment.ts");

export const deployPassportAndGovernance = async (
  admin: SignerWithAddress,
  issuer: SignerWithAddress,
  treasury: SignerWithAddress,
  uri: string
): Promise<[Promise<Contract>, Promise<Contract>, any, any]> => {
  // Deploy Governance
  const governance = await deployGovernance(admin, issuer);
  governance.connect(admin).grantRole(ISSUER_ROLE, issuer.address);

  // Deploy Passport
  const passport = await deployPassport(governance, admin, uri);
  governance.connect(admin).setPassportContractAddress(passport.address);

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
  governance.connect(admin).setOracle(oracle.address);
  governance.connect(admin).allowTokenPayment(usdc.address, true);
  governance.connect(admin).setTreasury(treasury.address);

  // Deploy DeFi
  const DeFi = await ethers.getContractFactory("DeFi");
  const defi = await DeFi.deploy(passport.address);
  await defi.deployed();

  return [governance, passport, usdc, defi];
};