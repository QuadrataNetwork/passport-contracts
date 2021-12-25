import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { parseEther, parseUnits, formatBytes32String } from "ethers/lib/utils";

const {
  ATTRIBUTE_DID,
  ISSUER_SPLIT,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_PER_ATTRIBUTES,
} = require("../../utils/constant.ts");

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
  let sig: any;
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

  describe("withdrawETH", async () => {
    it("success (treasury)", async () => {
      const initialBalance = await ethers.provider.getBalance(treasury.address);
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        MINT_PRICE
      );
      const priceAttribute = parseEther(
        (PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
      );
      await defi
        .connect(minterA)
        .doSomethingETH(ATTRIBUTE_DID, { value: priceAttribute });
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        MINT_PRICE.add(priceAttribute)
      );
      const initialBalancePassport = await ethers.provider.getBalance(
        passport.address
      );
      await passport.withdrawETH(treasury.address);
      const expectedWithdrawAmount = priceAttribute.mul(ISSUER_SPLIT).div(100);
      expect(await ethers.provider.getBalance(treasury.address)).to.equal(
        initialBalance.add(expectedWithdrawAmount)
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalancePassport.sub(expectedWithdrawAmount)
      );
    });

    it("success (issuer)", async () => {
      const initialBalance = await ethers.provider.getBalance(issuer.address);
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        MINT_PRICE
      );
      const priceAttribute = parseEther(
        (PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
      );
      await defi
        .connect(minterA)
        .doSomethingETH(ATTRIBUTE_DID, { value: priceAttribute });
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        MINT_PRICE.add(priceAttribute)
      );
      const initialBalancePassport = await ethers.provider.getBalance(
        passport.address
      );
      await passport.withdrawETH(issuer.address);
      const expectedWithdrawAmount = priceAttribute
        .mul(ISSUER_SPLIT)
        .div(100)
        .add(MINT_PRICE);
      expect(await ethers.provider.getBalance(issuer.address)).to.equal(
        initialBalance.add(expectedWithdrawAmount)
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalancePassport.sub(expectedWithdrawAmount)
      );
    });
  });

  describe("withdrawToken", async () => {
    it("success (treasury) - USDC", async () => {
      const priceAttribute = parseUnits(
        PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID].toString(),
        await usdc.decimals()
      );
      await usdc.connect(minterA).approve(defi.address, priceAttribute);
      await defi.connect(minterA).doSomething(ATTRIBUTE_DID, usdc.address);
      expect(await usdc.balanceOf(passport.address)).to.equal(priceAttribute);
      const initialBalancePassport = await usdc.balanceOf(passport.address);
      await passport.withdrawToken(treasury.address, usdc.address);
      const expectedWithdrawAmount = priceAttribute.mul(ISSUER_SPLIT).div(100);
      expect(await usdc.balanceOf(treasury.address)).to.equal(
        expectedWithdrawAmount
      );
      expect(await usdc.balanceOf(passport.address)).to.equal(
        initialBalancePassport.sub(expectedWithdrawAmount)
      );
    });

    it("success (issuer)", async () => {
      const priceAttribute = parseUnits(
        PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID].toString(),
        await usdc.decimals()
      );
      await usdc.connect(minterA).approve(defi.address, priceAttribute);
      await defi.connect(minterA).doSomething(ATTRIBUTE_DID, usdc.address);
      expect(await usdc.balanceOf(passport.address)).to.equal(priceAttribute);
      const initialBalancePassport = await usdc.balanceOf(passport.address);
      await passport.withdrawToken(issuer.address, usdc.address);
      const expectedWithdrawAmount = priceAttribute.mul(ISSUER_SPLIT).div(100);
      expect(await usdc.balanceOf(issuer.address)).to.equal(
        expectedWithdrawAmount
      );
      expect(await usdc.balanceOf(passport.address)).to.equal(
        initialBalancePassport.sub(expectedWithdrawAmount)
      );
    });
  });
});
