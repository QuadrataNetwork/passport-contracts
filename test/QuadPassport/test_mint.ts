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
import { read } from "fs";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_PER_BUSINESS_ATTRIBUTES,
} = require("../../utils/constant.ts");
const { signMint } = require("../utils/signature.ts");
const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");
const {
  assertMint,
  assertGetAttribute,
  assertGetAttributeFree,
} = require("../utils/verify.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract;
  let usdc: Contract;
  let defi: Contract;
  let mockBusiness: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
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

  describe("mintPassport", async () => {
    beforeEach(async () => {
      baseURI = "https://quadrata.io";
      did = formatBytes32String("did:quad:123456789abcdefghi");
      aml = id("LOW");
      country = id("FRANCE");
      isBusiness = id("FALSE");
      issuedAt = Math.floor(new Date().getTime() / 1000);

      [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury, issuerB, issuerBTreasury] =
        await ethers.getSigners();
      [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
        admin,
        [issuer, issuerB],
        treasury,
        [issuerTreasury, issuerBTreasury],
        baseURI
      );

      const MockBusiness = await ethers.getContractFactory('MockBusiness')
      mockBusiness = await MockBusiness.deploy(defi.address)
      await mockBusiness.deployed()

      await governance.connect(admin).setBusinessAttributePrice(ATTRIBUTE_COUNTRY, parseUnits(PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY].toString(), 6))
      await governance.connect(admin).setBusinessAttributePrice(ATTRIBUTE_DID, parseUnits(PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID].toString(), 6))

      await usdc.transfer(minterA.address, parseUnits("1000", 6));
      await usdc.transfer(minterB.address, parseUnits("1000", 6));
    });

    it("success mint", async () => {
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

    it("success - mint multiple passports with same DID", async () => {
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
        minterB,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      for (const wallet of [minterA, minterB]) {
        await assertGetAttributeFree(
          [issuer.address],
          wallet,
          defi,
          passport,
          reader,
          ATTRIBUTE_AML,
          aml,
          issuedAt
        );
        await assertGetAttribute(
          wallet,
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
        await assertGetAttribute(
          wallet,
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
      }
    });

    it("success - two issuers may mint multiple passports with same DID", async () => {

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
      await passport.connect(issuer).withdrawETH(issuerTreasury.address);

      await assertMint(
        minterB,
        issuerB,
        issuerBTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await passport.connect(issuerB).withdrawETH(issuerBTreasury.address);

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

      await assertGetAttributeFree(
        [issuerB.address],
        minterB,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        aml,
        issuedAt
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
        country,
        issuedAt
      );

      await assertGetAttribute(
        minterB,
        treasury,
        issuerB,
        issuerBTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
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
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
      await assertGetAttribute(
        minterB,
        treasury,
        issuerB,
        issuerBTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
    });

    it("success mint -- EOA that is a business", async () => {
      await assertMint(
        minterB,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        id("TRUE"),
        issuedAt
      );
      await assertGetAttributeFree(
        [issuer.address],
        minterB,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      await assertGetAttribute(
        minterB,
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
      await assertGetAttribute(
        minterB,
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

    it("success - mint with mint price (0)", async () => {
      await governance.connect(admin).setMintPrice(0);
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
          value: parseEther("0"),
        });
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      expect(await passport.provider.getBalance(passport.address)).to.equal(0);
      await expect(
        passport.withdrawETH(issuerTreasury.address)
      ).to.be.revertedWith("NOT_ENOUGH_BALANCE");
    });

    it("success - aml (high)", async () => {
      aml = id("HIGH");
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

    it("success - same wallet, different tokenIds", async () => {
      const newTokenId = 2;
      await governance.connect(admin).setEligibleTokenId(newTokenId, true);

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
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt,
        newTokenId
      );
      for (const tokenId of [TOKEN_ID, newTokenId]) {
        await assertGetAttributeFree(
          [issuer.address],
          minterA,
          defi,
          passport,
          reader,
          ATTRIBUTE_AML,
          aml,
          issuedAt,
          tokenId
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
          country,
          issuedAt,
          tokenId
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
          ATTRIBUTE_DID,
          did,
          issuedAt,
          tokenId
        );
      }
    });

    it("success - change of issuer treasury", async () => {
      const newIssuerTreasury = ethers.Wallet.createRandom();
      await governance
        .connect(admin)
        .setIssuer(issuer.address, newIssuerTreasury.address);

      await assertMint(
        minterA,
        issuer,
        newIssuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

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
        country,
        issuedAt
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
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
      await expect(
        passport.withdrawETH(issuerTreasury.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });

    it("fail - invalid mint Price", async () => {
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
      const wrongMintPrice = parseEther("1");

      await expect(
        passport
          .connect(minterA)
          .mintPassport(minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt, sig, {
            value: wrongMintPrice,
          })
      ).to.be.revertedWith("INVALID_MINT_PRICE");
    });

    it("fail - invalid tokenId", async () => {
      const badTokenId = 1337;
      const sig = await signMint(
        issuer,
        minterA,
        badTokenId,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .mintPassport(minterA.address, badTokenId, did, aml, country, isBusiness, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - passport already exists", async () => {
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

      const sig = await signMint(
        issuer,
        minterA,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt + 1
      );
      await expect(
        passport
          .connect(minterA)
          .mintPassport(minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("SIGNATURE_ALREADY_USED");
    });

    it("fail - passport already exists - two diff issuers", async () => {
      const issuerB = ethers.Wallet.createRandom();
      const issuerBTreasury = ethers.Wallet.createRandom();
      await governance
        .connect(admin)
        .setIssuer(issuerB.address, issuerBTreasury.address);

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

      const sig = await signMint(
        issuerB,
        minterA,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt + 1
      );
      await expect(
        passport
          .connect(minterA)
          .mintPassport(minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("SIGNATURE_ALREADY_USED");
    });

    it("fail - invalid hash (wrong aml)", async () => {
      const wrongAML = id("HIGH");
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
      await expect(
        passport
          .connect(minterA)
          .mintPassport(minterA.address, TOKEN_ID, did, wrongAML, country, isBusiness, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid hash (wrong aml)", async () => {
      const wrongAML = id("HIGH");
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
      await expect(
        passport
          .connect(minterA)
          .mintPassport(minterA.address, TOKEN_ID, did, wrongAML, country, isBusiness, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid hash (wrong country)", async () => {
      const wrongCountry = id("USA");
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
      await expect(
        passport
          .connect(minterA)
          .mintPassport(minterA.address, TOKEN_ID, did, aml, wrongCountry, isBusiness, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid hash (issuedAt)", async () => {
      const wrongIssuedAt = Math.floor(new Date().getTime() / 1000) + 1;
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
      await expect(
        passport
          .connect(minterA)
          .mintPassport(minterA.address, TOKEN_ID, did, aml, country, isBusiness, wrongIssuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid hash (wrong TokenId)", async () => {
      const wrongTokenId = 1337;
      const sig = await signMint(
        issuer,
        minterA,
        wrongTokenId,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .mintPassport(minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - using someone else signature", async () => {
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
      await expect(
        passport
          .connect(minterB)
          .mintPassport(minterB.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid issuer", async () => {
      const invalidSigner = ethers.Wallet.createRandom();
      const sig = await signMint(
        invalidSigner,
        minterA,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .mintPassport(minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");
    });
  });

  describe("KYB", async () => {
    it("fail - mint passport to contract if not a business", async () => {

      const DeFi = await ethers.getContractFactory("DeFi");
      const defi = await DeFi.deploy(passport.address, reader.address);
      await defi.deployed();

      const sig = await signMint(
        issuer,
        mockBusiness,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      const promise = passport
        .connect(minterA)
        .mintPassport(mockBusiness.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt, sig, {
          value: MINT_PRICE,
        });

      await expect(promise).to.be.revertedWith("NON-BUSINESS_MUST_BE_EOA")


    });

    it("success - mint passport to contract", async () => {

      const newIsBusiness = id("TRUE")

      const DeFi = await ethers.getContractFactory("DeFi");
      const defi = await DeFi.deploy(passport.address, reader.address);
      await defi.deployed();

      const sig = await signMint(
        issuer,
        mockBusiness,
        TOKEN_ID,
        did,
        aml,
        country,
        newIsBusiness,
        issuedAt
      );

      const promise = passport
        .connect(minterA)
        .mintPassport(mockBusiness.address, TOKEN_ID, did, aml, country, newIsBusiness, issuedAt, sig, {
          value: MINT_PRICE,
        });

      await promise;


    });
  })
});
