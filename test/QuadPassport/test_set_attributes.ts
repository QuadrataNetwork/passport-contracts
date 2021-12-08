import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { parseUnits, formatBytes32String } from "ethers/lib/utils";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_SET_ATTRIBUTE,
} = require("../../utils/constant.ts");

const { setAttribute } = require("../utils/helper.ts");

const { assertGetAttribute } = require("../utils/verify.ts");

const {
  deployPassportAndGovernance,
} = require("../utils/deployment_and_init.ts");

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
    minterB: SignerWithAddress,
    issuer: SignerWithAddress;
  const baseURI = "https://quadrata.io";
  let sig: any;
  const did = formatBytes32String("did:quad:123456789abcdefghi");
  const aml = formatBytes32String("LOW");
  const country = formatBytes32String("FRANCE");
  const issuedAt = Math.floor(new Date().getTime() / 1000);

  beforeEach(async () => {
    [deployer, admin, minterA, minterB, issuer, treasury] =
      await ethers.getSigners();
    [governance, passport, usdc, defi] = await deployPassportAndGovernance(
      admin,
      issuer,
      treasury,
      baseURI
    );
    sig = await signMint(
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

  describe("setAttribute", async () => {
    it("success - setAttribute(AML)", async () => {
      const newAML = formatBytes32String("HIGH");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const initialBalance = await ethers.provider.getBalance(passport.address);
      await setAttribute(
        minterA,
        issuer,
        passport,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      const expectedPayment = PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML];
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance.add(expectedPayment)
      );
    });

    it("success - setAttribute(COUNTRY)", async () => {
      const newCountry = formatBytes32String("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const initialBalance = await ethers.provider.getBalance(passport.address);
      await setAttribute(
        minterA,
        issuer,
        passport,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
      );
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
      );
      const expectedPayment = PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY];
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance.add(expectedPayment)
      );
    });
  });

  describe("setAttributeIssuer", async () => {
    it("success - setAttributeIssuer(AML)", async () => {
      const newAML = formatBytes32String("HIGH");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const initialBalance = await ethers.provider.getBalance(passport.address);
      await passport
        .connect(issuer)
        .setAttributeIssuer(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          newAML,
          newIssuedAt
        );
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance
      );
    });

    it("success - setAttribute(COUNTRY)", async () => {
      const newCountry = formatBytes32String("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const initialBalance = await ethers.provider.getBalance(passport.address);
      await passport
        .connect(issuer)
        .setAttributeIssuer(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          newCountry,
          newIssuedAt
        );
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance
      );
    });
  });
});
