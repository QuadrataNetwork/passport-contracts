import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  ATTRIBUTE_IS_BUSINESS,
  TOKEN_ID,
  GOVERNANCE_ROLE,
  DEFAULT_ADMIN_ROLE,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

describe("QuadGovernance.initialize", async () => {
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

  describe("initialize", async () => {
    it("success", async () => {
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_DID)).to.equal(
        false
      );

      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        true
      );
      expect(
        await governance.eligibleAttributesByDID(ATTRIBUTE_COUNTRY)
      ).to.equal(false);

      expect(
        await governance.eligibleAttributes(ATTRIBUTE_IS_BUSINESS)
      ).to.equal(true);
      expect(
        await governance.eligibleAttributesByDID(ATTRIBUTE_IS_BUSINESS)
      ).to.equal(false);

      expect(await governance.eligibleAttributes(ATTRIBUTE_AML)).to.equal(
        false
      );
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_AML)).to.equal(
        true
      );

      expect(await governance.revSplitIssuer()).to.equal(50);

      expect(await governance.hasRole(GOVERNANCE_ROLE, admin.address)).to.equal(
        true
      );

      expect(
        await governance.hasRole(DEFAULT_ADMIN_ROLE, admin.address)
      ).to.equal(true);
    });
  });
});
