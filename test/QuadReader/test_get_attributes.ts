import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  parseEther,
  parseUnits,
  formatBytes32String,
  id,
} from "ethers/lib/utils";
import { assertGetAttributeETHExcluding, assertGetAttributeETHIncluding, assertGetAttributeETHWrapper, assertGetAttributeExcluding, assertGetAttributeFreeIncluding, assertGetAttributeFreeWrapper, assertGetAttributeIncluding, assertGetAttributeWrapper, assertMint } from "../utils/verify";
import exp from "constants";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_PER_ATTRIBUTES,
  DEACTIVATED
} = require("../../utils/constant.ts");

const {
  assertGetAttribute,
  assertGetAttributeFree,
  assertGetAttributeETH,
  assertGetAttributeFreeExcluding
} = require("../utils/verify.ts");

const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const { signMint } = require("../utils/signature.ts");

describe("QuadReader", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract;
  let usdc: Contract;
  let defi: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;

  let baseURI: string;
  let did: string;
  let aml: string;
  let country: string;
  let isBusiness: string;
  let issuedAt: number;

  beforeEach(async () => {
    baseURI = "https://quadrata.io";
    did = formatBytes32String("did:quad:123456789abcdefghi");
    aml = id("LOW");
    country = id("FRANCE");
    isBusiness = id("FALSE");
    issuedAt = Math.floor(new Date().getTime() / 1000);

    [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury] =
      await ethers.getSigners();
    [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury],
      baseURI
    );
    const sig = await signMint(
      issuer,
      minterA,
      TOKEN_ID,
      did,
      aml,
      country,
      isBusiness,
      issuedAt
    );
    const sigAccount = await signMint(
      minterA,
      minterA,
      TOKEN_ID,
      did,
      aml,
      country,
      isBusiness,
      issuedAt
    );
    await passport
      .connect(minterA)
      .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
        value: MINT_PRICE,
      });

    await usdc.transfer(minterA.address, parseUnits("1000", 6));
    await usdc.transfer(minterB.address, parseUnits("1000", 6));
  });

  describe("getAttributes", async function() {
    it('success - (all included) - DID', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(2);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(2);

      await assertGetAttributeWrapper(
        minterA,
        treasury,
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_DID,
        [did, did], // expected returned attributes
        [BigNumber.from(issuedAt), BigNumber.from(15)], // expected dates of issuance
        [issuer.address, signers[0].address], // expected issuers to be returned
        1,
        {}
      )
    })

    it('success - (all included) - COUNTRY', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);

      expect(await governance.getIssuersLength()).to.equal(3);

      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, did, id("MEDIUM"), id("UR"), id("FALSE"), 678, 1, {newIssuerMint: true});

      await assertGetAttributeWrapper(
        minterA,
        treasury,
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        [country, id("US"), id("UR")], // expected returned attributes
        [BigNumber.from(issuedAt), BigNumber.from(15), BigNumber.from(678)], // expected dates of issuance
        [issuer.address, signers[0].address, signers[1].address], // expected issuers to be returned
        1,
        {}
      )
    })


    it('success - (all included) - AML', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);

      expect(await governance.getIssuersLength()).to.equal(3);

      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, did, id("MEDIUM"), id("UR"), id("FALSE"), 678, 1, {newIssuerMint: true});
      await assertGetAttributeWrapper(
        minterA,
        treasury,
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_AML,
        [aml, id("LOW"), id("MEDIUM")], // expected returned attributes
        [BigNumber.from(issuedAt), BigNumber.from(15), BigNumber.from(678)], // expected dates of issuance
        [issuer.address, signers[0].address, signers[1].address], // expected issuers to be returned
        1,
        {assertFree: true}
      )
    })
  });

});
