import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

describe("QuadFEUtils.initialize", async () => {
  let passport: Contract; // eslint-disable-line no-unused-vars
  let governance: Contract; // eslint-disable-line no-unused-vars
  let feUtils: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress; // eslint-disable-line no-unused-vars

  beforeEach(async () => {
    [deployer] =  await ethers.getSigners();
    let reader, defi, mockbusiness;
    [governance, passport,reader, defi, mockbusiness, feUtils] = await deployPassportEcosystem(
      deployer,
      [deployer],
      deployer,
      [deployer]
    );
  });

  it("success", async () => {
    expect(await feUtils.governance()).equals(governance.address);
    expect(await feUtils.passport()).equals(passport.address);
  });

  it("fail - governance address(0)", async () => {
    const QuadFEUtils = await ethers.getContractFactory("QuadFEUtils");
    await expect(
      upgrades.deployProxy(QuadFEUtils, [ethers.constants.AddressZero], {
        initializer: "initialize",
        kind: "uups",
        unsafeAllow: ["constructor"],
      })
    ).to.be.reverted;
  });

  it("fail - doesn't let re-initialize", async () => {
    await expect(feUtils.initialize(deployer.address, deployer.address)).to.revertedWith(
      "Initializable: contract is already initialized"
    );
  });
});
