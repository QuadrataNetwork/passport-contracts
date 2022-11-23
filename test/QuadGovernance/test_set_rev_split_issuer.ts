import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { ISSUER_SPLIT } = require("../../utils/constant.ts");

describe("QuadGovernance.setRevSplitIssuer", async () => {
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

  describe("setRevSplitIssuer", async () => {
    it("succeed", async () => {
      expect(await governance.revSplitIssuer()).to.equal(ISSUER_SPLIT);
      const newRevSplit = 25;
      await expect(governance.connect(admin).setRevSplitIssuer(newRevSplit))
        .to.emit(governance, "RevenueSplitIssuerUpdated")
        .withArgs(ISSUER_SPLIT, newRevSplit);

      expect(await governance.revSplitIssuer()).to.equal(newRevSplit);
    });

    it("succeed (price 0)", async () => {
      const newRevSplit = 0;
      await expect(governance.connect(admin).setRevSplitIssuer(newRevSplit))
        .to.emit(governance, "RevenueSplitIssuerUpdated")
        .withArgs(ISSUER_SPLIT, newRevSplit);

      expect(await governance.revSplitIssuer()).to.equal(newRevSplit);
    });

    it("fail (not admin)", async () => {
      const newRevSplit = 0;
      await expect(
        governance.connect(treasury).setRevSplitIssuer(newRevSplit)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (rev split already set)", async () => {
      await expect(
        governance.connect(admin).setRevSplitIssuer(ISSUER_SPLIT)
      ).to.be.revertedWith("REV_SPLIT_ALREADY_SET");
    });

    it("fail (rev split > 100)", async () => {
      await expect(
        governance.connect(admin).setRevSplitIssuer(101)
      ).to.be.revertedWith("SPLIT_TOO_HIGH");
    });
  });
});
