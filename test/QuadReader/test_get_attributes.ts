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
    await usdc.connect(minterA).approve(reader.address, parseUnits("1000", 6));
  });

  describe("getAttributes", async function() {
    it('success', async () => {
      await reader.connect(minterA).getAttributes(minterA.address, 1, ATTRIBUTE_DID, usdc.address);
    })
  });

  describe("getAttributesFree", async function() {
    it('success', async () => {
      await reader.connect(minterA).getAttributesFree(minterA.address, 1, ATTRIBUTE_AML);
    })
  });

  describe("getAttributesExcluding", async function() {
    it('success', async () => {
      await reader.connect(minterA).getAttributesExcluding(minterA.address, 1, ATTRIBUTE_DID, usdc.address, []);
    })
  });
});
