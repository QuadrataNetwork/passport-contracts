import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { id, parseUnits, formatBytes32String } from "ethers/lib/utils";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_PER_BUSINESS_ATTRIBUTES
} = require("../../utils/constant.ts");

const {
  deployPassportAndGovernance,
} = require("../utils/deployment_and_init.ts");

const {
  assertGetAttribute,
  assertGetAttributeFree,
} = require("../utils/verify.ts");

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
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;
  let baseURI: string;
  let did: string;
  let aml: string;
  let isBusiness: string;
  let country: string;
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
      .connect(minterA)
      .mintPassport(minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt, sig, {
        value: MINT_PRICE,
      });

    await governance.connect(admin).setBusinessAttributePrice(ATTRIBUTE_COUNTRY, parseUnits(PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY].toString(), 6))
    await governance.connect(admin).setBusinessAttributePrice(ATTRIBUTE_DID, parseUnits(PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID].toString(), 6))

    await usdc.transfer(minterA.address, parseUnits("1000", 6));
    await usdc.transfer(minterB.address, parseUnits("1000", 6));
  });

  describe("burnPassport", async () => {
    it("success - burnPassport, KYB: FALSE", async () => {
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
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await passport.connect(minterA).burnPassport(TOKEN_ID);
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);
      await expect(
        passport.getAttribute(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("success - burnPassport(KYB: TRUE, Smart Contract)", async () => {

      const MockBusiness = await ethers.getContractFactory('MockBusiness')
      const mockBusiness = await MockBusiness.deploy(defi.address)
      await mockBusiness.deployed()

      const sig = await signMint(
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
        .connect(minterB)
        .mintPassport(mockBusiness.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt, sig, {
          value: MINT_PRICE,
        });

      await assertGetAttributeFree(
        mockBusiness,
        defi,
        passport,
        ATTRIBUTE_AML,
        aml,
        issuedAt,
        1,
        {
          signer: minterB,
          mockBusiness: mockBusiness
        }
      );
      await assertGetAttribute(
        mockBusiness,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt,
        1,
        {
          ATTRIBUTE_PRICE: PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY],
          signer: minterB,
          mockBusiness: mockBusiness
        }
      );
      await assertGetAttribute(
        mockBusiness,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        ATTRIBUTE_DID,
        did,
        issuedAt,
        1,
        {
          ATTRIBUTE_PRICE: PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID],
          signer: minterB,
          mockBusiness: mockBusiness
        }
      );
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);
      await mockBusiness.burn();
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(0);

      await expect(
        passport.getAttribute(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("success - burnPassport(KYB: TRUE, EOA)", async () => {

      const sig = await signMint(
        issuer,
        minterB,
        TOKEN_ID,
        did,
        aml,
        country,
        id("TRUE"),
        issuedAt
      );


      await passport
        .connect(minterB)
        .mintPassport(minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt, sig, {
          value: MINT_PRICE,
        });

      await assertGetAttributeFree(
        minterB,
        defi,
        passport,
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
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt,
        1,
        {ATTRIBUTE_PRICE: PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY]}
      );
      await assertGetAttribute(
        minterB,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        ATTRIBUTE_DID,
        did,
        issuedAt,
        1,
        {ATTRIBUTE_PRICE: PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID]}
      );
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(1);
      await passport.connect(minterB).burnPassport(TOKEN_ID);
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
      await expect(
        passport.getAttribute(
          minterB.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          minterB.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          minterB.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("success - can remint after burn", async () => {
      await passport.connect(minterA).burnPassport(TOKEN_ID);

      const newIssuedAt = issuedAt + 1;
      const newAML = id("HIGH");

      const sig = await signMint(
        issuer,
        minterA,
        TOKEN_ID,
        did,
        newAML,
        country,
        isBusiness,
        newIssuedAt
      );

      await passport
        .connect(minterA)
        .mintPassport(minterA.address, TOKEN_ID, did, newAML, country, isBusiness, newIssuedAt, sig, {
          value: MINT_PRICE,
        });

      await assertGetAttributeFree(
        minterA,
        defi,
        passport,
        ATTRIBUTE_AML,
        newAML,
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
        ATTRIBUTE_COUNTRY,
        country,
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
        ATTRIBUTE_DID,
        did,
        newIssuedAt
      );
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    });

    it("fail - invalid tokenId", async () => {
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      const wrongTokenId = 2;
      await expect(
        passport.connect(minterA).burnPassport(wrongTokenId)
      ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);

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

    it("fail - passport non-existent", async () => {
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
      await expect(
        passport.connect(minterB).burnPassport(TOKEN_ID)
      ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
    });
  });

  describe("burnPassportIssuer", async () => {
    it("success - burnPassportIssuer - business contract", async () => {

      const MockBusiness = await ethers.getContractFactory('MockBusiness')
      const mockBusiness = await MockBusiness.deploy(defi.address)
      await mockBusiness.deployed()

      const sig = await signMint(
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
        .connect(minterB)
        .mintPassport(mockBusiness.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt, sig, {
          value: MINT_PRICE,
        });


      await assertGetAttributeFree(
        mockBusiness,
        defi,
        passport,
        ATTRIBUTE_AML,
        aml,
        issuedAt,
        1,
        {
          signer: minterB,
          mockBusiness: mockBusiness
        }
      );
      await assertGetAttribute(
        mockBusiness,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt,
        1,
        {
          ATTRIBUTE_PRICE: PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY],
          signer: minterB,
          mockBusiness: mockBusiness
        }
      );
      await assertGetAttribute(
        mockBusiness,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        ATTRIBUTE_DID,
        did,
        issuedAt,
        1,
        {
          ATTRIBUTE_PRICE: PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY],
          signer: minterB,
          mockBusiness: mockBusiness
        }
      );
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);
      await passport
        .connect(issuer)
        .burnPassportIssuer(mockBusiness.address, TOKEN_ID);
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(0);
      await expect(
        passport.getAttribute(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("success - burnPassportIssuer", async () => {
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
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await passport
        .connect(issuer)
        .burnPassportIssuer(minterA.address, TOKEN_ID);
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);
      await expect(
        passport.getAttribute(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        passport.getAttribute(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("success - can remint after burn", async () => {
      await passport
        .connect(issuer)
        .burnPassportIssuer(minterA.address, TOKEN_ID);
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

      const newIssuedAt = issuedAt + 1;
      const newAML = id("HIGH");

      const sig = await signMint(
        issuer,
        minterA,
        TOKEN_ID,
        did,
        newAML,
        country,
        isBusiness,
        newIssuedAt
      );

      await passport
        .connect(admin)
        .mintPassport(minterA.address, TOKEN_ID, did, newAML, country, isBusiness, newIssuedAt, sig, {
          value: MINT_PRICE,
        });

      await assertGetAttributeFree(
        minterA,
        defi,
        passport,
        ATTRIBUTE_AML,
        newAML,
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
        ATTRIBUTE_COUNTRY,
        country,
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
        ATTRIBUTE_DID,
        did,
        newIssuedAt
      );
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    });

    it("fail - invalid tokenId", async () => {
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      const wrongTokenId = 2;
      await expect(
        passport
          .connect(issuer)
          .burnPassportIssuer(minterA.address, wrongTokenId)
      ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
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

    it("fail - passport non-existent", async () => {
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
      await expect(
        passport.connect(issuer).burnPassportIssuer(minterB.address, TOKEN_ID)
      ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
    });

    it("fail - not issuer role", async () => {
      await expect(
        passport.connect(admin).burnPassportIssuer(minterB.address, TOKEN_ID)
      ).to.revertedWith("INVALID_ISSUER");
    });
  });
});
