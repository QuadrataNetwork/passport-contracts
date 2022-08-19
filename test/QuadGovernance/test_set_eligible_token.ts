import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { TOKEN_ID } = require("../../utils/constant.ts");

describe("QuadGovernance.setEligibleTokenId", async () => {
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

  describe("setEligibleTokenId", async () => {
    it("succeed", async () => {
      const newTokenID = 2;
      expect(await governance.eligibleTokenId(TOKEN_ID)).to.equal(true);
      expect(await governance.eligibleTokenId(newTokenID)).to.equal(false);
      await expect(
        governance.connect(admin).setEligibleTokenId(newTokenID, true)
      )
        .to.emit(governance, "EligibleTokenUpdated")
        .withArgs(newTokenID, true);
      expect(await governance.eligibleTokenId(TOKEN_ID)).to.equal(true);
      expect(await governance.eligibleTokenId(newTokenID)).to.equal(true);
      await expect(
        governance.connect(admin).setEligibleTokenId(newTokenID, false)
      )
        .to.emit(governance, "EligibleTokenUpdated")
        .withArgs(newTokenID, false);
    });

    it("fail (not admin)", async () => {
      await expect(governance.setEligibleTokenId(2, true)).to.be.revertedWith(
        "INVALID_ADMIN"
      );
    });

    it("fail (token status already set)", async () => {
      await expect(
        governance.connect(admin).setEligibleTokenId(TOKEN_ID, true)
      ).to.be.revertedWith("TOKEN_ELIGIBILITY_ALREADY_SET");
    });

    it("fail (incremented by more than one)", async () => {
      await expect(
        governance.connect(admin).setEligibleTokenId(1337, true)
      ).to.be.revertedWith("INCREMENT_TOKENID_BY_1");
    });
  });
});
