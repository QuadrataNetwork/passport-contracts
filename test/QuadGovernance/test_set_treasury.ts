import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

describe("QuadGovernance.setTreasury", async () => {
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

  describe("setTreasury", async () => {
    it("succeed", async () => {
      expect(await governance.treasury()).to.equal(treasury.address);
      await expect(governance.connect(admin).setTreasury(deployer.address))
        .to.emit(governance, "TreasuryUpdated")
        .withArgs(treasury.address, deployer.address);
      expect(await governance.treasury()).to.equal(deployer.address);
    });

    it("fail (not admin)", async () => {
      await expect(governance.connect(treasury).setTreasury(deployer.address)).to.be.revertedWith(
        "INVALID_ADMIN"
      );
    });

    it("fail (address zero)", async () => {
      await expect(
        governance.connect(admin).setTreasury(ethers.constants.AddressZero)
      ).to.be.revertedWith("TREASURY_ADDRESS_ZERO");
    });

    it("fail (treasury already set)", async () => {
      await expect(
        governance.connect(admin).setTreasury(treasury.address)
      ).to.be.revertedWith("TREASURY_ADDRESS_ALREADY_SET");
    });
  });
});
