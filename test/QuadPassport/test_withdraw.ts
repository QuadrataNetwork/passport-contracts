import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  parseEther,
  parseUnits,
  formatBytes32String,
  id,
} from "ethers/lib/utils";
import { ucs2 } from "punycode";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_DID,
  ISSUER_SPLIT,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_PER_ATTRIBUTES,
  PRICE_SET_ATTRIBUTE,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const { signMint } = require("../utils/signature.ts");
const { assertMint, assertSetAttribute } = require("../utils/verify.ts");

describe("QuadPassport", async () => {
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
    issuerB: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerBTreasury: SignerWithAddress;
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

    [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury, issuerB, issuerBTreasury] = await ethers.getSigners();

    [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury],
      baseURI
    );

    await governance.connect(admin).setIssuer(issuerB.address, issuerBTreasury.address);

    await usdc.transfer(minterA.address, parseUnits("1000", 6));
    await usdc.transfer(minterB.address, parseUnits("1000", 6));
  });

  describe("withdrawETH", async () => {
    it("success - after mint", async () => {
      const initialBalanceTreasury = await ethers.provider.getBalance(
        treasury.address
      );
      const initialBalanceTreasuryIssuer = await ethers.provider.getBalance(
        issuerTreasury.address
      );
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await expect(passport.withdrawETH(treasury.address)).to.revertedWith(
        "NOT_ENOUGH_BALANCE"
      );
      await passport.withdrawETH(issuerTreasury.address);
      expect(await ethers.provider.getBalance(treasury.address)).to.equal(
        initialBalanceTreasury
      );
      expect(await ethers.provider.getBalance(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer.add(MINT_PRICE)
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(0);
    });

    it("success - after setAttribute", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await passport.withdrawETH(issuerTreasury.address);
      const initialBalanceTreasury = await ethers.provider.getBalance(
        treasury.address
      );
      const initialBalanceTreasuryIssuer = await ethers.provider.getBalance(
        issuerTreasury.address
      );
      const newAML = id("HIGH");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      await assertSetAttribute(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      await expect(passport.withdrawETH(treasury.address)).to.revertedWith(
        "NOT_ENOUGH_BALANCE"
      );
      await passport.withdrawETH(issuerTreasury.address);
      expect(await ethers.provider.getBalance(treasury.address)).to.equal(
        initialBalanceTreasury
      );
      expect(await ethers.provider.getBalance(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer.add(PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML])
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(0);
    });

    it("success - after getAttribute(Free)", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await passport.withdrawETH(issuerTreasury.address);
      await defi.connect(minterA).doSomethingFree(ATTRIBUTE_AML);
      await expect(passport.withdrawETH(treasury.address)).to.revertedWith(
        "NOT_ENOUGH_BALANCE"
      );
      await expect(
        passport.withdrawETH(issuerTreasury.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });

    it("success - after getAttribute(Payable)", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceTreasury = await ethers.provider.getBalance(
        treasury.address
      );
      const initialBalanceTreasuryIssuer = await ethers.provider.getBalance(
        issuerTreasury.address
      );

      const priceAttribute = parseEther(
        (PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
      );
      await defi
        .connect(minterA)
        .doSomethingETH(ATTRIBUTE_DID, { value: priceAttribute });

      const expectedWithdrawAmount = priceAttribute.mul(ISSUER_SPLIT).div(100);
      // Withdraw for Protocol Treasury
      await passport.withdrawETH(treasury.address);
      expect(await ethers.provider.getBalance(treasury.address)).to.equal(
        initialBalanceTreasury.add(expectedWithdrawAmount)
      );
      expect(await ethers.provider.getBalance(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        priceAttribute.sub(expectedWithdrawAmount)
      );

      // Withdraw for Issuer Treasury
      await passport.withdrawETH(issuerTreasury.address);
      expect(await ethers.provider.getBalance(treasury.address)).to.equal(
        initialBalanceTreasury.add(expectedWithdrawAmount)
      );
      expect(await ethers.provider.getBalance(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer.add(expectedWithdrawAmount)
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(0);
    });

    it("fail - withdraw to address(0)", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await expect(
        passport.withdrawETH(ethers.constants.AddressZero)
      ).to.revertedWith("WITHDRAW_ADDRESS_ZERO");
    });
    it("fail - withdraw to non valid issuer or treasury", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await expect(passport.withdrawETH(admin.address)).to.revertedWith(
        "NOT_ENOUGH_BALANCE"
      );
    });
    it("fail - withdraw balance 0", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await passport.withdrawETH(issuerTreasury.address);
      await expect(
        passport.withdrawETH(issuerTreasury.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });
  });

  describe("withdrawToken", async () => {
    it("success - after getAttribute(Free)", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await passport.withdrawETH(issuerTreasury.address);
      await defi.connect(minterA).doSomethingFree(ATTRIBUTE_AML);
      await expect(
        passport.withdrawToken(treasury.address, usdc.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
      await expect(
        passport.withdrawToken(issuerTreasury.address, usdc.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });
    it("success - after getAttribute(Payable)", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      const initialBalanceTreasury = await usdc.balanceOf(treasury.address);
      const initialBalanceTreasuryIssuer = await usdc.balanceOf(
        issuerTreasury.address
      );
      const priceAttribute = parseUnits(
        PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID].toString(),
        await usdc.decimals()
      );
      await usdc.connect(minterA).approve(defi.address, priceAttribute);
      await defi.connect(minterA).doSomething(ATTRIBUTE_DID, usdc.address);

      const expectedWithdrawAmount = priceAttribute.mul(ISSUER_SPLIT).div(100);
      // Withdraw for Protocol Treasury
      await passport.withdrawToken(treasury.address, usdc.address);
      expect(await usdc.balanceOf(treasury.address)).to.equal(
        initialBalanceTreasury.add(expectedWithdrawAmount)
      );
      expect(await usdc.balanceOf(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer
      );
      expect(await usdc.balanceOf(passport.address)).to.equal(
        priceAttribute.sub(expectedWithdrawAmount)
      );

      // Withdraw for Issuer Treasury
      await passport.withdrawToken(issuerTreasury.address, usdc.address);
      expect(await usdc.balanceOf(treasury.address)).to.equal(
        initialBalanceTreasury.add(expectedWithdrawAmount)
      );
      expect(await usdc.balanceOf(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer.add(expectedWithdrawAmount)
      );
      expect(await usdc.balanceOf(passport.address)).to.equal(0);
    });

    it("success - after deactivated issuer withdrawToken", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      const initialBalanceTreasury = await usdc.balanceOf(
        treasury.address
      );
      const initialBalanceTreasuryIssuer = await usdc.balanceOf(
        issuerTreasury.address
      );

      const priceAttribute = await reader.calculatePaymentToken(ATTRIBUTE_DID, usdc.address, minterA.address);

      await usdc.connect(minterA).approve(defi.address, priceAttribute);
      await defi.connect(minterA).doSomething(ATTRIBUTE_DID, usdc.address);

      // deactivate the issuer
      await governance.connect(admin).setIssuerStatus(issuer.address, 1);

      const expectedWithdrawAmount = priceAttribute.mul(ISSUER_SPLIT).div(100);
      // Withdraw for Protocol Treasury
      await passport.withdrawToken(treasury.address, usdc.address);
      expect(await usdc.balanceOf(treasury.address)).to.equal(
        initialBalanceTreasury.add(expectedWithdrawAmount)
      );
      expect(await usdc.balanceOf(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer
      );
      expect(await usdc.balanceOf(passport.address)).to.equal(
        priceAttribute.sub(expectedWithdrawAmount)
      );

      // Withdraw for Issuer Treasury
      await passport.withdrawToken(issuerTreasury.address, usdc.address);
      expect(await usdc.balanceOf(treasury.address)).to.equal(
        initialBalanceTreasury.add(expectedWithdrawAmount)
      );
      expect(await usdc.balanceOf(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer.add(expectedWithdrawAmount)
      );
      expect(await usdc.balanceOf(passport.address)).to.equal(0);
    });

    it("success - after updated issuerTreasury withdrawToken", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      const initialBalanceTreasury = await usdc.balanceOf(
        treasury.address
      );
      const initialBalanceTreasuryIssuer = await usdc.balanceOf(
        issuerTreasury.address
      );

      const priceAttribute = await reader.calculatePaymentToken(ATTRIBUTE_DID, usdc.address, minterA.address);

      await usdc.connect(minterA).approve(defi.address, priceAttribute);
      await defi.connect(minterA).doSomething(ATTRIBUTE_DID, usdc.address);

      // update the issuer treaz
      const newIssuerTreasury = ethers.Wallet.createRandom();
      await governance.connect(admin).setIssuer(issuer.address, newIssuerTreasury.address);

      const expectedWithdrawAmount = priceAttribute.mul(ISSUER_SPLIT).div(100);
      // Withdraw for Protocol Treasury
      await passport.withdrawToken(treasury.address, usdc.address);
      expect(await usdc.balanceOf(treasury.address)).to.equal(
        initialBalanceTreasury.add(expectedWithdrawAmount)
      );
      expect(await usdc.balanceOf(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer
      );
      expect(await usdc.balanceOf(passport.address)).to.equal(
        priceAttribute.sub(expectedWithdrawAmount)
      );

      // Withdraw for Issuer Treasury
      await passport.withdrawToken(issuerTreasury.address, usdc.address);
      expect(await usdc.balanceOf(treasury.address)).to.equal(
        initialBalanceTreasury.add(expectedWithdrawAmount)
      );
      expect(await usdc.balanceOf(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer.add(expectedWithdrawAmount)
      );
      expect(await usdc.balanceOf(passport.address)).to.equal(0);
      expect(await usdc.balanceOf(newIssuerTreasury.address)).to.equal(0);
    });

    it("success - after multi-issuer getAttribute(Payable)", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await assertMint(
        minterA,
        issuerB,
        issuerBTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt,
        TOKEN_ID,
        {newIssuerMint: true}
      );

      const initialBalanceTreasury = await usdc.balanceOf(
        treasury.address
      );
      const initialBalanceTreasuryIssuer = await usdc.balanceOf(
        issuerTreasury.address
      );

      const initialBalancePassport = await usdc.balanceOf(
        passport.address
      );

      const priceAttribute = await reader.calculatePaymentToken(ATTRIBUTE_DID, usdc.address, minterA.address);
      await usdc.connect(minterA).approve(defi.address, priceAttribute);
      await defi.connect(minterA).doSomething(ATTRIBUTE_DID, usdc.address);
      const expectedWithdrawAmount = priceAttribute.mul(ISSUER_SPLIT).div(100);
      const expectedAmountPerIssuer = expectedWithdrawAmount.div(2);


      // Withdraw for Protocol Treasury
      await passport.withdrawToken(treasury.address, usdc.address);
      expect(await usdc.balanceOf(treasury.address)).to.equal(
        initialBalanceTreasury.add(expectedWithdrawAmount)
      );
      expect(await usdc.balanceOf(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer
      );
      expect(await usdc.balanceOf(passport.address)).to.equal(
        initialBalancePassport.add(priceAttribute.sub(expectedWithdrawAmount))
      );

      // Withdraw for Issuer Treasury
      await passport.withdrawToken(issuerTreasury.address, usdc.address);
      expect(await usdc.balanceOf(treasury.address)).to.equal(
        initialBalanceTreasury.add(expectedWithdrawAmount)
      );
      expect(await usdc.balanceOf(issuerTreasury.address)).to.equal(
        initialBalanceTreasuryIssuer.add(expectedAmountPerIssuer)
      );

      // we expect to have enough eth left in the passport to account for issuerB as they did not withdraw
      expect(await usdc.balanceOf(passport.address)).to.equal(expectedAmountPerIssuer);
    });

    it("fail - withdraw to address(0)", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await expect(
        passport.withdrawToken(ethers.constants.AddressZero, usdc.address)
      ).to.revertedWith("WITHDRAW_ADDRESS_ZERO");
    });

    it("fail - withdraw to non valid issuer or treasury (a random user)", async () => {
      const randoUser = ethers.Wallet.createRandom();

      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await expect(
        passport.withdrawToken(randoUser.address, usdc.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });

    it("fail - withdraw to non valid issuer or treasury as issuerTreasury after COUNTRY query", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      const priceAttribute = await reader.calculatePaymentETH(ATTRIBUTE_DID, minterA.address);
      await defi.connect(minterA).doSomethingETH(ATTRIBUTE_DID, { value: priceAttribute });

      await expect(passport.connect(issuerTreasury).withdrawToken(admin.address, usdc.address)).to.revertedWith(
        "NOT_ENOUGH_BALANCE"
      );

      await expect(passport.connect(treasury).withdrawToken(admin.address, usdc.address)).to.revertedWith(
        "NOT_ENOUGH_BALANCE"
      );
    });

    it("fail - withdraw balance 0", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await expect(
        passport.withdrawToken(issuerTreasury.address, usdc.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });
  });
});
