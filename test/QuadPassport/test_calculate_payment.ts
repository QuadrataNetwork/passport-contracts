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

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
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
  let defi: Contract; // eslint-disable-line no-unused-vars
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
      isBusiness,
      issuedAt
    );

    await passport
      .connect(issuer)
      .mintPassport(minterA.address, TOKEN_ID, did, aml, country,isBusiness, issuedAt, sig, {
        value: MINT_PRICE,
      });

    await usdc.transfer(minterA.address, parseUnits("1000", 6));
    await usdc.transfer(minterB.address, parseUnits("1000", 6));
  });

  describe("calculatePaymentToken", async () => {
    it("success (AML)", async () => {
      expect(
        await passport.calculatePaymentToken(ATTRIBUTE_AML, usdc.address, minterA.address)
      ).to.equal(0);
    });

    it("success (COUNTRY)", async () => {
      expect(
        await passport.calculatePaymentToken(ATTRIBUTE_COUNTRY, usdc.address, minterA.address)
      ).to.equal(
        parseUnits(
          PRICE_PER_ATTRIBUTES[ATTRIBUTE_COUNTRY].toString(),
          await usdc.decimals()
        )
      );
    });

    it("success (DID)", async () => {
      expect(
        await passport.calculatePaymentToken(ATTRIBUTE_DID, usdc.address, minterA.address)
      ).to.equal(
        parseUnits(
          PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID].toString(),
          await usdc.decimals()
        )
      );
    });

    it("fail - ineligible payment token", async () => {
      const ERC20 = await ethers.getContractFactory("USDC");
      const wbtc = await ERC20.deploy();
      await wbtc.deployed();
      await expect(
        passport.calculatePaymentToken(ATTRIBUTE_DID, wbtc.address, minterA.address)
      ).to.revertedWith("TOKEN_PAYMENT_NOT_ALLOWED");
    });

    it("fail - wrong erc20", async () => {
      await expect(
        passport.calculatePaymentToken(ATTRIBUTE_DID, admin.address, minterA.address)
      ).to.revertedWith("TOKEN_PAYMENT_NOT_ALLOWED");
    });

    it("fail - governance incorrectly set", async () => {
      await governance.connect(admin).updateGovernanceInPassport(admin.address);
      await expect(passport.calculatePaymentToken(ATTRIBUTE_DID, usdc.address, minterA.address))
        .to.reverted;
    });
  });

  describe("calculatePaymentETH", async () => {
    it("success (AML)", async () => {
      expect(await passport.calculatePaymentETH(ATTRIBUTE_AML, minterA.address)).to.equal(0);
    });

    it("success (COUNTRY)", async () => {
      const priceAttribute = parseEther(
        (PRICE_PER_ATTRIBUTES[ATTRIBUTE_COUNTRY] / 4000).toString()
      );
      expect(await passport.calculatePaymentETH(ATTRIBUTE_COUNTRY, minterA.address)).to.equal(
        priceAttribute
      );
    });

    it("success (DID)", async () => {
      const priceAttribute = parseEther(
        (PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
      );

      expect(await passport.calculatePaymentETH(ATTRIBUTE_DID, minterA.address)).to.equal(
        priceAttribute
      );
    });

    it("fail - governance incorrectly set", async () => {
      await governance.connect(admin).updateGovernanceInPassport(admin.address);
      await expect(passport.calculatePaymentETH(ATTRIBUTE_DID, minterA.address)).to.reverted;
    });
  });
});
