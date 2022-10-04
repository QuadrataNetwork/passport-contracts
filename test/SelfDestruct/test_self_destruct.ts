import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat"

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { GOVERNANCE_ROLE } = require("../../utils/constant.ts");

describe("SelfDestruct()", function () {
  let passport: Contract; // eslint-disable-line no-unused-vars
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer1: SignerWithAddress,
    issuerTreasury1: SignerWithAddress;

  beforeEach(async () => {
    [deployer, admin, issuer1, treasury, issuerTreasury1] =
      await ethers.getSigners();

    [governance, passport, reader] = await deployPassportEcosystem(
      admin,
      [issuer1],
      treasury,
      [issuerTreasury1]
    );
  });

  it("should destroy QuadPassport", async () => {
    await governance
      .connect(admin)
      .grantRole(GOVERNANCE_ROLE, deployer.address);

    const SelfDestruct = await ethers.getContractFactory("SelfDestruct");
    const selfDestruct = await SelfDestruct.deploy();
    await selfDestruct.deployed();

    const calldata = selfDestruct.interface.encodeFunctionData("dangerZone");
    // calldata: 0xc7af5f6a

    await passport.connect(admin).upgradeTo(selfDestruct.address);
    // await passport.connect(admin).dangerZone();
    await passport.connect(admin).upgradeToAndCall(selfDestruct.address, calldata);

    const signers: any = await ethers.getSigners();
    console.log(await signers[0].provider.getCode(passport.address))
  })
})
