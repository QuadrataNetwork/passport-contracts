import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { parseUnits, formatBytes32String } from "ethers/lib/utils";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
} = require("../../utils/constant.ts");

const {
  deployPassportAndGovernance,
} = require("../utils/deployment_and_init.ts");

const { assertGetAttribute } = require("../utils/verify.ts");

const { signMint } = require("../utils/signature.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let usdc: Contract;
  let defi: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress;
  const baseURI = "https://quadrata.io";
  const did = formatBytes32String("did:quad:123456789abcdefghi");
  const aml = formatBytes32String("LOW");
  const country = formatBytes32String("FRANCE");
  const issuedAt = Math.floor(new Date().getTime() / 1000);

  describe("burnPassport", async () => {
    beforeEach(async () => {
      [deployer, admin, minterA, minterB, issuer, treasury] =
        await ethers.getSigners();
      [governance, passport, usdc, defi] = await deployPassportAndGovernance(
        admin,
        issuer,
        treasury,
        baseURI
      );

      const sig = await signMint(
        issuer,
        minterA,
        TOKEN_ID,
        did,
        aml,
        country,
        issuedAt
      );

      await passport
        .connect(minterA)
        .mintPassport(TOKEN_ID, did, aml, country, issuedAt, sig, {
          value: MINT_PRICE,
        });

      await usdc.transfer(minterA.address, parseUnits("1000", 6));
      await usdc.transfer(minterB.address, parseUnits("1000", 6));
    });

    it("success - burnPassport", async () => {
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await passport.connect(minterA).burnPassport(TOKEN_ID);
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);
      await expect(
        passport.getAttribute(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });
  });
});
