import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { deployGovernance } = require("../../utils/deployment.ts");

const {
  GOVERNANCE_ROLE,
  DEFAULT_ADMIN_ROLE,
} = require("../../utils/constant.ts");

describe("QuadGovernance.setPassportContractAddress + updateGovernanceInPassport", async () => {
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

  describe("updateGovernanceInPassport", async () => {
    it("success", async () => {
      expect(await passport.governance()).to.equal(governance.address);
      const newGovernance = await deployGovernance();
      await newGovernance.grantRole(GOVERNANCE_ROLE, admin.address);
      await newGovernance.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
      await newGovernance.revokeRole(GOVERNANCE_ROLE, deployer.address);
      await newGovernance.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
      await governance
        .connect(admin)
        .updateGovernanceInPassport(newGovernance.address);
      await newGovernance
        .connect(admin)
        .setPassportContractAddress(passport.address);

      await expect(
        await newGovernance.connect(admin).acceptGovernanceInPassport()
      )
        .to.emit(passport, "GovernanceUpdated")
        .withArgs(governance.address, newGovernance.address);

      expect(await passport.governance()).to.equal(newGovernance.address);
    });

    it("fail (not admin)", async () => {
      await expect(
        governance
          .connect(treasury)
          .updateGovernanceInPassport(deployer.address)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (address zero)", async () => {
      await expect(
        governance
          .connect(admin)
          .updateGovernanceInPassport(ethers.constants.AddressZero)
      ).to.be.revertedWith("GOVERNANCE_ADDRESS_ZERO");
    });

    it("fail (passport not set)", async () => {
      const newGovernance = await deployGovernance();
      await newGovernance.grantRole(GOVERNANCE_ROLE, admin.address);
      await newGovernance.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
      await newGovernance.revokeRole(GOVERNANCE_ROLE, deployer.address);
      await newGovernance.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);

      await expect(
        newGovernance
          .connect(admin)
          .updateGovernanceInPassport(deployer.address)
      ).to.be.revertedWith("PASSPORT_NOT_SET");
    });
  });

  describe("setPassportContractAddress", async () => {
    it("succeed", async () => {
      expect(await governance.passport()).to.equal(passport.address);
      await expect(
        governance.connect(admin).setPassportContractAddress(deployer.address)
      )
        .to.emit(governance, "PassportAddressUpdated")
        .withArgs(passport.address, deployer.address);
      expect(await governance.passport()).to.equal(deployer.address);
    });

    it("fail (not admin)", async () => {
      await expect(
        governance.connect(treasury).setPassportContractAddress(deployer.address)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (address zero)", async () => {
      await expect(
        governance
          .connect(admin)
          .setPassportContractAddress(ethers.constants.AddressZero)
      ).to.be.revertedWith("PASSPORT_ADDRESS_ZERO");
    });

    it("fail (passport already set)", async () => {
      await expect(
        governance.connect(admin).setPassportContractAddress(passport.address)
      ).to.be.revertedWith("PASSPORT_ADDRESS_ALREADY_SET");
    });
  });
});
