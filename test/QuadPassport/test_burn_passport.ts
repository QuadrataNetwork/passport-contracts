import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { id, parseUnits, formatBytes32String, zeroPad, hexZeroPad } from "ethers/lib/utils";
import { assertMint } from "../utils/verify";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_PER_BUSINESS_ATTRIBUTES
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const {
  assertGetAttribute,
  assertGetAttributeFree,
} = require("../utils/verify.ts");

const { signMint, signMessage } = require("../utils/signature.ts");

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
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuerB: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerBTreasury: SignerWithAddress,
    dataChecker: SignerWithAddress; // used as READER_ROLE to check AML and DID after burn
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

    [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury, dataChecker, issuerB, issuerBTreasury] =
      await ethers.getSigners();
    [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury],
      baseURI
    );

    const sigIssuer = await signMint(
      issuer,
      minterA,
      TOKEN_ID,
      did,
      aml,
      country,
      isBusiness,
      issuedAt
    );

    const sigMinter = await signMessage(
      minterA,
      minterA.address,
    );

    await passport
      .connect(minterA)
      .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigIssuer, sigMinter, {
        value: MINT_PRICE,
      });

    await governance.connect(admin).grantRole(id("READER_ROLE"), dataChecker.address);
    await governance.connect(admin).setIssuer(issuerB.address, issuerBTreasury.address)

    await usdc.transfer(minterA.address, parseUnits("1000", 6));
    await usdc.transfer(minterB.address, parseUnits("1000", 6));
  });


  describe("burnPassport", async () => {
    it.skip("success - burnPassport, KYB: FALSE", async () => {
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
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await passport.connect(minterA).burnPassport(TOKEN_ID);
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);
      await expect(
        reader.getAttributesIncludingOnly(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        reader.getAttributesIncludingOnly(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        reader.getAttributesIncludingOnly(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("success - burnPassport(KYB: TRUE, Smart Contract)", async () => {

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

      const sigAccount = '0x00';


      await passport
        .connect(minterB)
        .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt], sig, sigAccount, {
          value: MINT_PRICE,
        });

      await assertGetAttributeFree(
        [issuer.address],
        mockBusiness,
        defi,
        passport,
        reader,
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
        reader,
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
        reader,
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
        reader.getAttributesIncludingOnly(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        reader.getAttributesIncludingOnly(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        reader.getAttributesIncludingOnly(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("success - burnPassport(KYB: TRUE, EOA)", async () => {

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

      const sigAccount = await signMessage(
        minterB,
        minterB.address,
      );


      await passport
        .connect(minterB)
        .mintPassport([minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt], sig, sigAccount, {
          value: MINT_PRICE,
        });

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
        issuedAt,
        1,
        { ATTRIBUTE_PRICE: PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY] }
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
        issuedAt,
        1,
        { ATTRIBUTE_PRICE: PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID] }
      );
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(1);
      await passport.connect(minterB).burnPassport(TOKEN_ID);
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
      await expect(
        reader.getAttributesIncludingOnly(
          minterB.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        reader.getAttributesIncludingOnly(
          minterB.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        reader.getAttributesIncludingOnly(
          minterB.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("success - can remint after burn", async () => {
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

      const sigAccount = await signMessage(
        minterA,
        minterA.address,
      );

      await passport
        .connect(minterA)
        .mintPassport([minterA.address, TOKEN_ID, did, newAML, country, isBusiness, newIssuedAt], sig, sigAccount, {
          value: MINT_PRICE,
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
        ATTRIBUTE_DID,
        did,
        newIssuedAt
      );
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    });

    it.skip("fail - invalid tokenId", async () => {
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      const wrongTokenId = 2;
      await expect(
        passport.connect(minterA).burnPassport(wrongTokenId)
      ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);

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

    it.skip("fail - passport non-existent", async () => {
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
      await expect(
        passport.connect(minterB).burnPassport(TOKEN_ID)
      ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
    });
  });

  describe("burnPassportIssuer", async () => {
    it.skip("success - burnPassportIssuer - business contract", async () => {

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

      const sigAccount = '0x00'


      await passport
        .connect(minterB)
        .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt], sig, sigAccount, {
          value: MINT_PRICE,
        });


      await assertGetAttributeFree(
        [issuer.address],
        mockBusiness,
        defi,
        passport,
        reader,
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
        reader,
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
        reader,
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
        reader.getAttributesIncludingOnly(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        reader.getAttributesIncludingOnly(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        reader.getAttributesIncludingOnly(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("success - burnPassportIssuer", async () => {
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
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await passport
        .connect(issuer)
        .burnPassportIssuer(minterA.address, TOKEN_ID);
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);
      await expect(
        reader.getAttributesIncludingOnly(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        reader.getAttributesIncludingOnly(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

      await expect(
        reader.getAttributesIncludingOnly(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address,
          [issuer.address]
        )
      ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });
    it("success - mint 2 business passports, deactivate issuerA, burnIssuerA, then assert only account level attributes remain on issuerB", async () => {
      isBusiness = id("TRUE");

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

      const sigAccount = '0x00';


      await passport
        .connect(minterB)
        .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt], sig, sigAccount, {
          value: MINT_PRICE,
        });

      const sigB = await signMint(
        issuerB,
        mockBusiness,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      await passport
        .connect(minterB)
        .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigB, sigAccount, {
          value: MINT_PRICE,
        });

      // PRE BURN
      // did level
      const amlPreBurnA = await passport.connect(dataChecker).attributesByDID(did, id("AML"), issuer.address);
      const amlPreBurnB = await passport.connect(dataChecker).attributesByDID(did, id("AML"), issuerB.address);
      // account level
      const didPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, id("DID"), issuer.address);
      const didPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, id("DID"), issuerB.address);
      const countryPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, id("COUNTRY"), issuer.address);
      const countryPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, id("COUNTRY"), issuerB.address);
      const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, id("IS_BUSINESS"), issuer.address);
      const isBusinessPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, id("IS_BUSINESS"), issuerB.address);
      expect(didPreBurnA.value).equals(did);
      expect(countryPreBurnA.value).equals(country);
      expect(isBusinessPreBurnA.value).equals(isBusiness);

      expect(didPreBurnB.value).equals(did);
      expect(countryPreBurnB.value).equals(country);
      expect(isBusinessPreBurnB.value).equals(isBusiness);

      // disable issuer for burn
      await expect(governance.connect(admin).setIssuerStatus(issuer.address, 1))
        .to.emit(governance, 'IssuerStatusChanged')
        .withArgs(issuer.address, 0, 1);

      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);
      await passport.connect(issuerB).burnPassportIssuer(mockBusiness.address, TOKEN_ID);
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);

      // enable issuer to see what the storage values are
      await expect(governance.connect(admin).setIssuerStatus(issuer.address, 0))
        .to.emit(governance, 'IssuerStatusChanged')
        .withArgs(issuer.address, 1, 0);

      // POST BURN
      // did level
      const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, id("AML"), issuer.address);
      const amlPostBurnB = await passport.connect(dataChecker).attributesByDID(did, id("AML"), issuerB.address);
      // account level
      const didPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, id("DID"), issuer.address);
      const countryPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, id("COUNTRY"), issuer.address);
      const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, id("IS_BUSINESS"), issuer.address);
      const didPostBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, id("DID"), issuerB.address);
      const countryPostBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, id("COUNTRY"), issuerB.address);
      const isBusinessPostBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, id("IS_BUSINESS"), issuerB.address);

      // expect did level attributes to not change
      expect(amlPostBurnB.value).equals(amlPreBurnB.value);
      expect(amlPostBurnA.value).equals(amlPreBurnA.value);

      expect(didPostBurnA.value).equals(didPreBurnA.value);
      expect(countryPostBurnA.value).equals(countryPreBurnA.value);
      expect(isBusinessPostBurnA.value).equals(isBusinessPreBurnA.value);

      expect(didPostBurnB.value).equals(hexZeroPad('0x00', 32));
      expect(countryPostBurnB.value).equals(hexZeroPad('0x00', 32));
      expect(isBusinessPostBurnB.value).equals(hexZeroPad('0x00', 32));
    });
    it("success - mint 2 individual passports, deactivate issuerA, burnIssuerA, then assert only account level attributes remain on issuerB", async () => {

      const sigB = await signMint(
        issuerB,
        minterA,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      const sigAccount = await signMessage(minterA, minterA.address);

      await passport
        .connect(minterB)
        .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigB, sigAccount, {
          value: MINT_PRICE,
        });

      // PRE BURN
      // did level
      const amlPreBurnA = await passport.connect(dataChecker).attributesByDID(did, id("AML"), issuer.address);
      const amlPreBurnB = await passport.connect(dataChecker).attributesByDID(did, id("AML"), issuerB.address);
      // account level
      const didPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, id("DID"), issuer.address);
      const didPreBurnB = await passport.connect(dataChecker).attributes(minterA.address, id("DID"), issuerB.address);
      const countryPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, id("COUNTRY"), issuer.address);
      const countryPreBurnB = await passport.connect(dataChecker).attributes(minterA.address, id("COUNTRY"), issuerB.address);
      const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, id("IS_BUSINESS"), issuer.address);
      const isBusinessPreBurnB = await passport.connect(dataChecker).attributes(minterA.address, id("IS_BUSINESS"), issuerB.address);
      expect(didPreBurnA.value).equals(did);
      expect(countryPreBurnA.value).equals(country);
      expect(isBusinessPreBurnA.value).equals(isBusiness);

      expect(didPreBurnB.value).equals(did);
      expect(countryPreBurnB.value).equals(country);
      expect(isBusinessPreBurnB.value).equals(isBusiness);

      // disable issuer for burn
      await expect(governance.connect(admin).setIssuerStatus(issuer.address, 1))
        .to.emit(governance, 'IssuerStatusChanged')
        .withArgs(issuer.address, 0, 1);

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await passport.connect(issuerB).burnPassportIssuer(minterA.address, TOKEN_ID);
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);

      // enable issuer to see what the storage values are
      await expect(governance.connect(admin).setIssuerStatus(issuer.address, 0))
        .to.emit(governance, 'IssuerStatusChanged')
        .withArgs(issuer.address, 1, 0);

      // POST BURN
      // did level
      const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, id("AML"), issuer.address);
      const amlPostBurnB = await passport.connect(dataChecker).attributesByDID(did, id("AML"), issuerB.address);
      // account level
      const didPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, id("DID"), issuer.address);
      const countryPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, id("COUNTRY"), issuer.address);
      const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, id("IS_BUSINESS"), issuer.address);
      const didPostBurnB = await passport.connect(dataChecker).attributes(minterA.address, id("DID"), issuerB.address);
      const countryPostBurnB = await passport.connect(dataChecker).attributes(minterA.address, id("COUNTRY"), issuerB.address);
      const isBusinessPostBurnB = await passport.connect(dataChecker).attributes(minterA.address, id("IS_BUSINESS"), issuerB.address);

      // expect did level attributes to not change
      expect(amlPostBurnB.value).equals(amlPreBurnB.value);
      expect(amlPostBurnA.value).equals(amlPreBurnA.value);

      expect(didPostBurnA.value).equals(didPreBurnA.value);
      expect(countryPostBurnA.value).equals(countryPreBurnA.value);
      expect(isBusinessPostBurnA.value).equals(isBusinessPreBurnA.value);

      expect(didPostBurnB.value).equals(hexZeroPad('0x00', 32));
      expect(countryPostBurnB.value).equals(hexZeroPad('0x00', 32));
      expect(isBusinessPostBurnB.value).equals(hexZeroPad('0x00', 32));
    });

    it.skip("success - can remint after burn", async () => {
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

      const sigAccount = await signMessage(
        minterA,
        minterA.address,
      );

      await passport
        .connect(admin)
        .mintPassport([minterA.address, TOKEN_ID, did, newAML, country, isBusiness, newIssuedAt], sig, sigAccount, {
          value: MINT_PRICE,
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
        ATTRIBUTE_DID,
        did,
        newIssuedAt
      );
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    });

    it.skip("fail - invalid tokenId", async () => {
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      const wrongTokenId = 2;
      await expect(
        passport
          .connect(issuer)
          .burnPassportIssuer(minterA.address, wrongTokenId)
      ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
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

    it.skip("fail - passport non-existent", async () => {
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
      await expect(
        passport.connect(issuer).burnPassportIssuer(minterB.address, TOKEN_ID)
      ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
    });

    it.skip("fail - not issuer role", async () => {
      await expect(
        passport.connect(admin).burnPassportIssuer(minterB.address, TOKEN_ID)
      ).to.revertedWith("INVALID_ISSUER");
    });
  });
});
