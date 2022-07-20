import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

const { ethers, upgrades } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

const deployGovernance = async (admin: string) => {
  console.log("Admin: ", admin);
  const QuadGovernance = await ethers.getContractFactory("QuadGovernance");
  const governance = await upgrades.deployProxy(QuadGovernance, [admin], {
    initializer: "initialize",
    kind: "uups",
    unsafeAllow: ["constructor"],
  });
  await governance.deployed();
  console.log(`QuadGovernance is deployed: ${governance.address}`);
  return governance;
};

const deployPassport = async (governance: string, uri: string) => {
  const QuadPassport = await ethers.getContractFactory("QuadPassport");
  const passport = await upgrades.deployProxy(QuadPassport, [governance, uri], {
    initializer: "initialize",
    kind: "uups",
    unsafeAllow: ["constructor"],
  });
  await passport.deployed();
  console.log(`QuadPassport is deployed: ${passport.address}`);
  return passport;
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
  console.log("QuadReader is deployed: ", reader.address);
  await reader.deployed();
  return reader;
};

(async () => {
  const signers = await ethers.getSigners();
  const timelock = signers[0].address;
  const governance = await deployGovernance(timelock);
  const passport = await deployPassport(
    governance.address,
    "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu"
  );
  const reader = await deployReader(governance, passport);
})();
