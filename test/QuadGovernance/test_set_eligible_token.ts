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

  const uri = "https://quadrata.com";

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
        governance.connect(admin).setEligibleTokenId(newTokenID, true, uri)
      )
        .to.emit(governance, "EligibleTokenUpdated")
        .withArgs(newTokenID, true);
      expect(await passport.uri(newTokenID)).equals(uri);
      expect(await governance.eligibleTokenId(TOKEN_ID)).to.equal(true);
      expect(await governance.eligibleTokenId(newTokenID)).to.equal(true);
      await expect(
        governance.connect(admin).setEligibleTokenId(newTokenID, false, uri)
      )
        .to.emit(governance, "EligibleTokenUpdated")
        .withArgs(newTokenID, false);
      expect(await passport.uri(newTokenID)).equals(uri);
    });

    it("success update uri", async () => {
      const newUri = "Hello";
      await governance
        .connect(admin)
        .setEligibleTokenId(TOKEN_ID, true, newUri);
      expect(await passport.uri(TOKEN_ID)).equals(newUri);
    });

    it("fail (not admin)", async () => {
      await expect(
        governance.connect(treasury).setEligibleTokenId(2, true, uri)
      ).to.be.revertedWith("INVALID_ADMIN");
    });
    it("fail (incremented by more than one)", async () => {
      await expect(
        governance.connect(admin).setEligibleTokenId(1337, true, uri)
      ).to.be.revertedWith("INCREMENT_TOKENID_BY_1");
    });
  });
});
