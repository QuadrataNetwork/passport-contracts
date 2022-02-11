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
} = require("../../utils/constant.ts");
const { signMint } = require("../utils/signature.ts");
const {
  deployPassportAndGovernance,
} = require("../utils/deployment_and_init.ts");
const {
  assertMint,
  assertGetAttribute,
  assertGetAttributeFree,
} = require("../utils/verify.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let passportHelper: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let usdc: Contract;
  let defi: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;
  let baseURI: string;
  let did: string;
  let aml: string;
  let country: string;
  let issuedAt: number;

  describe("mintPassport", async () => {
    beforeEach(async () => {
      baseURI = "https://quadrata.io";
      did = formatBytes32String("did:quad:123456789abcdefghi");
      aml = id("LOW");
      country = id("FRANCE");
      issuedAt = Math.floor(new Date().getTime() / 1000);

      [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury] =
        await ethers.getSigners();
      [governance, passport, passportHelper, usdc, defi] = await deployPassportAndGovernance(
        admin,
        issuer,
        treasury,
        issuerTreasury,
        baseURI
      );
      await usdc.transfer(minterA.address, parseUnits("1000", 6));
      await usdc.transfer(minterB.address, parseUnits("1000", 6));
    });

    it("success mint", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        passportHelper,
        did,
        aml,
        country,
        issuedAt
      );
      await assertGetAttributeFree(
        minterA,
        defi,
        passport,
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
        passportHelper,
        did,
        aml,
        country,
        issuedAt
      );
      await assertMint(
        minterB,
        issuer,
        issuerTreasury,
        passport,
        passportHelper,
        did,
        aml,
        country,
        issuedAt
      );
      for (const wallet of [minterA, minterB]) {
        await assertGetAttributeFree(
          wallet,
          defi,
          passport,
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
          ATTRIBUTE_DID,
          did,
          issuedAt
        );
      }
    });

    it("success - mint multiple passports with same DID from two issuers", async () => {
      const issuerB = ethers.Wallet.createRandom();
      const issuerBTreasury = ethers.Wallet.createRandom();
      await governance
        .connect(admin)
        .addIssuer(issuerB.address, issuerBTreasury.address);
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        passportHelper,
        did,
        aml,
        country,
        issuedAt
      );
      await passport.connect(issuer).withdrawETH(issuerTreasury.address);
      await assertMint(
        minterB,
        issuerB,
        issuerBTreasury,
        passport,
        passportHelper,
        did,
        aml,
        country,
        issuedAt
      );
      for (const wallet of [minterA, minterB]) {
        await assertGetAttributeFree(
          wallet,
          defi,
          passport,
          ATTRIBUTE_AML,
          aml,
          issuedAt
        );
      }

      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
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
        issuedAt
      );
      await passport
        .connect(minterA)
        .mintPassport(TOKEN_ID, did, aml, country, issuedAt, sig, {
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
        passportHelper,
        did,
        aml,
        country,
        issuedAt
      );
      await assertGetAttributeFree(
        minterA,
        defi,
        passport,
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
        passportHelper,
        did,
        aml,
        country,
        issuedAt
      );

      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        passportHelper,
        did,
        aml,
        country,
        issuedAt,
        newTokenId
      );
      for (const tokenId of [TOKEN_ID, newTokenId]) {
        await assertGetAttributeFree(
          minterA,
          defi,
          passport,
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
        .addIssuer(issuer.address, newIssuerTreasury.address);

      await assertMint(
        minterA,
        issuer,
        newIssuerTreasury,
        passport,
        passportHelper,
        did,
        aml,
        country,
        issuedAt
      );

      await assertGetAttributeFree(
        minterA,
        defi,
        passport,
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
        issuedAt
      );
      const wrongMintPrice = parseEther("1");

      await expect(
        passportHelper
          .connect(minterA)
          .mintPassport(TOKEN_ID, did, aml, country, issuedAt, sig, {
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
        issuedAt
      );
      await expect(
        passportHelper
          .connect(minterA)
          .mintPassport(badTokenId, did, aml, country, issuedAt, sig, {
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
        passportHelper,
        did,
        aml,
        country,
        issuedAt
      );

      const sig = await signMint(
        issuer,
        minterA,
        TOKEN_ID,
        did,
        aml,
        country,
        issuedAt + 1
      );
      await expect(
        passport
          .connect(minterA)
          .mintPassport(TOKEN_ID, did, aml, country, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("PASSPORT_ALREADY_EXISTS");
    });

    it("fail - passport already exists - two diff issuers", async () => {
      const issuerB = ethers.Wallet.createRandom();
      const issuerBTreasury = ethers.Wallet.createRandom();
      await governance
        .connect(admin)
        .addIssuer(issuerB.address, issuerBTreasury.address);

      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        passportHelper,
        did,
        aml,
        country,
        issuedAt
      );

      const sig = await signMint(
        issuerB,
        minterA,
        TOKEN_ID,
        did,
        aml,
        country,
        issuedAt + 1
      );
      await expect(
        passportHelper
          .connect(minterA)
          .mintPassport(TOKEN_ID, did, aml, country, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("PASSPORT_ALREADY_EXISTS");
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
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .mintPassport(TOKEN_ID, did, wrongAML, country, issuedAt, sig, {
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
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .mintPassport(TOKEN_ID, did, wrongAML, country, issuedAt, sig, {
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
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .mintPassport(TOKEN_ID, did, aml, wrongCountry, issuedAt, sig, {
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
        issuedAt
      );
      await expect(
        passportHelper
          .connect(minterA)
          .mintPassport(TOKEN_ID, did, aml, country, wrongIssuedAt, sig, {
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
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .mintPassport(TOKEN_ID, did, aml, country, issuedAt, sig, {
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
        passportHelper,
        did,
        aml,
        country,
        issuedAt
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
      await expect(
        passportHelper
          .connect(minterB)
          .mintPassport(TOKEN_ID, did, aml, country, issuedAt, sig, {
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
        issuedAt
      );
      await expect(
        passportHelper
          .connect(minterA)
          .mintPassport(TOKEN_ID, did, aml, country, issuedAt, sig, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");
    });
  });
});
