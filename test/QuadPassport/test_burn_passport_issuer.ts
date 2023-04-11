import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Wallet } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { formatBytes32String, hexZeroPad, id } from "ethers/lib/utils";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  ATTRIBUTE_IS_BUSINESS,
  TOKEN_ID,
  MINT_PRICE,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");
const { setAttributesIssuer } = require("../helpers/set_attributes_issuer.ts");
const {
  assertGetAttributes,
} = require("../helpers/assert/assert_get_attributes.ts");

describe("QuadPassport.burnPassports", async () => {
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
    issuerB: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerBTreasury: SignerWithAddress,
    freeAccount: SignerWithAddress,
    dataChecker: SignerWithAddress; // used as READER_ROLE to check AML and DID after burn
  const verifiedAt: number = Math.floor(new Date().getTime() / 1000);
  const issuedAt: number = Math.floor(new Date().getTime() / 1000);
  const attributes: any = {
    [ATTRIBUTE_DID]: formatBytes32String("did:quad:helloworld"),
    [ATTRIBUTE_AML]: formatBytes32String("1"),
    [ATTRIBUTE_COUNTRY]: id("FRANCE"),
    [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
  };
  const attributesB: any = {
    [ATTRIBUTE_DID]: formatBytes32String("did:quad:bbbbbbb"),
    [ATTRIBUTE_AML]: formatBytes32String("1"),
    [ATTRIBUTE_COUNTRY]: id("FRANCE"),
    [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
  };

  const businessAttributes: any = {
    [ATTRIBUTE_DID]: formatBytes32String("did:quad:businessworld"),
    [ATTRIBUTE_AML]: formatBytes32String("1"),
    [ATTRIBUTE_COUNTRY]: id("US"),
    [ATTRIBUTE_IS_BUSINESS]: id("TRUE"),
  };

  beforeEach(async () => {
    [
      deployer,
      admin,
      minterA,
      minterB,
      issuer,
      treasury,
      issuerTreasury,
      dataChecker,
      issuerB,
      issuerBTreasury,
      freeAccount,
    ] = await ethers.getSigners();
    [governance, passport, reader, defi] = await deployPassportEcosystem(
      admin,
      [issuer, issuerB],
      treasury,
      [issuerTreasury, issuerBTreasury]
    );

    await governance
      .connect(admin)
      .grantRole(id("READER_ROLE"), dataChecker.address);
  });

  describe("burnPassportsIssuer", async () => {
    it("success - burnPassportsIssuer for business contract", async () => {
      const MockBusiness = await ethers.getContractFactory("MockBusiness");
      const mockBusiness = await MockBusiness.deploy(defi.address);
      await mockBusiness.deployed();

      await expect(
        setAttributesIssuer(
          mockBusiness,
          issuer,
          passport,
          businessAttributes,
          verifiedAt,
          issuedAt
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt]
      );

      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        1
      );
      await passport.connect(issuer).burnPassportsIssuer(mockBusiness.address, TOKEN_ID);
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        0
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      // Re-attest DID
      await expect(
        setAttributesIssuer(
          mockBusiness,
          issuer,
          passport,
          { [ATTRIBUTE_DID]: businessAttributes[ATTRIBUTE_DID] },
          verifiedAt,
          issuedAt
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt]
      );
    });

    it("success - mint individual, update AML to 10, deactivate, reactivate, assert AML is still 10", async () => {
      await expect(
        setAttributes(
          minterB,
          issuer,
          passport,
          attributesB,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      const attributesCopy = Object.assign({}, attributesB);
      attributesCopy[ATTRIBUTE_AML] = hexZeroPad("0x0a", 32);

      await expect(
        setAttributes(
          minterB,
          issuer,
          passport,
          attributesCopy,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await expect(
        governance.connect(admin).setIssuerStatus(issuer.address, false)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer.address, false);

      await expect(
        governance.connect(admin).setIssuerStatus(issuer.address, true)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer.address, true);

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );
    });

    it("success - mint individual, update AML to 10, deactivate, reactivate, burn, assert AML is still 10", async () => {
      await expect(
        setAttributes(
          minterB,
          issuer,
          passport,
          attributesB,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      const attributesCopy = Object.assign({}, attributesB);
      attributesCopy[ATTRIBUTE_AML] = hexZeroPad("0x0a", 32);

      await expect(
        setAttributes(
          minterB,
          issuer,
          passport,
          attributesCopy,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await expect(
        governance.connect(admin).setIssuerStatus(issuer.address, false)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer.address, false);

      await expect(
        governance.connect(admin).setIssuerStatus(issuer.address, true)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer.address, true);

      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(1);
      await passport.connect(minterB).burnPassports(TOKEN_ID);
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      // Re-attest DID
      await expect(
        setAttributes(
          minterB,
          issuer,
          passport,
          { [ATTRIBUTE_DID]: attributesB[ATTRIBUTE_DID] },
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );
    });

    it("success - burnPassportsIssuer for individual with single issuer", async () => {
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await expect(
        passport.connect(issuer).burnPassportsIssuer(minterA.address, TOKEN_ID)
      )
        .to.emit(passport, "TransferSingle")
        .withArgs(
          issuer.address,
          minterA.address,
          ethers.constants.AddressZero,
          TOKEN_ID,
          1
        )
        .to.emit(passport, "BurnPassportsIssuer")
        .withArgs(issuer.address, minterA.address);

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );
    });

    it("success - burnPassportsIssuer for individual with two issuers", async () => {
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      await expect(
        setAttributes(
          minterA,
          issuerB,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [attributes, attributes],
        [verifiedAt, verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [attributes, attributes],
        [verifiedAt, verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [attributes, attributes],
        [verifiedAt, verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [attributes, attributes],
        [verifiedAt, verifiedAt]
      );

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);

      await expect(
        passport.connect(issuer).burnPassportsIssuer(minterA.address, TOKEN_ID)
      )
        .to.emit(passport, "BurnPassportsIssuer")
        .withArgs(issuer.address, minterA.address)
        .to.not.emit(passport, "TransferSingle");
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [attributes, attributes],
        [verifiedAt, verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuerB],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuerB],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuerB],
        [attributes],
        [verifiedAt]
      );

      await expect(
        passport.connect(issuerB).burnPassportsIssuer(minterA.address, TOKEN_ID)
      )
        .to.emit(passport, "TransferSingle")
        .withArgs(
          issuerB.address,
          minterA.address,
          ethers.constants.AddressZero,
          TOKEN_ID,
          1
        )
        .to.emit(passport, "BurnPassportsIssuer")
        .withArgs(issuerB.address, minterA.address);

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );
    });

    it("success - mint 2 business passports, deactivate issuerA, burnIssuerA, disable country, then assert only account level attributes remain", async () => {
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      const MockBusiness = await ethers.getContractFactory("MockBusiness");
      const mockBusiness = await MockBusiness.deploy(defi.address);
      await mockBusiness.deployed();

      await expect(
        setAttributesIssuer(
          mockBusiness,
          issuer,
          passport,
          businessAttributes,
          verifiedAt,
          issuedAt
        )
      ).to.not.be.reverted;

      await expect(
        setAttributesIssuer(
          mockBusiness,
          issuerB,
          passport,
          businessAttributes,
          verifiedAt,
          issuedAt
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt],
        true
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt],
        true
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt],
        true
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt],
        true
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt],
        true
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt],
        true
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt],
        true
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt],
        true
      );

      await expect(
        governance.connect(admin).setIssuerStatus(issuer.address, false)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer.address, false);

      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        1
      );
      await passport.connect(issuerB).burnPassportsIssuer(mockBusiness.address, TOKEN_ID);
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        1
      );

      await expect(
        governance.connect(admin).setIssuerStatus(issuer.address, true)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer.address, true);

      await expect(
        governance.connect(admin).setEligibleAttribute(ATTRIBUTE_COUNTRY, false)
      )
        .to.emit(governance, "EligibleAttributeUpdated")
        .withArgs(ATTRIBUTE_COUNTRY, false);

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await passport.connect(issuer).burnPassportsIssuer(minterA.address, TOKEN_ID);
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

      await expect(
        governance.connect(admin).setEligibleAttribute(ATTRIBUTE_COUNTRY, true)
      )
        .to.emit(governance, "EligibleAttributeUpdated")
        .withArgs(ATTRIBUTE_COUNTRY, true);

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt],
        true
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt],
        true
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt],
        true
      );

      await expect(
        setAttributesIssuer(
          mockBusiness,
          issuer,
          passport,
          { [ATTRIBUTE_DID]: businessAttributes[ATTRIBUTE_DID] },
          verifiedAt,
          issuedAt
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt],
        true
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt],
        true
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
      );

      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          { [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID] },
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt],
        true
      );
    });

    it("success - mint 2 business passports, delete issuerA, burnIssuerA, then assert only account level attributes remain for A, issuerB all exists", async () => {
      const MockBusiness = await ethers.getContractFactory("MockBusiness");
      const mockBusiness = await MockBusiness.deploy(defi.address);
      await mockBusiness.deployed();

      await expect(
        setAttributesIssuer(
          mockBusiness,
          issuer,
          passport,
          businessAttributes,
          verifiedAt,
          issuedAt
        )
      ).to.not.be.reverted;

      await expect(
        setAttributesIssuer(
          mockBusiness,
          issuerB,
          passport,
          businessAttributes,
          verifiedAt,
          issuedAt
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt],
        true
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt],
        true
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt],
        true
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt],
        true
      );

      await expect(
        governance.connect(admin).setEligibleAttribute(ATTRIBUTE_COUNTRY, false)
      )
        .to.emit(governance, "EligibleAttributeUpdated")
        .withArgs(ATTRIBUTE_COUNTRY, false);

      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        1
      );
      await passport.connect(issuer).burnPassportsIssuer(mockBusiness.address, TOKEN_ID);
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        1
      );

      await expect(
        governance.connect(admin).setEligibleAttribute(ATTRIBUTE_COUNTRY, true)
      )
        .to.emit(governance, "EligibleAttributeUpdated")
        .withArgs(ATTRIBUTE_COUNTRY, true);

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuerB],
        [businessAttributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt]
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuerB],
        [businessAttributes],
        [verifiedAt]
      );

      // re-attest DID
      await expect(
        setAttributesIssuer(
          mockBusiness,
          issuer,
          passport,
          { [ATTRIBUTE_DID]: businessAttributes[ATTRIBUTE_DID] },
          verifiedAt,
          issuedAt
        )
      ).to.not.be.reverted;

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt]
      );
    });

    it("success - can remint after burn", async () => {
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await passport.connect(issuer).burnPassportsIssuer(minterA.address, TOKEN_ID);
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

      const attributesCopy = Object.assign({}, attributes);
      attributesCopy[ATTRIBUTE_AML] = hexZeroPad("0x0a", 32);

      const newIssuedAt = issuedAt + 1;
      const newVerifiedAt = verifiedAt + 1;

      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributesCopy,
          newVerifiedAt,
          newIssuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [newVerifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [newVerifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [newVerifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [newVerifiedAt]
      );
    });

    it("fail - invalid tokenId", async () => {
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      expect(await passport.balanceOf(minterA.address, 1337)).to.equal(0);
    });

    it("fail - passport non-existent (account never had attested data)", async () => {
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
      await expect(
        passport.connect(issuer).burnPassportsIssuer(minterB.address, TOKEN_ID)
      ).to.not.be.reverted;
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
    });

    it("fail - passport non-existent (indiviual account currently has attested data)", async () => {
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      expect(await passport.balanceOf(minterA.address, 2)).to.equal(0);

      await expect(
        passport.connect(issuer).burnPassportsIssuer(minterA.address, TOKEN_ID)
      ).to.not.be.reverted;

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);
      expect(await passport.balanceOf(minterA.address, 2)).to.equal(0);
    });

    it("fail - passport non-existent (business account currently has attested data)", async () => {
      const MockBusiness = await ethers.getContractFactory("MockBusiness");
      const mockBusiness = await MockBusiness.deploy(defi.address);
      await mockBusiness.deployed();

      await expect(
        setAttributesIssuer(
          mockBusiness,
          issuer,
          passport,
          businessAttributes,
          verifiedAt,
          issuedAt
        )
      ).to.not.be.reverted;

      expect(await passport.balanceOf(mockBusiness.address, 1)).to.equal(1);
      expect(await passport.balanceOf(mockBusiness.address, 2)).to.equal(0);

      await expect(
        passport.connect(issuer).burnPassportsIssuer(mockBusiness.address, TOKEN_ID)
      ).to.not.be.reverted;

      expect(await passport.balanceOf(mockBusiness.address, 1)).to.equal(0);
      expect(await passport.balanceOf(mockBusiness.address, 2)).to.equal(0);
    });

    it("fail - trying to burn indiviual account as a non issuer role", async () => {
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      await expect(
        passport.connect(admin).burnPassportsIssuer(minterA.address, TOKEN_ID)
      ).to.revertedWith("INVALID_ISSUER");

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("success - issuerB cannot accidentally delete issuerA's attestations", async () => {
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.not.be.reverted;

      await governance
        .connect(admin)
        .addIssuer(freeAccount.address, freeAccount.address);

      expect(
        await passport.connect(issuerB).burnPassportsIssuer(minterA.address, TOKEN_ID)
      );

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("fail - trying to burn business account as a non issuer role", async () => {
      const MockBusiness = await ethers.getContractFactory("MockBusiness");
      const mockBusiness = await MockBusiness.deploy(defi.address);
      await mockBusiness.deployed();

      await expect(
        setAttributesIssuer(
          mockBusiness,
          issuer,
          passport,
          businessAttributes,
          verifiedAt,
          issuedAt
        )
      ).to.not.be.reverted;

      await expect(
        passport.connect(admin).burnPassportsIssuer(mockBusiness.address, TOKEN_ID)
      ).to.revertedWith("INVALID_ISSUER");

      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        1
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [businessAttributes],
        [verifiedAt]
      );
    });

    it("fail - when paused", async () => {
      await passport.connect(admin).pause();

      await expect(
        passport.connect(admin).burnPassportsIssuer(minterA.address, TOKEN_ID)
      ).to.revertedWith("Pausable: paused");
    });
  });
});
