import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract, constants } from "ethers";
import { ethers } from "hardhat";

import { id } from "ethers/lib/utils";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

describe("QuadGovernance.setIssuerStatus", async () => {
  let passport: Contract; // eslint-disable-line no-unused-vars
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer1: SignerWithAddress,
    issuer2: SignerWithAddress,
    issuer3: SignerWithAddress,
    issuerTreasury1: SignerWithAddress,
    issuerTreasury2: SignerWithAddress,
    issuerTreasury3: SignerWithAddress;

  beforeEach(async () => {
    [
      deployer,
      admin,
      issuer1,
      issuer2,
      issuer3,
      treasury,
      issuerTreasury1,
      issuerTreasury2,
      issuerTreasury3,
    ] = await ethers.getSigners();

    [governance, passport, reader] = await deployPassportEcosystem(
      admin,
      [issuer1, issuer2, issuer3],
      treasury,
      [issuerTreasury1, issuerTreasury2, issuerTreasury3]
    );
  });

  describe("setIssuerStatus / getIssuerStatus", async () => {
    it("succeed - turns an active issuer into a deactivated issuer", async () => {
      expect(await governance.getIssuerStatus(issuer1.address)).equals(true);
      expect(
        await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)
      ).equals(true);

      await expect(
        governance.connect(admin).setIssuerStatus(issuer1.address, false)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer1.address, false);

      expect(await governance.getIssuerStatus(issuer1.address)).equals(false);
      expect(
        await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)
      ).equals(false);
    });

    it("succeed - turns a deactivated issuer into an active issuer", async () => {
      expect(await governance.getIssuerStatus(issuer1.address)).equals(true);
      expect(
        await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)
      ).equals(true);

      await expect(
        governance.connect(admin).setIssuerStatus(issuer1.address, false)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer1.address, false);

      expect(await governance.getIssuerStatus(issuer1.address)).equals(false);
      expect(
        await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)
      ).equals(false);

      await expect(
        governance.connect(admin).setIssuerStatus(issuer1.address, true)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer1.address, true);

      expect(await governance.getIssuerStatus(issuer1.address)).equals(true);
      expect(
        await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)
      ).equals(true);
    });

    it("fail - cannot set active issuer to random status", async () => {
      expect(await governance.getIssuerStatus(issuer1.address)).equals(true);
      expect(
        await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)
      ).equals(true);

      await governance.connect(admin).setIssuerStatus(issuer1.address, "hello");

      expect(await governance.getIssuerStatus(issuer1.address)).equals(true);
      expect(
        await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)
      ).equals(true);
    });

    it("fail - must be admin", async () => {
      expect(await governance.getIssuerStatus(issuer1.address)).equals(true);
      expect(
        await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)
      ).equals(true);

      await expect(
        governance.connect(issuer1).setIssuerStatus(issuer1.address, false)
      ).to.be.revertedWith("INVALID_ADMIN");

      expect(await governance.getIssuerStatus(issuer1.address)).equals(true);
      expect(
        await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)
      ).equals(true);
    });

    it("fail - must be valid value", async () => {
      expect(await governance.getIssuerStatus(issuer1.address)).equals(true);
      expect(
        await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)
      ).equals(true);

      await expect(
        governance.connect(admin).setIssuerStatus(constants.AddressZero, false)
      ).to.be.revertedWith("ISSUER_ADDRESS_ZERO");

      expect(await governance.getIssuerStatus(issuer1.address)).equals(true);
      expect(
        await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)
      ).equals(true);
    });
  });
});
