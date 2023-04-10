import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
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

  describe("burnPassports", async () => {
    it("success - mint from issuerA and issuer B, burnPassport, check that all account level values are gone", async () => {
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
      await expect(passport.connect(minterA).burnPassports())
        .to.emit(passport, "TransferSingle")
        .withArgs(
          minterA.address,
          minterA.address,
          ethers.constants.AddressZero,
          TOKEN_ID,
          1
        );
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

    it("success - burnPassport, IS_BUSINESS: FALSE", async () => {
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
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await passport.connect(minterA).burnPassports();
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
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );
    });

    it("success - burnPassports(IS_BUSINESS: TRUE, Smart Contract)", async () => {
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
        [verifiedAt],
        true
      );

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

      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        1
      );
      await mockBusiness.burnPassports();
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        0
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
      );

      await assertGetAttributes(
        mockBusiness,
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
        mockBusiness,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
      );
    });

    it("success - burnPassports(IS_BUSINESS: TRUE, Smart Contract, Multi-Issuer)", async () => {
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
        [verifiedAt],
        true
      );

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

      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        1
      );
      await mockBusiness.burnPassports();
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        0
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
      );

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
      );

      await assertGetAttributes(
        mockBusiness,
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
        mockBusiness,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
      );
    });

    it("success - burnPassports(IS_BUSINESS: TRUE, EOA)", async () => {
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

      const attributesCopy = Object.assign({}, attributesB);
      attributesCopy[ATTRIBUTE_IS_BUSINESS] = id("TRUE");

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

      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(1);
      await passport.connect(minterB).burnPassports();
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );

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
      await passport.connect(minterA).burnPassports();
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

      const attributesCopy = Object.assign({}, attributes);
      attributesCopy[ATTRIBUTE_AML] = hexZeroPad("0x0a", 32);

      const newVerifiedAt = verifiedAt + 1;

      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributesCopy,
          newVerifiedAt,
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
        [attributesCopy],
        [newVerifiedAt]
      );

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

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    });

    it("does nothing - passport non-existent", async () => {
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
      await passport.connect(minterB).burnPassports();
      expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
    });
  });

  describe("deactivateThenBurn", async () => {
    it("success - mint for business, disable country, burn, assert country still exists while others get deleted", async () => {
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

      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, false);

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
      )

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
      await mockBusiness.burnPassports();
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        0
      );

      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, true);

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [],
        [],
        []
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
        [],
        [],
        []
      );
    });

    it("success - mint for individual, disable country, burn, assert country still exists while only account level attributes get deleted", async () => {
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
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, false);

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
      )

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
      await passport.connect(minterA).burnPassports();
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, true);

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
        [],
        [],
        []
      );
    });

    it("success - mint for business, disable issuer, burn, assert only account level items were deleted", async () => {
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
        [verifiedAt],
        true
      );

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
        governance.connect(admin).setIssuerStatus(issuer.address, false)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer.address, false);

      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        1
      );
      await mockBusiness.burnPassports();
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        0
      );

      await expect(
        governance.connect(admin).setIssuerStatus(issuer.address, true)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer.address, true);

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
      );

      await assertGetAttributes(
        mockBusiness,
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
        mockBusiness,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
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
        [verifiedAt],
        true
      );
    });

    it("success - mint 2 passports for business, delete issuerA, burn, assert only account level items were deleted", async () => {
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

      await expect(governance.connect(admin).deleteIssuer(issuer.address))
        .to.emit(governance, "IssuerDeleted")
        .withArgs(issuer.address);

      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        1
      );
      await mockBusiness.burnPassports();
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        0
      );

      await expect(
        governance
          .connect(admin)
          .addIssuer(issuer.address, issuerTreasury.address)
      )
        .to.emit(governance, "IssuerAdded")
        .withArgs(issuer.address, issuerTreasury.address);

      await assertGetAttributes(
        mockBusiness,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
      );

      await assertGetAttributes(
        mockBusiness,
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
        mockBusiness,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        [],
        true
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
        [issuerB, issuer],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt],
        true
      );
    });

    it("success - mint 2 passports for business, burn, assert AML still exists", async () => {
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

      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        1
      );
      await mockBusiness.burnPassports();
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(
        0
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
        [issuer, issuerB],
        [businessAttributes, businessAttributes],
        [verifiedAt, verifiedAt],
        true
      );
    });

    it("mint for individual, disable issuer, burn, assert only account level items were deleted", async () => {
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

      await expect(
        governance.connect(admin).setIssuerStatus(issuer.address, false)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer.address, false);

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await passport.connect(minterA).burnPassports();
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

      await expect(
        governance.connect(admin).setIssuerStatus(issuer.address, true)
      )
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer.address, true);

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

      // Re-attest DID
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
        [verifiedAt]
      );
    });

    it("mint 2 passports for individual, delete issuerA, burn, assert only account level items were deleted", async () => {
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

      await expect(governance.connect(admin).deleteIssuer(issuer.address))
        .to.emit(governance, "IssuerDeleted")
        .withArgs(issuer.address);

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      await passport.connect(minterA).burnPassports();
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

      await expect(
        governance
          .connect(admin)
          .addIssuer(issuer.address, issuerTreasury.address)
      )
        .to.emit(governance, "IssuerAdded")
        .withArgs(issuer.address, issuerTreasury.address);

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
        [issuerB, issuer],
        [attributes, attributes],
        [verifiedAt, verifiedAt]
      );
    });

    it("success - mint passport for individual, burn, mint new passport, assert old data was overwritten", async () => {
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
      await passport.connect(minterA).burnPassports();
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

      const attributesCopy = Object.assign({}, attributes);
      attributesCopy[ATTRIBUTE_DID] = id("prof. lambo");
      attributesCopy[ATTRIBUTE_AML] = hexZeroPad("0x0a", 32);
      attributesCopy[ATTRIBUTE_COUNTRY] = id("UR");
      attributesCopy[ATTRIBUTE_IS_BUSINESS] = id("TRUE");

      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributesCopy,
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
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );
    });

    it("fail - when paused", async () => {
      await passport.connect(admin).pause();

      await expect(passport.connect(admin).burnPassports()).to.revertedWith(
        "Pausable: paused"
      );
    });
  });
});
