import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { GOVERNANCE_ROLE } = require("../../utils/constant.ts");

describe("QuadGovernance.upgrade", async () => {
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

  describe("upgrade", async () => {
    it("succeed", async () => {
      const QuadGovernanceV2 = await ethers.getContractFactory(
        "QuadGovernanceUpgrade"
      );
      await governance
        .connect(admin)
        .grantRole(GOVERNANCE_ROLE, deployer.address);
      const governanceV2 = await upgrades.upgradeProxy(
        governance.address,
        QuadGovernanceV2,
        { unsafeAllow: ["constructor"] }
      );
      expect(await governanceV2.getPriceETHV2()).to.equal(1337);
      expect(await governanceV2.getIssuersLength()).to.equal(1);
      expect(governanceV2.address).to.equal(governance.address);
    });

    it("fail (not admin)", async () => {
      const QuadGovernanceV2 = await ethers.getContractFactory(
        "QuadGovernanceUpgrade",
        treasury
      );
      await expect(
        upgrades.upgradeProxy(governance.address, QuadGovernanceV2, {
          unsafeAllow: ["constructor"],
        })
      ).to.revertedWith("INVALID_ADMIN");
    });
  });
});
