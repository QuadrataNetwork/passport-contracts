import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract, constants } from "ethers";
import { ethers } from "hardhat";

import { id } from "ethers/lib/utils";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { ATTRIBUTE_AML } = require("../../utils/constant.ts");

describe("QuadGovernance.setIssuerAttributePermission", async () => {
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

  describe("setIssuerAttributePermission / getIssuerAttributePermission", async () => {
    it("succeed - authorize an attribute", async () => {
      const newAttribute = id("NEW_ATTRIBUTE_SCORE");
      await governance.setEligibleAttribute(newAttribute);
      expect(
        await governance.getIssuerAttributePermission(
          issuer1.address,
          newAttribute
        )
      ).equals(false);

      await expect(
        governance
          .connect(admin)
          .setIssuerAttributePermission(issuer1.address, newAttribute, true)
      )
        .to.emit(governance, "IssuerAttributePermission")
        .withArgs(issuer1.address, newAttribute, true);

      expect(
        await governance.getIssuerAttributePermission(
          issuer1.address,
          newAttribute
        )
      ).equals(true);
    });

    it("succeed - remove authorization for an attribute", async () => {
      expect(
        await governance.getIssuerAttributePermission(
          issuer1.address,
          ATTRIBUTE_AML
        )
      ).equals(true);

      await expect(
        governance
          .connect(admin)
          .setIssuerAttributePermission(issuer1.address, ATTRIBUTE_AML, false)
      )
        .to.emit(governance, "IssuerAttributePermission")
        .withArgs(issuer1.address, ATTRIBUTE_AML, false);

      expect(
        await governance.getIssuerAttributePermission(
          issuer1.address,
          ATTRIBUTE_AML
        )
      ).equals(false);
    });

    it("fail - must be admin", async () => {
      await expect(
        governance
          .connect(issuer1)
          .setIssuerAttributePermission(issuer1.address, ATTRIBUTE_AML, false)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail - must be valid issuer address (non-zero)", async () => {
      await expect(
        governance
          .connect(admin)
          .setIssuerAttributePermission(
            constants.AddressZero,
            ATTRIBUTE_AML,
            false
          )
      ).to.be.revertedWith("ISSUER_ADDRESS_ZERO");
    });

    it("fail - must be ISSUER_ROLE", async () => {
      await expect(
        governance
          .connect(admin)
          .setIssuerAttributePermission(admin.address, ATTRIBUTE_AML, false)
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - must be eligible attribute", async () => {
      await expect(
        governance
          .connect(admin)
          .setIssuerAttributePermission(
            issuer1.address,
            id("RANDOM_ATTRIBUTE"),
            false
          )
      ).to.be.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });
  });
});
