import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  id,
  parseEther,
  parseUnits,
  formatBytes32String,
} from "ethers/lib/utils";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_SET_ATTRIBUTE,
} = require("../../utils/constant.ts");

const { signSetAttribute } = require("../utils/signature.ts");

const {
  assertGetAttribute,
  assertSetAttribute,
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
  let baseURI: string;
  let did: string;
  let aml: string;
  let country: string;
  let issuedAt: number;

  beforeEach(async () => {
    baseURI = "https://quadrata.io";
    did = formatBytes32String("did:quad:123456789abcdefghi");
    aml = id("LOW");
    country = id("FRANCE");
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
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      // OK Fetching old value
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      // OK Fetching old value
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

    it("success - setAttribute(COUNTRY)", async () => {
      const newCountry = id("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const initialBalance = await ethers.provider.getBalance(passport.address);
      await assertSetAttribute(
        minterA,
        issuer,
        issuerTreasury,
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

      // OK Fetching old value
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      // OK Fetching old value
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
      const expectedPayment = PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY];
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance.add(expectedPayment)
      );
    });

    it("success - mintPricePerAttribute(0)", async () => {
      await passport.withdrawETH(issuerTreasury.address);
      await governance
        .connect(admin)
        .setAttributeMintPrice(ATTRIBUTE_AML, parseEther("0"));

      const newAML = id("HIGH");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);

      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      await passport
        .connect(minterA)
        .setAttribute(TOKEN_ID, ATTRIBUTE_AML, newAML, newIssuedAt, sig, {
          value: parseEther("0"),
        });
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(0);

      await expect(
        passport.callStatic.withdrawETH(issuerTreasury.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });

    it("succes - two issuers", async () => {
      const issuerB = ethers.Wallet.createRandom();
      const issuerBTreasury = ethers.Wallet.createRandom();
      await governance
        .connect(admin)
        .addIssuer(issuerB.address, issuerBTreasury.address);
      // Update Country with Issuer 1
      const newCountry = id("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      await assertSetAttribute(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
      );

      await passport.withdrawETH(issuerTreasury.address);

      // Update AML with Issuer 2
      const newAML = id("MEDIUM");
      await assertSetAttribute(
        minterA,
        issuerB,
        issuerBTreasury,
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

      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
      );
    });

    it("succes - change issuer treasury", async () => {
      await passport.withdrawETH(issuerTreasury.address);
      const newIssuerTreasury = ethers.Wallet.createRandom();
      await governance
        .connect(admin)
        .addIssuer(issuer.address, newIssuerTreasury.address);

      const newCountry = id("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      await assertSetAttribute(
        minterA,
        issuer,
        newIssuerTreasury,
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

      await expect(
        passport.withdrawETH(issuerTreasury.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });

    it("fail - setAttribute(DID)", async () => {
      const newDid = formatBytes32String("did:1:newdid");
      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_DID,
        newDid,
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(TOKEN_ID, ATTRIBUTE_DID, newDid, issuedAt, sig, {
            value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_DID],
          })
      ).to.revertedWith("MUST_BURN_AND_MINT");
    });

    it("fail - passport tokenId invalid", async () => {
      const newCountry = id("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const invalidTokenId = 2;
      const sig = await signSetAttribute(
        issuer,
        minterA,
        invalidTokenId,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(
            invalidTokenId,
            ATTRIBUTE_COUNTRY,
            newCountry,
            newIssuedAt,
            sig,
            { value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY] }
          )
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - no passport", async () => {
      const newCountry = id("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const sig = await signSetAttribute(
        issuer,
        minterB,
        TOKEN_ID,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
      );
      await expect(
        passport
          .connect(minterB)
          .setAttribute(
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            newCountry,
            newIssuedAt,
            sig,
            { value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY] }
          )
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - attribute not eligible", async () => {
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        true
      );
      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        false
      );
      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(TOKEN_ID, ATTRIBUTE_COUNTRY, country, issuedAt, sig, {
            value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY],
          })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - invalid mint price per attribute", async () => {
      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(TOKEN_ID, ATTRIBUTE_COUNTRY, country, issuedAt, sig, {
            value: parseEther("1"),
          })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - signature already used", async () => {
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
      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(TOKEN_ID, ATTRIBUTE_AML, newAML, newIssuedAt, sig, {
            value: PRICE_SET_ATTRIBUTE(ATTRIBUTE_AML),
          })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - using someone else signature", async () => {});

    it("fail - not issuer role", async () => {});

    it("fail - invalid sig (tokenId)", async () => {});

    it("fail - invalid sig (attribute type)", async () => {});

    it("fail - invalid sig (attribute value)", async () => {});

    it("fail - invalid sig (issuedAt)", async () => {});
  });

  describe("setAttributeIssuer", async () => {
    it("success - setAttributeIssuer(AML)", async () => {
      const newAML = id("HIGH");
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
      const newCountry = id("USA");
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

    it("success - accurate balance", async () => {});

    it("succes - two issuers", async () => {});

    it("fail - passport tokenId invalid", async () => {});

    it("fail - no passport", async () => {});

    it("fail - attribute not eligible", async () => {});

    it("fail - invalid issuer role", async () => {});

    it("fail - setAttribute(DID)", async () => {
      const newDid = formatBytes32String("did:1:newdid");
      await expect(
        passport
          .connect(issuer)
          .setAttributeIssuer(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_DID,
            newDid,
            issuedAt
          )
      ).to.revertedWith("MUST_BURN_AND_MINT");
    });
  });
});
