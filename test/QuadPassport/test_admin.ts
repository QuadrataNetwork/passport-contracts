import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { GOVERNANCE_ROLE } = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let governance: Contract;
  let reader: Contract;
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
      [governance, passport, reader] = await deployPassportEcosystem(
        admin,
        [issuer],
        treasury,
        [issuerTreasury],
        baseURI
      );
    });

    it("succeed", async () => {
      expect(await passport.governance()).to.equal(governance.address);
      await governance.connect(admin).updateGovernanceInPassport(treasury.address)
      await governance
        .connect(admin)
        .grantRole(GOVERNANCE_ROLE, admin.address);

      await expect(
        await governance.connect(admin).acceptGovernanceInPassport()
      )
        .to.emit(passport, "GovernanceUpdated")
        .withArgs(governance.address, treasury.address);
      expect(await passport.governance()).to.equal(treasury.address);
    });

    it("fail (not governance contract)", async () => {
      expect(await passport.governance()).to.equal(governance.address);

      await expect(
        passport.connect(treasury).setGovernance(deployer.address, deployer.address)
      ).to.be.revertedWith("ONLY_GOVERNANCE");
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
