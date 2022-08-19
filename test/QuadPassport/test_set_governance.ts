import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { deployGovernance } = require("../../utils/deployment.ts");

describe("QuadPassport.setGovernance and .acceptGovernance", async () => {
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

  describe("QuadPassport.setGovernance", async () => {
    it("succeed", async () => {
      expect(await passport.governance()).to.equal(governance.address);
      const newGovernance = await deployGovernance(admin);
      await expect(
        await governance
          .connect(admin)
          .updateGovernanceInPassport(newGovernance.address)
      )
        .to.emit(passport, "SetPendingGovernance")
        .withArgs(newGovernance.address);

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

    it("fail (not governance contract)", async () => {
      expect(await passport.governance()).to.equal(governance.address);

      await expect(
        passport.connect(treasury).setGovernance(deployer.address)
      ).to.be.revertedWith("ONLY_GOVERNANCE_CONTRACT");
    });
  });
});
