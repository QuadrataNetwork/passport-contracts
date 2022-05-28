import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

const { ethers, upgrades } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

// Only rinkeby for now.
// TODO: Turn into object/mapping and handle Mumbai/Prod/Moonbeam as well
const QUADPASSPORT_PROXY_CONTRACT = '0x485582Af3CA30F937b22f2b6d48340a8769e54A4'


(async () => {
  const QuadPassport = await ethers.getContractFactory('QuadPassport');
  console.log('Upgrading QuadPassport...');
  await upgrades.upgradeProxy(QUADPASSPORT_PROXY_CONTRACT, QuadPassport);
  console.log('QuadPassport upgraded');
})()
