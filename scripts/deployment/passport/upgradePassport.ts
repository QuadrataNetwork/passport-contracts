import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

const { ethers, upgrades } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

// Only testnet for now.
// TODO: Turn into object/mapping and handle Mumbai/Prod/Moonbeam as well
const QUADPASSPORT_PROXY_CONTRACT = '0x69Ec3DD088e971bC24ef49aB8e57325c28cf30Dd';

(async () => {
  const QuadPassport = await ethers.getContractFactory('QuadPassport');
  console.log('Upgrading QuadPassport...');
  await upgrades.upgradeProxy(QUADPASSPORT_PROXY_CONTRACT, QuadPassport);
  console.log('QuadPassport upgraded');
})()
