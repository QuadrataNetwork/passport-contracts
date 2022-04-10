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
import { assertMint } from "../utils/verify";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_SET_ATTRIBUTE,
  ATTRIBUTE_IS_BUSINESS,
  PRICE_PER_BUSINESS_ATTRIBUTES
} = require("../../utils/constant.ts");

const { signSetAttribute } = require("../utils/signature.ts");

const {
  assertGetAttribute,
  assertGetAttributeFree,
  assertSetAttribute,
} = require("../utils/verify.ts");

const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const { signMint } = require("../utils/signature.ts");

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
    issuerTreasury: SignerWithAddress,
    issuerB: SignerWithAddress,
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
    issuedAt = 1000;

    [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury, issuerB, issuerBTreasury] =
      await ethers.getSigners();
    [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
      admin,
      [issuer, issuerB],
      treasury,
      [issuerTreasury, issuerBTreasury],
      baseURI
    );

    await governance.connect(admin).setBusinessAttributePrice(ATTRIBUTE_COUNTRY, parseUnits(PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY].toString(), 6))
    await governance.connect(admin).setBusinessAttributePrice(ATTRIBUTE_DID, parseUnits(PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID].toString(), 6))


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
      .connect(minterA)
      .mintPassport(minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt, sig, {
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
      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      // OK Fetching old value
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      // OK Fetching old value
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
    });

    it("success - setAttribute(IS_BUSINESS) EOA", async () => {
      const newIsBusiness = id("TRUE");
      const newIssuedAt = 1010;
      await assertSetAttribute(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        ATTRIBUTE_IS_BUSINESS,
        newIsBusiness,
        newIssuedAt
      );
      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_IS_BUSINESS,
        newIsBusiness,
        newIssuedAt
      );

      // OK Fetching old value
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      // OK Fetching old value
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
    });

    it("success - setAttribute(IS_BUSINESS) Smart Contract", async () => {
      const newIsBusiness = id("FALSE");

      const MockBusiness = await ethers.getContractFactory('MockBusiness')
      const mockBusiness = await MockBusiness.deploy(defi.address)
      await mockBusiness.deployed()

      const sigBusiness = await signMint(
        issuer,
        mockBusiness,
        TOKEN_ID,
        did,
        aml,
        country,
        id("TRUE"),
        issuedAt
      );

      await passport
        .connect(minterA)
        .mintPassport(mockBusiness.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt, sigBusiness, {
          value: MINT_PRICE,
        });

      await assertSetAttribute(
        mockBusiness,
        issuer,
        issuerTreasury,
        passport,
        ATTRIBUTE_IS_BUSINESS,
        newIsBusiness,
        issuedAt,
        {signer: minterA}
      );
      await assertGetAttributeFree(
        [issuer.address],
        mockBusiness,
        defi,
        passport,
        reader,
        ATTRIBUTE_IS_BUSINESS,
        newIsBusiness,
        issuedAt,
        1,
        { signer: minterA,
          isContract: true
        }
      );

      // OK Fetching old value
      await assertGetAttribute(
        mockBusiness,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt,
        1,
        {signer: minterA}
      );
      // OK Fetching old value
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_DID,
        did,
        issuedAt,
        1,
        {signer: minterA}
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
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
      );

      // OK Fetching old value
      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      // OK Fetching old value
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
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
        .setAttribute(minterA.address, TOKEN_ID, ATTRIBUTE_AML, newAML, newIssuedAt, sig, {
          value: parseEther("0"),
        });
      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(0);

      await expect(
        passport.callStatic.withdrawETH(issuerTreasury.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });

    it("success - two issuers", async () => {

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
      console.log("checkpoint 1#")
      const sig = await signMint(
        issuerB,
        minterA,
        1,
        id("DID_34"),
        aml,
        country,
        isBusiness,
        issuedAt
      );

      await passport
      .connect(minterA)
      .mintPassport(minterA.address, 1, id("DID_34"), aml, country, isBusiness, issuedAt, sig, {
        value: MINT_PRICE,
      });
      console.log("checkpoint 2#")

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
      console.log("checkpoint 3#")

      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      console.log("checkpoint 4#")

      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt,
        1,
        {
          validIssuerCount: 2
        }

        //TODO: assert values from all issuers
        //TODO: Make verify functions for all getAttributes and the corresponding DeFi doSomethings...
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
        treasury,
        issuer,
        newIssuerTreasury,
        usdc,
        defi,
        passport,
        reader,
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
          .setAttribute(minterA.address, TOKEN_ID, ATTRIBUTE_DID, newDid, issuedAt, sig, {
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
            minterA.address,
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
            minterB.address,
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
          .setAttribute(minterA.address, TOKEN_ID, ATTRIBUTE_COUNTRY, country, issuedAt, sig, {
            value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY],
          })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
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
          .setAttribute(minterA.address, TOKEN_ID, ATTRIBUTE_COUNTRY, country, issuedAt, sig, {
            value: parseEther("1"),
          })
      ).to.revertedWith("INVALID_ATTR_MINT_PRICE");
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
          .setAttribute(minterA.address, TOKEN_ID, ATTRIBUTE_AML, newAML, newIssuedAt, sig, {
            value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
          })
      ).to.revertedWith("SIGNATURE_ALREADY_USED");
    });

    it("success - anyone may sign for minterB", async () => {
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
          .connect(minterB)
          .setAttribute(minterA.address, TOKEN_ID, ATTRIBUTE_AML, newAML, newIssuedAt, sig, {
            value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
          })
    });

    it("fail - not issuer role", async () => {
      const newIssuer = ethers.Wallet.createRandom();
      const newAML = id("HIGH");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const sig = await signSetAttribute(
        newIssuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(minterA.address, TOKEN_ID, ATTRIBUTE_AML, newAML, newIssuedAt, sig, {
            value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
          })
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid sig (tokenId)", async () => {
      const wrongTokenId = 2;
      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(minterA.address, wrongTokenId, ATTRIBUTE_AML, aml, issuedAt, sig, {
            value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
          })
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid sig (attribute type)", async () => {
      const wrongAttribute = ATTRIBUTE_COUNTRY;
      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(minterA.address, TOKEN_ID, wrongAttribute, aml, issuedAt, sig, {
            value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
          })
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid sig (attribute value)", async () => {
      const wrongAML = id("HIGH");
      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(minterA.address, TOKEN_ID, ATTRIBUTE_AML, wrongAML, issuedAt, sig, {
            value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
          })
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid sig (issuedAt)", async () => {
      const wrongIssuedAt = issuedAt + 1;
      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(minterA.address, TOKEN_ID, ATTRIBUTE_AML, aml, wrongIssuedAt, sig, {
            value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
          })
      ).to.revertedWith("INVALID_ISSUER");
    });
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
      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance
      );
    });

    it("success - setAttribute(COUNTRY)", async () => {
      await passport.withdrawETH(issuerTreasury.address);
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
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance
      );
      await expect(
        passport.withdrawETH(issuerTreasury.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });

    it("success - two issuers (issuers may not overwrite each other)", async () => {

      let newCountry = id("USA");
      let newIssuedAt = Math.floor(new Date().getTime() / 1000);

      // Update Country with Issuer 1
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
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
      );

      const newIssuedAt2 = Math.floor(new Date().getTime() / 1000) + 100;

      // Update Country with Issuer 2
      await passport
        .connect(issuerB)
        .setAttributeIssuer(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          id("FRANCE"),
          newIssuedAt2
        );

      // minterA now has attributes from both issuers
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt,
        1,
        {validIssuerCount: 2}

        //TODO: assert values from all issuers
      );
    });

    it("fail - passport tokenId invalid", async () => {
      const newCountry = id("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const wrongTokenId = 2;

      await expect(
        passport
          .connect(issuer)
          .setAttributeIssuer(
            minterA.address,
            wrongTokenId,
            ATTRIBUTE_COUNTRY,
            newCountry,
            newIssuedAt
          )
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - no passport", async () => {
      const newCountry = id("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);

      await expect(
        passport
          .connect(issuer)
          .setAttributeIssuer(
            minterB.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            newCountry,
            newIssuedAt
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
      const newCountry = id("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);

      await expect(
        passport
          .connect(issuer)
          .setAttributeIssuer(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            newCountry,
            newIssuedAt
          )
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - invalid issuer role", async () => {
      const newCountry = id("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      await expect(
        passport
          .connect(admin)
          .setAttributeIssuer(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            newCountry,
            newIssuedAt
          )
      ).to.revertedWith("INVALID_ISSUER");
    });

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
