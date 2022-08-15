import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { formatBytes32String, id } from "ethers/lib/utils";

const {
  MINT_PRICE,
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_COUNTRY,
  READER_ROLE,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");
const { assertSetAttribute } = require("../helpers/asserts.ts");

describe("QuadPassport.setAttributes", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let defi: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuer2: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerTreasury2: SignerWithAddress,
    mockReader: SignerWithAddress;

  let issuedAt: number;
  const attributes: any = {
    [ATTRIBUTE_DID]: formatBytes32String("did:quad:123456789abcdefghi"),
    [ATTRIBUTE_AML]: formatBytes32String("1"),
    [ATTRIBUTE_COUNTRY]: id("FRANCE"),
    [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
  };

  beforeEach(async () => {
    [
      deployer,
      admin,
      minterA,
      minterB,
      issuer,
      issuer2,
      treasury,
      issuerTreasury,
      issuerTreasury2,
      mockReader,
    ] = await ethers.getSigners();
    [governance, passport, reader, defi] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury]
    );

    issuedAt = Math.floor(new Date().getTime() / 1000) - 100;
  });

  describe("setAttribute", async () => {
    it("success - setAttribute(AML)", async () => {});

    it("success - setAttribute(IS_BUSINESS) EOA", async () => {
      var newIsBusiness = id("TRUE");
      var newIssuedAt = 1010;
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

      newIsBusiness = id("FALSE");
      newIssuedAt = 1011;
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
      const MockBusiness = await ethers.getContractFactory("MockBusiness");
      const mockBusiness = await MockBusiness.deploy(defi.address);
      await mockBusiness.deployed();

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
        .mintPassport(
          [
            mockBusiness.address,
            TOKEN_ID,
            did,
            aml,
            country,
            id("TRUE"),
            issuedAt,
          ],
          sigBusiness,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const newIsBusiness = id("FALSE");
      await assertSetAttribute(
        mockBusiness,
        issuer,
        issuerTreasury,
        passport,
        ATTRIBUTE_IS_BUSINESS,
        newIsBusiness,
        issuedAt,
        { signer: minterA }
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
        {
          signer: minterA,
          isContract: true,
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
        { signer: minterA }
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
        { signer: minterA }
      );
    });

    it("success - Individual setAttribute(COUNTRY)", async () => {
      const newCountry = id("DE");
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

    it("success - Business setAttribute(COUNTRY)", async () => {
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sig,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const newCountry = id("DE");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const initialBalance = await ethers.provider.getBalance(passport.address);

      await assertSetAttribute(
        minterB,
        issuer,
        issuerTreasury,
        passport,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
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
        newCountry,
        newIssuedAt
      );

      // OK Fetching old value
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
      // OK Fetching old value
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
      const expectedPayment = PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY];
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance.add(expectedPayment)
      );
    });

    it("success - Individuals may be assiged new eligible attributes", async () => {
      expect(await governance.eligibleAttributes(id("GENDER"))).to.equal(false);
      await governance.connect(admin).setEligibleAttribute(id("GENDER"), true);
      expect(await governance.eligibleAttributes(id("GENDER"))).to.equal(true);

      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        id("GENDER"),
        id("M"),
        issuedAt
      );

      await passport
        .connect(minterA)
        .setAttribute(
          minterA.address,
          TOKEN_ID,
          id("GENDER"),
          id("M"),
          issuedAt,
          sig,
          {
            value: 0,
          }
        );

      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        id("GENDER"),
        id("M"),
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
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
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
    });

    it("success - Businesses may be assiged new eligible attributes", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      expect(await governance.eligibleAttributes(id("GENDER"))).to.equal(false);
      await governance.connect(admin).setEligibleAttribute(id("GENDER"), true);
      expect(await governance.eligibleAttributes(id("GENDER"))).to.equal(true);

      const sig = await signSetAttribute(
        issuer,
        minterB,
        TOKEN_ID,
        id("GENDER"),
        id("M"),
        issuedAt
      );

      await passport
        .connect(minterB)
        .setAttribute(
          minterB.address,
          TOKEN_ID,
          id("GENDER"),
          id("M"),
          issuedAt,
          sig,
          {
            value: 0,
          }
        );

      await assertGetAttributeFree(
        [issuer.address],
        minterB,
        defi,
        passport,
        reader,
        id("GENDER"),
        id("M"),
        issuedAt
      );

      // OK Fetching old value
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

      // OK Fetching old value
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
      // OK Fetching old value
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

    it("success - Individual setAttribute(AML)", async () => {
      const newAML = hexZeroPad("0x05", 32);
      const newIssuedAt = 1000;
      const initialBalance = await ethers.provider.getBalance(passport.address);
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

      // OK Fetching old value
      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        newAML,
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

    it("success - Business setAttribute(AML)", async () => {
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sig,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const newAML = hexZeroPad("0x05", 32);
      const newIssuedAt = 1000;
      const initialBalance = await ethers.provider.getBalance(passport.address);
      await assertSetAttribute(
        minterB,
        issuer,
        issuerTreasury,
        passport,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
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
        newIssuedAt
      );

      // OK Fetching old value
      await assertGetAttributeFree(
        [issuer.address],
        minterB,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        newAML,
        issuedAt
      );
      // OK Fetching old value
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
      const expectedPayment = PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY];
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance.add(expectedPayment)
      );
    });

    it("success - mintPricePerAttribute(0)", async () => {
      await passport.withdraw(issuerTreasury.address);
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
        .setAttribute(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          newAML,
          newIssuedAt,
          sig,
          {
            value: parseEther("0"),
          }
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
      expect(await ethers.provider.getBalance(passport.address)).to.equal(0);

      await expect(
        passport.callStatic.withdraw(issuerTreasury.address)
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

      await passport.withdraw(issuerTreasury.address);

      // Update AML with Issuer 2
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

      const sigAccount = await signMessage(minterA, minterA.address);

      await passport
        .connect(minterA)
        .mintPassport(
          [
            minterA.address,
            1,
            id("DID_34"),
            aml,
            country,
            isBusiness,
            issuedAt,
          ],
          sig,
          sigAccount,
          {
            value: MINT_PRICE,
          }
        );

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

      // minterA now has attributes from both issuers
      await assertGetAttributeIncluding(
        minterA,
        treasury,
        [issuer.address, issuerB.address],
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        [newCountry, country],
        [BigNumber.from(newIssuedAt), BigNumber.from(issuedAt)],
        [issuer.address, issuerB.address],
        1,
        {}
      );
    });

    it("succes - change issuer treasury", async () => {
      await passport.withdraw(issuerTreasury.address);
      const newIssuerTreasury = ethers.Wallet.createRandom();
      await governance
        .connect(admin)
        .setIssuer(issuer.address, newIssuerTreasury.address);

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

      await expect(passport.withdraw(issuerTreasury.address)).to.revertedWith(
        "NOT_ENOUGH_BALANCE"
      );
    });

    it("fail - setAttribute(DID) as Individual", async () => {
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
          .setAttribute(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_DID,
            newDid,
            issuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_DID],
            }
          )
      ).to.revertedWith("MUST_BURN_AND_MINT");
    });

    it("fail - setAttribute(DID) as Business", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const newDid = formatBytes32String("did:1:newdid");
      const sig = await signSetAttribute(
        issuer,
        minterB,
        TOKEN_ID,
        ATTRIBUTE_DID,
        newDid,
        issuedAt
      );
      await expect(
        passport
          .connect(minterB)
          .setAttribute(
            minterB.address,
            TOKEN_ID,
            ATTRIBUTE_DID,
            newDid,
            issuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_DID],
            }
          )
      ).to.revertedWith("MUST_BURN_AND_MINT");
    });

    it("fail - passport tokenId invalid (Business)", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const newCountry = id("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const invalidTokenId = 2;
      const sig = await signSetAttribute(
        issuer,
        minterB,
        invalidTokenId,
        ATTRIBUTE_COUNTRY,
        newCountry,
        newIssuedAt
      );
      await expect(
        passport
          .connect(minterB)
          .setAttribute(
            minterB.address,
            invalidTokenId,
            ATTRIBUTE_COUNTRY,
            newCountry,
            newIssuedAt,
            sig,
            { value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY] }
          )
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - passport tokenId invalid (Individual)", async () => {
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

    it("fail - attribute not eligible (Individual)", async () => {
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
          .setAttribute(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            country,
            issuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY],
            }
          )
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - attribute not eligible (Business)", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

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
        minterB,
        TOKEN_ID,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      await expect(
        passport
          .connect(minterB)
          .setAttribute(
            minterB.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            country,
            issuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY],
            }
          )
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - invalid mint price too high per attribute (Individual)", async () => {
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
          .setAttribute(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            country,
            issuedAt,
            sig,
            {
              value: parseEther("1"),
            }
          )
      ).to.revertedWith("INVALID_ATTR_MINT_PRICE");
    });

    it("fail - invalid mint too high price per attribute (Business)", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const sig = await signSetAttribute(
        issuer,
        minterB,
        TOKEN_ID,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      await expect(
        passport
          .connect(minterB)
          .setAttribute(
            minterB.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            country,
            issuedAt,
            sig,
            {
              value: parseEther("1"),
            }
          )
      ).to.revertedWith("INVALID_ATTR_MINT_PRICE");
    });

    it("fail - invalid mint price too low per attribute (Individual)", async () => {
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
          .setAttribute(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            country,
            issuedAt,
            sig,
            {
              value: parseEther("0.0000001"),
            }
          )
      ).to.revertedWith("INVALID_ATTR_MINT_PRICE");
    });

    it("fail - invalid mint too low price per attribute (Business)", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const sig = await signSetAttribute(
        issuer,
        minterB,
        TOKEN_ID,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      await expect(
        passport
          .connect(minterB)
          .setAttribute(
            minterB.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            country,
            issuedAt,
            sig,
            {
              value: parseEther("0.0000001"),
            }
          )
      ).to.revertedWith("INVALID_ATTR_MINT_PRICE");
    });

    it("fail - signature already used for AML", async () => {
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
          .setAttribute(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_AML,
            newAML,
            newIssuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
            }
          )
      ).to.revertedWith("SIGNATURE_ALREADY_USED");
    });

    it("fail - signature already used for IS_BUSINESS as Individual", async () => {
      const newIsBusiness = id("TRUE");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      await assertSetAttribute(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        ATTRIBUTE_IS_BUSINESS,
        newIsBusiness,
        newIssuedAt
      );
      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_IS_BUSINESS,
        newIsBusiness,
        newIssuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_IS_BUSINESS,
            newIsBusiness,
            newIssuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_IS_BUSINESS],
            }
          )
      ).to.revertedWith("SIGNATURE_ALREADY_USED");
    });

    it("fail - signature already used for IS_BUSINESS as Business", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const newIsBusiness = id("TRUE");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      await assertSetAttribute(
        minterB,
        issuer,
        issuerTreasury,
        passport,
        ATTRIBUTE_IS_BUSINESS,
        newIsBusiness,
        newIssuedAt
      );
      const sig = await signSetAttribute(
        issuer,
        minterB,
        TOKEN_ID,
        ATTRIBUTE_IS_BUSINESS,
        newIsBusiness,
        newIssuedAt
      );
      await expect(
        passport
          .connect(minterB)
          .setAttribute(
            minterB.address,
            TOKEN_ID,
            ATTRIBUTE_IS_BUSINESS,
            newIsBusiness,
            newIssuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_IS_BUSINESS],
            }
          )
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
        .setAttribute(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          newAML,
          newIssuedAt,
          sig,
          {
            value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
          }
        );
    });

    it("fail - not issuer role (Individual)", async () => {
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
          .setAttribute(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_AML,
            newAML,
            newIssuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
            }
          )
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - not issuer role (Business)", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const newIssuer = ethers.Wallet.createRandom();
      const newAML = id("HIGH");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const sig = await signSetAttribute(
        newIssuer,
        minterB,
        TOKEN_ID,
        ATTRIBUTE_AML,
        newAML,
        newIssuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(
            minterB.address,
            TOKEN_ID,
            ATTRIBUTE_AML,
            newAML,
            newIssuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
            }
          )
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
          .setAttribute(
            minterA.address,
            wrongTokenId,
            ATTRIBUTE_AML,
            aml,
            issuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
            }
          )
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid sig (attribute type, Individual)", async () => {
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
          .setAttribute(
            minterA.address,
            TOKEN_ID,
            wrongAttribute,
            aml,
            issuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
            }
          )
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid sig (attribute type, Business)", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const wrongAttribute = ATTRIBUTE_COUNTRY;
      const sig = await signSetAttribute(
        issuer,
        minterB,
        TOKEN_ID,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      await expect(
        passport
          .connect(minterB)
          .setAttribute(
            minterB.address,
            TOKEN_ID,
            wrongAttribute,
            aml,
            issuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
            }
          )
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid sig (attribute value for AML)", async () => {
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
          .setAttribute(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_AML,
            wrongAML,
            issuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
            }
          )
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid sig (attribute value for COUNTRY, Inidividual)", async () => {
      const wrongAML = id("FR");
      aml = id("DE");
      const sig = await signSetAttribute(
        issuer,
        minterA,
        TOKEN_ID,
        ATTRIBUTE_COUNTRY,
        aml,
        issuedAt
      );
      await expect(
        passport
          .connect(minterA)
          .setAttribute(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            wrongAML,
            issuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY],
            }
          )
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid sig (attribute value for COUNTRY, Business)", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const wrongAML = id("FR");
      aml = id("DE");

      const sig = await signSetAttribute(
        issuer,
        minterB,
        TOKEN_ID,
        ATTRIBUTE_COUNTRY,
        aml,
        issuedAt
      );
      await expect(
        passport
          .connect(minterB)
          .setAttribute(
            minterB.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            wrongAML,
            issuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_COUNTRY],
            }
          )
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid sig (issuedAt, Individual)", async () => {
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
          .setAttribute(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_AML,
            aml,
            wrongIssuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
            }
          )
      ).to.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid sig (issuedAt, Business)", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const wrongIssuedAt = issuedAt + 1;
      const sig = await signSetAttribute(
        issuer,
        minterB,
        TOKEN_ID,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      await expect(
        passport
          .connect(minterB)
          .setAttribute(
            minterB.address,
            TOKEN_ID,
            ATTRIBUTE_AML,
            aml,
            wrongIssuedAt,
            sig,
            {
              value: PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML],
            }
          )
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

    it("success - Individual setAttribute(AML=5)", async () => {
      await passport.withdraw(issuerTreasury.address);

      const newAML = hexZeroPad("0x05", 32);
      const newIssuedAt = 1000;
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

      // OK Fetching old value
      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        newAML,
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

      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance
      );
      await expect(passport.withdraw(issuerTreasury.address)).to.revertedWith(
        "NOT_ENOUGH_BALANCE"
      );
    });

    it("success - Business setAttribute(AML=5)", async () => {
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sig,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      await passport.withdraw(issuerTreasury.address);

      const newAML = hexZeroPad("0x05", 32);
      const newIssuedAt = 1000;
      const initialBalance = await ethers.provider.getBalance(passport.address);
      await passport
        .connect(issuer)
        .setAttributeIssuer(
          minterB.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          newAML,
          newIssuedAt
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
        newIssuedAt
      );

      // OK Fetching old value
      await assertGetAttributeFree(
        [issuer.address],
        minterB,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        newAML,
        issuedAt
      );
      // OK Fetching old value
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

      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance
      );
      await expect(passport.withdraw(issuerTreasury.address)).to.revertedWith(
        "NOT_ENOUGH_BALANCE"
      );
    });

    it("success - Individual setAttribute(COUNTRY)", async () => {
      await passport.withdraw(issuerTreasury.address);
      const newCountry = id("DE");
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
      await expect(passport.withdraw(issuerTreasury.address)).to.revertedWith(
        "NOT_ENOUGH_BALANCE"
      );
    });

    it("success - Business setAttribute(COUNTRY)", async () => {
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sig,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      await passport.withdraw(issuerTreasury.address);
      const newCountry = id("DE");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const initialBalance = await ethers.provider.getBalance(passport.address);
      await passport
        .connect(issuer)
        .setAttributeIssuer(
          minterB.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          newCountry,
          newIssuedAt
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
        newCountry,
        newIssuedAt
      );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance
      );
      await expect(passport.withdraw(issuerTreasury.address)).to.revertedWith(
        "NOT_ENOUGH_BALANCE"
      );
    });
    it("success - setAttribute(IS_BUSINESS) Business", async () => {
      const MockBusiness = await ethers.getContractFactory("MockBusiness");
      const mockBusiness = await MockBusiness.deploy(defi.address);
      await mockBusiness.deployed();

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
        .mintPassport(
          [
            mockBusiness.address,
            TOKEN_ID,
            did,
            aml,
            country,
            id("TRUE"),
            issuedAt,
          ],
          sigBusiness,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      var newIsBusiness = id("FALSE");

      const initialBalance = await ethers.provider.getBalance(passport.address);
      await passport
        .connect(issuer)
        .setAttributeIssuer(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_IS_BUSINESS,
          newIsBusiness,
          issuedAt
        );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance
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
        {
          signer: minterA,
          mockBusiness: mockBusiness,
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
        {
          signer: minterA,
          mockBusiness: mockBusiness,
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
        ATTRIBUTE_DID,
        did,
        issuedAt,
        1,
        {
          signer: minterA,
          mockBusiness: mockBusiness,
        }
      );

      newIsBusiness = id("TRUE");
      const newIssuedAt = 1011;

      await passport
        .connect(issuer)
        .setAttributeIssuer(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_IS_BUSINESS,
          newIsBusiness,
          newIssuedAt
        );

      await assertGetAttributeFree(
        [issuer.address],
        mockBusiness,
        defi,
        passport,
        reader,
        ATTRIBUTE_IS_BUSINESS,
        newIsBusiness,
        newIssuedAt,
        1,
        {
          signer: minterA,
          mockBusiness: mockBusiness,
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
        {
          signer: minterA,
          mockBusiness: mockBusiness,
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
        ATTRIBUTE_DID,
        did,
        issuedAt,
        1,
        {
          signer: minterA,
          mockBusiness: mockBusiness,
        }
      );
    });

    it("success - setAttribute(IS_BUSINESS) Individual", async () => {
      var newIsBusiness = id("TRUE");
      var newIssuedAt = 1010;
      const initialBalance = await ethers.provider.getBalance(passport.address);
      await passport
        .connect(issuer)
        .setAttributeIssuer(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_IS_BUSINESS,
          newIsBusiness,
          newIssuedAt
        );
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        initialBalance
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

      newIsBusiness = id("FALSE");
      newIssuedAt = 1011;
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

    it("success - Individuals may be assiged new eligible attributes", async () => {
      expect(await governance.eligibleAttributes(id("GENDER"))).to.equal(false);
      await governance.connect(admin).setEligibleAttribute(id("GENDER"), true);
      expect(await governance.eligibleAttributes(id("GENDER"))).to.equal(true);

      await passport
        .connect(issuer)
        .setAttributeIssuer(
          minterA.address,
          TOKEN_ID,
          id("GENDER"),
          id("F"),
          issuedAt
        );

      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        id("GENDER"),
        id("F"),
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
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
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
    });

    it("success - Businesses may be assiged new eligible attributes", async () => {
      const sigMint = await signMint(
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
        .connect(minterA)
        .mintPassport(
          [minterB.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt],
          sigMint,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      expect(await governance.eligibleAttributes(id("GENDER"))).to.equal(false);
      await governance.connect(admin).setEligibleAttribute(id("GENDER"), true);
      expect(await governance.eligibleAttributes(id("GENDER"))).to.equal(true);

      await passport
        .connect(issuer)
        .setAttributeIssuer(
          minterB.address,
          TOKEN_ID,
          id("GENDER"),
          id("F"),
          issuedAt
        );

      await assertGetAttributeFree(
        [issuer.address],
        minterB,
        defi,
        passport,
        reader,
        id("GENDER"),
        id("F"),
        issuedAt
      );

      // OK Fetching old value
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

      // OK Fetching old value
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
      // OK Fetching old value
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

    it("success - setAttribute(IS_BUSINESS) Individual", async () => {
      var newIsBusiness = id("TRUE");
      var newIssuedAt = 1010;
      await passport
        .connect(issuer)
        .setAttributeIssuer(
          minterA.address,
          TOKEN_ID,
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

      newIsBusiness = id("FALSE");
      newIssuedAt = 1011;
      await passport
        .connect(issuer)
        .setAttributeIssuer(
          minterA.address,
          TOKEN_ID,
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
      const MockBusiness = await ethers.getContractFactory("MockBusiness");
      const mockBusiness = await MockBusiness.deploy(defi.address);
      await mockBusiness.deployed();

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
        .mintPassport(
          [
            mockBusiness.address,
            TOKEN_ID,
            did,
            aml,
            country,
            id("TRUE"),
            issuedAt,
          ],
          sigBusiness,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const newIsBusiness = id("FALSE");
      await passport
        .connect(issuer)
        .setAttributeIssuer(
          mockBusiness.address,
          TOKEN_ID,
          ATTRIBUTE_IS_BUSINESS,
          newIsBusiness,
          issuedAt
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
        {
          signer: minterA,
          isContract: true,
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
        { signer: minterA }
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
        ATTRIBUTE_DID,
        did,
        issuedAt,
        1,
        { signer: minterA }
      );
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

      await passport.withdrawToken(issuerTreasury.address, usdc.address);

      // minterA now has attributes from both issuers
      await assertGetAttributeIncluding(
        minterA,
        treasury,
        [issuer.address, issuerB.address],
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        [newCountry, id("FRANCE")],
        [BigNumber.from(newIssuedAt), BigNumber.from(newIssuedAt2)],
        [issuer.address, issuerB.address],
        1,
        {}
      );
    });

    it("fail - zero address", async () => {
      const newCountry = id("USA");

      await expect(
        passport
          .connect(issuer)
          .setAttributeIssuer(
            "0x0000000000000000000000000000000000000000",
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            newCountry,
            issuedAt
          )
      ).to.revertedWith("ACCOUNT_CANNOT_BE_ZERO");
    });

    it("fail - zero issuedAt", async () => {
      await expect(
        passport
          .connect(issuer)
          .setAttributeIssuer(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            id("USA"),
            0
          )
      ).to.revertedWith("ISSUED_AT_CANNOT_BE_ZERO");
    });

    it("fail - future issuedAt", async () => {
      const blockNumAfter = await ethers.provider.getBlockNumber();
      const blockAfter = await ethers.provider.getBlock(blockNumAfter);

      await expect(
        passport
          .connect(issuer)
          .setAttributeIssuer(
            minterA.address,
            TOKEN_ID,
            ATTRIBUTE_COUNTRY,
            id("USA"),
            blockAfter.timestamp + 100
          )
      ).to.revertedWith("INVALID_ISSUED_AT");
    });

    it("fail - passport tokenId invalid as Individual", async () => {
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

    it("fail - passport tokenId invalid as Business", async () => {
      const MockBusiness = await ethers.getContractFactory("MockBusiness");
      const mockBusiness = await MockBusiness.deploy(defi.address);
      await mockBusiness.deployed();

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
        .mintPassport(
          [
            mockBusiness.address,
            TOKEN_ID,
            did,
            aml,
            country,
            id("TRUE"),
            issuedAt,
          ],
          sigBusiness,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const newCountry = id("USA");
      const newIssuedAt = Math.floor(new Date().getTime() / 1000);
      const wrongTokenId = 2;

      await expect(
        passport
          .connect(issuer)
          .setAttributeIssuer(
            mockBusiness.address,
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

    it("fail - attribute not eligible as Individual", async () => {
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

    it("fail - attribute not eligible as Business", async () => {
      const MockBusiness = await ethers.getContractFactory("MockBusiness");
      const mockBusiness = await MockBusiness.deploy(defi.address);
      await mockBusiness.deployed();

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
        .mintPassport(
          [
            mockBusiness.address,
            TOKEN_ID,
            did,
            aml,
            country,
            id("TRUE"),
            issuedAt,
          ],
          sigBusiness,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

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
            mockBusiness.address,
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

    it("fail - setAttribute(DID) as Individual", async () => {
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

    it("fail - setAttribute(DID) as Business", async () => {
      const MockBusiness = await ethers.getContractFactory("MockBusiness");
      const mockBusiness = await MockBusiness.deploy(defi.address);
      await mockBusiness.deployed();

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
        .mintPassport(
          [
            mockBusiness.address,
            TOKEN_ID,
            did,
            aml,
            country,
            id("TRUE"),
            issuedAt,
          ],
          sigBusiness,
          "0x00",
          {
            value: MINT_PRICE,
          }
        );

      const newDid = formatBytes32String("did:1:newdid");
      await expect(
        passport
          .connect(issuer)
          .setAttributeIssuer(
            mockBusiness.address,
            TOKEN_ID,
            ATTRIBUTE_DID,
            newDid,
            issuedAt
          )
      ).to.revertedWith("MUST_BURN_AND_MINT");
    });
  });
});
