import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { GOVERNANCE_ROLE } = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let governance: Contract;
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

  describe("upgrade", async () => {
    it("fail (not admin)", async () => {
      const QuadPassportUpgrade = await ethers.getContractFactory(
        "QuadPassportUpgrade"
      );
      await expect(
        upgrades.upgradeProxy(passport.address, QuadPassportUpgrade, {
          unsafeAllow: ["constructor"],
        })
      ).to.revertedWith("INVALID_ADMIN");
    });
    it("succeed", async () => {
      const QuadPassportUpgrade = await ethers.getContractFactory(
        "QuadPassportUpgrade"
      );
      await governance
        .connect(admin)
        .grantRole(GOVERNANCE_ROLE, deployer.address);
      const passportv2 = await upgrades.upgradeProxy(
        passport.address,
        QuadPassportUpgrade,
        { unsafeAllow: ["constructor"] }
      );
      expect(await passportv2.foo()).to.equal(1337);
      expect(passport.address).to.equal(passportv2.address);
      expect(await passportv2.governance()).to.equal(governance.address);
    });
  });
});
