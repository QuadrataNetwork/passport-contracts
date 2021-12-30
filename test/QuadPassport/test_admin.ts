import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { GOVERNANCE_ROLE } = require("../../utils/constant.ts");

const {
  deployPassportAndGovernance,
} = require("../utils/deployment_and_init.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;
  const baseURI = "https://quadrata.io";

  describe("setGovernance", async () => {
    beforeEach(async () => {
      [deployer, admin, issuer, treasury, issuerTreasury] =
        await ethers.getSigners();
      [governance, passport] = await deployPassportAndGovernance(
        admin,
        issuer,
        treasury,
        issuerTreasury,
        baseURI
      );
    });

    it("succeed", async () => {
      expect(await passport.governance()).to.equal(governance.address);
      await expect(
        governance.connect(admin).updateGovernanceInPassport(treasury.address)
      )
        .to.emit(passport, "GovernanceUpdated")
        .withArgs(governance.address, treasury.address);
      expect(await passport.governance()).to.equal(treasury.address);
    });

    it("fail (not governance contract)", async () => {
      expect(await passport.governance()).to.equal(governance.address);
      await expect(
        passport.connect(admin).setGovernance(deployer.address)
      ).to.be.revertedWith("ONLY_GOVERNANCE_CONTRACT");
      await expect(
        passport.connect(deployer).setGovernance(deployer.address)
      ).to.be.revertedWith("ONLY_GOVERNANCE_CONTRACT");
    });

    it("fail (governance already set)", async () => {
      expect(await passport.governance()).to.equal(governance.address);
      await expect(
        governance.connect(admin).updateGovernanceInPassport(governance.address)
      ).to.be.revertedWith("GOVERNANCE_ALREADY_SET");
    });
  });

  describe("upgrade", async () => {
    it("fail (not admin)", async () => {
      const QuadPassportV2 = await ethers.getContractFactory("QuadPassportV2");
      await expect(
        upgrades.upgradeProxy(passport.address, QuadPassportV2)
      ).to.revertedWith("INVALID_ADMIN");
    });
    it("succeed", async () => {
      const QuadPassportV2 = await ethers.getContractFactory("QuadPassportV2");
      await governance
        .connect(admin)
        .grantRole(GOVERNANCE_ROLE, deployer.address);
      const passportv2 = await upgrades.upgradeProxy(
        passport.address,
        QuadPassportV2
      );
      expect(await passportv2.foo()).to.equal(1337);
      expect(passport.address).to.equal(passportv2.address);
      expect(await passportv2.governance()).to.equal(governance.address);
    });
  });
});
