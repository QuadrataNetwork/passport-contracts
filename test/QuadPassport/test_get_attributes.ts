// import { expect } from "chai";
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
  assertGetAttribute,
  assertGetAttributeETH,
} = require("../utils/verify.ts");

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
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;
  const baseURI = "https://quadrata.io";
  const did = formatBytes32String("did:quad:123456789abcdefghi");
  const aml = formatBytes32String("LOW");
  const country = formatBytes32String("FRANCE");
  const issuedAt = Math.floor(new Date().getTime() / 1000);

  beforeEach(async () => {
    [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury] =
      await ethers.getSigners();
    [governance, passport, usdc, defi] = await deployPassportAndGovernance(
      admin,
      issuer,
      treasury,
      issuerTreasury,
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

  describe("getAttribute", async () => {
    it("success - getAttribute(AML)", async () => {
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
    });

    it("success - getAttribute(COUNTRY)", async () => {
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
    });

    it("success - getAttribute(DID) - Payable", async () => {
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
    });
  });

  // getAttributeETH tests
  describe("getAttributeETH", async () => {
    it("success - getAttributeETH(AML)", async () => {
      await assertGetAttributeETH(
        minterA,
        defi,
        passport,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
    });

    it("success - getAttributeETH(COUNTRY)", async () => {
      await assertGetAttributeETH(
        minterA,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
    });

    it("success - getAttributeETH(DID) - Payable", async () => {
      await assertGetAttributeETH(
        minterA,
        defi,
        passport,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
    });
  });
});
