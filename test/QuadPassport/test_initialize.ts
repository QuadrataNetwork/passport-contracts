import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

describe("QuadPassport.initialize", async () => {
  let passport: Contract; // eslint-disable-line no-unused-vars
  let governance: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;
  beforeEach(async () => {
    [deployer, admin, issuer, treasury, issuerTreasury] =
      await ethers.getSigners();
    [governance, passport] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury]
    );
  });

  it("success", async () => {
    expect(await passport.governance()).equals(governance.address);
    expect(await passport.name()).equals("Quadrata Passport");
    expect(await passport.symbol()).equals("QP");
  });

  it("fail - governance address(0)", async () => {
    const QuadPassport = await ethers.getContractFactory("QuadPassport");
    await expect(
      upgrades.deployProxy(QuadPassport, [ethers.constants.AddressZero], {
        initializer: "initialize",
        kind: "uups",
        unsafeAllow: ["constructor"],
      })
    ).to.be.reverted;
  });

  it("fail - doesn't let re-initialize", async () => {
    await expect(passport.initialize(issuer.address)).to.revertedWith(
      "Initializable: contract is already initialized"
    );
  });
});
