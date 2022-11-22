import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_AML,
} = require("../../utils/constant.ts");

describe("QuadGovernance.setEligibleAttribute", async () => {
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

  describe("setEligibleAttribute", async () => {
    it("succeed (true)", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      expect(await governance.eligibleAttributes(newAttribute)).to.equal(false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      await expect(
        governance.connect(admin).setEligibleAttribute(newAttribute, true)
      )
        .to.emit(governance, "EligibleAttributeUpdated")
        .withArgs(newAttribute, true);

      expect(await governance.eligibleAttributes(newAttribute)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
    });

    it("fail (revert from duplicate element)", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      expect(await governance.eligibleAttributes(newAttribute)).to.equal(false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      await expect(
        governance.connect(admin).setEligibleAttribute(newAttribute, true)
      )
        .to.emit(governance, "EligibleAttributeUpdated")
        .withArgs(newAttribute, true);
      await expect(
        governance.connect(admin).setEligibleAttribute(newAttribute, true)
      ).to.be.revertedWith("ATTRIBUTE_ELIGIBILITY_SET");

      expect(await governance.eligibleAttributes(newAttribute)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
    });

    it("fail (revert from duplicate element)", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      expect(await governance.eligibleAttributes(newAttribute)).to.equal(false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      await expect(
        governance.connect(admin).setEligibleAttribute(newAttribute, false)
      ).to.be.revertedWith("ATTRIBUTE_ELIGIBILITY_SET");

      expect(await governance.eligibleAttributes(newAttribute)).to.equal(false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
    });

    it("succeed (turn false)", async () => {
      expect(await governance.getEligibleAttributesLength()).to.equal(3);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        true
      );
      expect(await governance.eligibleAttributesArray(0)).to.equal(
        ATTRIBUTE_DID
      );
      expect(await governance.eligibleAttributesArray(1)).to.equal(
        ATTRIBUTE_COUNTRY
      );
      await expect(
        governance.connect(admin).setEligibleAttribute(ATTRIBUTE_COUNTRY, false)
      )
        .to.emit(governance, "EligibleAttributeUpdated")
        .withArgs(ATTRIBUTE_COUNTRY, false);

      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        false
      );
      expect(await governance.eligibleAttributesArray(0)).to.equal(
        ATTRIBUTE_DID
      );
      expect(await governance.eligibleAttributesArray(1)).to.not.equal(
        ATTRIBUTE_COUNTRY
      );
      expect(await governance.getEligibleAttributesLength()).to.equal(2);
    });

    it("succeed (turn false  - first element)", async () => {
      expect(await governance.getEligibleAttributesLength()).to.equal(3);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        true
      );
      expect(await governance.eligibleAttributesArray(0)).to.equal(
        ATTRIBUTE_DID
      );
      expect(await governance.eligibleAttributesArray(1)).to.equal(
        ATTRIBUTE_COUNTRY
      );
      await expect(
        governance.connect(admin).setEligibleAttribute(ATTRIBUTE_DID, false)
      )
        .to.emit(governance, "EligibleAttributeUpdated")
        .withArgs(ATTRIBUTE_DID, false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(
        false
      );
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        true
      );
      expect(await governance.eligibleAttributesArray(0)).to.equal(
        ATTRIBUTE_IS_BUSINESS
      );
      expect(await governance.getEligibleAttributesLength()).to.equal(2);
    });

    it("succeed (getEligibleAttributesLength)", async () => {
      expect(await governance.getEligibleAttributesLength()).to.equal(3);
      const newAttribute = ethers.utils.id("CREDIT");
      expect(
        await governance.connect(admin).setEligibleAttribute(newAttribute, true)
      );
      expect(await governance.getEligibleAttributesLength()).to.equal(4);
    });

    it("fail (not admin)", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      await expect(
        governance.connect(issuerTreasury1).setEligibleAttribute(newAttribute, true)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (attribute status already set)", async () => {
      await expect(
        governance.connect(admin).setEligibleAttribute(ATTRIBUTE_DID, true)
      ).to.be.revertedWith("ATTRIBUTE_ELIGIBILITY_SET");
    });
  });

  describe("setEligibleAttributeByDID", async () => {
    it("succeed", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      expect(await governance.eligibleAttributesByDID(newAttribute)).to.equal(
        false
      );
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_AML)).to.equal(
        true
      );

      expect(
        await governance
          .connect(admin)
          .setEligibleAttributeByDID(newAttribute, true)
      );
      expect(await governance.eligibleAttributesByDID(newAttribute)).to.equal(
        true
      );
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_AML)).to.equal(
        true
      );
    });

    it("fail (not admin)", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      await expect(
        governance.connect(treasury).setEligibleAttributeByDID(newAttribute, true)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (attribute status already set)", async () => {
      await expect(
        governance.connect(admin).setEligibleAttributeByDID(ATTRIBUTE_AML, true)
      ).to.be.revertedWith("ATTRIBUTE_ELIGIBILITY_SET");
    });
  });
});
