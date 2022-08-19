import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { formatBytes32String, id } from "ethers/lib/utils";

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

describe("QuadPassport", async () => {
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

  describe("burnPassport", async () => {
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

      const attributesCopy = Object.assign({}, attributes);
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
      attributesCopy[ATTRIBUTE_AML] = id("10");

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

    it("fails - EOA passport non-existent under token id=2", async () => {
      expect(await passport.balanceOf(minterA.address, 2)).to.equal(0);
      await passport.connect(minterA).burnPassports();
      expect(await passport.balanceOf(minterA.address, 2)).to.equal(0);

      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE,
          2
        )
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fails - IS_BUSINESS=true passport non-existent under token id=2", async () => {
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
          issuedAt,
          2
        )
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");

      expect(await passport.balanceOf(mockBusiness.address, 2)).to.equal(0);
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

      await expect(
        assertGetAttributes(
          mockBusiness,
          ATTRIBUTE_COUNTRY,
          reader,
          defi,
          treasury,
          [issuer],
          [businessAttributes],
          [verifiedAt]
        )
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");

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

      await governance.connect(admin).setEligibleAttribute(ATTRIBUTE_COUNTRY, false);

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

      await expect(
        assertGetAttributes(
          minterA,
          ATTRIBUTE_COUNTRY,
          reader,
          defi,
          treasury,
          [issuer],
          [attributes],
          [verifiedAt]
        )
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");

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
      await passport.connect(minterA).burnPassports()
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

    // it("success - mint for business, disable issuer, burn, assert only account level items were deleted", async () => {
    //   const MockBusiness = await ethers.getContractFactory('MockBusiness')
    //   const mockBusiness = await MockBusiness.deploy(defi.address)
    //   await mockBusiness.deployed()

    //   await expect(
    //     setAttributesIssuer(
    //       mockBusiness,
    //       issuer,
    //       passport,
    //       businessAttributes,
    //       verifiedAt,
    //       issuedAt
    //     )
    //   ).to.not.be.reverted;

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_AML,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer],
    //     [businessAttributes],
    //     [verifiedAt],
    //     true
    //   );

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_COUNTRY,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer],
    //     [businessAttributes],
    //     [verifiedAt],
    //     true
    //   );

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_DID,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer],
    //     [businessAttributes],
    //     [verifiedAt],
    //     true
    //   );

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_IS_BUSINESS,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer],
    //     [businessAttributes],
    //     [verifiedAt],
    //     true
    //   );

    //   await expect(governance.connect(admin).setIssuerStatus(issuer.address, false))
    //     .to.emit(governance, 'IssuerStatusChanged')
    //     .withArgs(issuer.address, false);

    //   expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);
    //   await mockBusiness.burnPassports();
    //   expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(0);

    //   await expect(governance.connect(admin).setIssuerStatus(issuer.address, true))
    //     .to.emit(governance, 'IssuerStatusChanged')
    //     .withArgs(issuer.address, true);

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_COUNTRY,
    //     reader,
    //     defi,
    //     treasury,
    //     [],
    //     [],
    //     [],
    //     true
    //   );

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_DID,
    //     reader,
    //     defi,
    //     treasury,
    //     [],
    //     [],
    //     [],
    //     true
    //   );

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_IS_BUSINESS,
    //     reader,
    //     defi,
    //     treasury,
    //     [],
    //     [],
    //     [],
    //     true
    //   );

    //   const attributesCopy = Object.assign({}, businessAttributes);
    //   delete attributesCopy[ATTRIBUTE_AML];

    //   await expect(
    //     setAttributesIssuer(
    //       mockBusiness,
    //       issuer,
    //       passport,
    //       attributesCopy,
    //       verifiedAt + 1,
    //       issuedAt
    //     )
    //   ).to.not.be.reverted;

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_AML,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer],
    //     [businessAttributes],
    //     [verifiedAt],
    //     true
    //   );
    // });

    // it("success - mint 2 passports for business, delete issuerA, burn, assert only account level items were deleted from issuerB", async () => {
    //   const MockBusiness = await ethers.getContractFactory('MockBusiness')
    //   const mockBusiness = await MockBusiness.deploy(defi.address)
    //   await mockBusiness.deployed()

    //   await expect(
    //     setAttributesIssuer(
    //       mockBusiness,
    //       issuer,
    //       passport,
    //       businessAttributes,
    //       verifiedAt,
    //       issuedAt
    //     )
    //   ).to.not.be.reverted;

    //   await expect(
    //     setAttributesIssuer(
    //       mockBusiness,
    //       issuerB,
    //       passport,
    //       businessAttributes,
    //       verifiedAt,
    //       issuedAt
    //     )
    //   ).to.not.be.reverted;

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_AML,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer, issuerB],
    //     [businessAttributes, businessAttributes],
    //     [verifiedAt, verifiedAt],
    //     true
    //   );

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_COUNTRY,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer, issuerB],
    //     [businessAttributes, businessAttributes],
    //     [verifiedAt, verifiedAt],
    //     true
    //   );

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_DID,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer, issuerB],
    //     [businessAttributes, businessAttributes],
    //     [verifiedAt, verifiedAt],
    //     true
    //   );

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_IS_BUSINESS,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer, issuerB],
    //     [businessAttributes, businessAttributes],
    //     [verifiedAt, verifiedAt],
    //     true
    //   );

    //   await expect(governance.connect(admin).deleteIssuer(issuer.address))
    //     .to.emit(governance, 'IssuerDeleted')
    //     .withArgs(issuer.address);

    //   expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);
    //   await mockBusiness.burnPassports();
    //   expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(0);

    //   await expect(governance.connect(admin).addIssuer(issuer.address, issuerTreasury.address))
    //     .to.emit(governance, 'IssuerAdded')
    //     .withArgs(issuer.address, issuerTreasury.address);

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_AML,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer, issuerB],
    //     [businessAttributes, businessAttributes],
    //     [verifiedAt, verifiedAt],
    //     true
    //   );

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_COUNTRY,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer],
    //     [businessAttributes],
    //     [verifiedAt],
    //     true
    //   );

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_DID,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer],
    //     [businessAttributes],
    //     [verifiedAt],
    //     true
    //   );

    //   await assertGetAttributes(
    //     mockBusiness,
    //     ATTRIBUTE_IS_BUSINESS,
    //     reader,
    //     defi,
    //     treasury,
    //     [issuer],
    //     [businessAttributes],
    //     [verifiedAt],
    //     true
    //   );
    // });

    it("success - mint 2 passports for business, burn, assert AML still exists", async () => {
      const MockBusiness = await ethers.getContractFactory('MockBusiness')
      const mockBusiness = await MockBusiness.deploy(defi.address)
      await mockBusiness.deployed()

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


      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);
      await mockBusiness.burnPassports();
      expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(0);

      // Re-attest DID
      await expect(
        setAttributesIssuer(
          mockBusiness,
          issuer,
          passport,
          {[ATTRIBUTE_DID]:  formatBytes32String("did:quad:businessworld")},
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

    // it("mint for individual, disable issuer, burn, assert only account level items were deleted", async () => {

    //   // PRE BURN
    //   // did level
    //   const amlPreBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //   // account level
    //   const didPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuer.address);
    //   const countryPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuer.address);
    //   const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //   expect(didPreBurnA.value).equals(did);
    //   expect(countryPreBurnA.value).equals(country);
    //   expect(isBusinessPreBurnA.value).equals(isBusiness);

    //   // disable issuer for burn
    //   await expect(governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED))
    //     .to.emit(governance, 'IssuerStatusChanged')
    //     .withArgs(issuer.address, ISSUER_STATUS.ACTIVE, ISSUER_STATUS.DEACTIVATED);

    //   expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    //   await passport.connect(minterA).burnPassports(TOKEN_ID);
    //   expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

    //   // enable issuer to query data
    //   await expect(governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.ACTIVE))
    //     .to.emit(governance, 'IssuerStatusChanged')
    //     .withArgs(issuer.address, ISSUER_STATUS.DEACTIVATED, ISSUER_STATUS.ACTIVE);

    //   // POST BURN
    //   // did level
    //   const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //   // account level
    //   const didPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuer.address);
    //   const countryPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuer.address);
    //   const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuer.address);

    //   // expect did level attributes to not change
    //   expect(amlPostBurnA.value).equals(amlPreBurnA.value);

    //   expect(didPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //   expect(countryPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //   expect(isBusinessPostBurnA.value).equals(hexZeroPad('0x00', 32));

    // });

    // it("mint 2 passports for individual, delete issuerA, burn, assert only account level items were deleted from issuerB", async () => {

    //   // PRE BURN
    //   const sig = await signSetAttributes(
    //     issuerB,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const sigAccount = await signAccount(minterA);

    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
    //         value: MINT_PRICE,
    //       })
    //   ).to.not.be.reverted;

    //   // did level
    //   const amlPreBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //   const amlPreBurnB = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuerB.address);
    //   // account level
    //   const didPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuer.address);
    //   const didPreBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuerB.address);
    //   const countryPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuer.address);
    //   const countryPreBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuerB.address);
    //   const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //   const isBusinessPreBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuerB.address);

    //   expect(didPreBurnA.value).equals(did);
    //   expect(didPreBurnB.value).equals(did);
    //   expect(countryPreBurnA.value).equals(country);
    //   expect(countryPreBurnB.value).equals(country);
    //   expect(isBusinessPreBurnA.value).equals(isBusiness);
    //   expect(isBusinessPreBurnB.value).equals(isBusiness);

    //   // delete issuer pre burn
    //   await expect(governance.connect(admin).deleteIssuer(issuer.address))
    //     .to.emit(governance, 'IssuerDeleted')
    //     .withArgs(issuer.address);

    //   expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    //   await passport.connect(minterA).burnPassports(TOKEN_ID);
    //   expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

    //   // add issuer post burn (in order to access data)
    //   await expect(governance.connect(admin).setIssuer(issuer.address, issuerTreasury.address))
    //     .to.emit(governance, 'IssuerAdded')
    //     .withArgs(issuer.address, issuerTreasury.address);

    //   // POST BURN
    //   // did level
    //   const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //   const amlPostBurnB = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuerB.address);
    //   // account level
    //   const didPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuer.address);
    //   const didPostBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuerB.address);
    //   const countryPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuer.address);
    //   const countryPostBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuerB.address);
    //   const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //   const isBusinessPostBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuerB.address);

    //   // expect did level attributes to not change
    //   expect(amlPostBurnA.value).equals(amlPreBurnA.value);
    //   expect(amlPreBurnB.value).equals(amlPostBurnB.value);

    //   expect(didPostBurnA.value).equals(didPreBurnA.value);
    //   expect(didPostBurnB.value).equals(hexZeroPad('0x00', 32));
    //   expect(countryPostBurnA.value).equals(countryPreBurnA.value);
    //   expect(countryPostBurnB.value).equals(hexZeroPad('0x00', 32));
    //   expect(isBusinessPostBurnA.value).equals(isBusinessPreBurnA.value);
    //   expect(isBusinessPostBurnB.value).equals(hexZeroPad('0x00', 32));

    // });

    //   it("success - mint passport for individual, burn, mint new passport, assert old data was overwritten", async () => {

    //     // PRE BURN
    //     // did level
    //     const amlPreBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //     // account level
    //     const didPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuer.address);
    //     const countryPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuer.address);
    //     const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuer.address);

    //     expect(didPreBurnA.value).equals(did);
    //     expect(countryPreBurnA.value).equals(country);
    //     expect(isBusinessPreBurnA.value).equals(isBusiness);

    //     expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    //     await passport.connect(minterA).burnPassports(TOKEN_ID);
    //     expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

    //     // set different values for next passport
    //     did = id("Prof. Lambo");
    //     aml = id("HIGH");
    //     country = id("UR");
    //     isBusiness = id("TRUE");

    //     const sig = await signSetAttributes(
    //       issuer,
    //       minterA,
    //       TOKEN_ID,
    //       did,
    //       aml,
    //       country,
    //       isBusiness,
    //       issuedAt
    //     );

    //     const sigAccount = await signAccount(minterA);

    //     await expect(
    //       passport
    //         .connect(minterA)
    //         .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
    //           value: MINT_PRICE,
    //         })
    //     ).to.not.be.reverted;

    //     // POST BURN
    //     // did level
    //     const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //     // account level
    //     const didPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuer.address);
    //     const countryPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuer.address);
    //     const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuer.address);

    //     expect(amlPostBurnA.value).equals(aml);
    //     expect(didPostBurnA.value).equals(did);
    //     expect(countryPostBurnA.value).equals(country);
    //     expect(isBusinessPostBurnA.value).equals(isBusiness);

    //   });
  });

  describe("burnPassportsIssuer", async () => {
    // it("success - burnPassportsIssuer for business contract", async () => {
    // TODO Later
    // const MockBusiness = await ethers.getContractFactory('MockBusiness')
    // const mockBusiness = await MockBusiness.deploy(defi.address)
    // await mockBusiness.deployed()
    // await expect(
    //   setAttributes(
    //     mockBusiness,
    //     issuer,
    //     passport,
    //     businessAttributes,
    //     verifiedAt,
    //     issuedAt,
    //     MINT_PRICE
    //   )
    // ).to.not.be.reverted;

    // const amlAttributes =  await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_AML);
    // await assertGetAttributeFree(
    //   [issuer.address],
    //   mockBusiness,
    //   defi,
    //   passport,
    //   reader,
    //   ATTRIBUTE_AML,
    //   aml,
    //   issuedAt,
    //   1,
    //   {
    //     signer: minterB,
    //     mockBusiness: mockBusiness
    //   }
    // );
    // await assertGetAttribute(
    //   mockBusiness,
    //   treasury,
    //   issuer,
    //   issuerTreasury,
    //   usdc,
    //   defi,
    //   passport,
    //   reader,
    //   ATTRIBUTE_COUNTRY,
    //   country,
    //   issuedAt,
    //   1,
    //   {
    //     ATTRIBUTE_PRICE: PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY],
    //     signer: minterB,
    //     mockBusiness: mockBusiness
    //   }
    // );
    // await assertGetAttribute(
    //   mockBusiness,
    //   treasury,
    //   issuer,
    //   issuerTreasury,
    //   usdc,
    //   defi,
    //   passport,
    //   reader,
    //   ATTRIBUTE_DID,
    //   did,
    //   issuedAt,
    //   1,
    //   {
    //     ATTRIBUTE_PRICE: PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY],
    //     signer: minterB,
    //     mockBusiness: mockBusiness
    //   }
    // );

    // // PRE BURN
    // // did level
    // const amlPreBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    // // account level
    // const didPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuer.address);
    // const countryPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuer.address);
    // const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    // expect(didPreBurnA.value).equals(did);
    // expect(countryPreBurnA.value).equals(country);
    // expect(isBusinessPreBurnA.value).equals(id("TRUE"));

    // expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);
    // await passport
    //   .connect(issuer)
    //   .burnPassportsIssuer(mockBusiness.address, TOKEN_ID);
    // expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(0);

    // // POST BURN
    // // did level
    // const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    // // account level
    // const didPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuer.address);
    // const countryPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuer.address);
    // const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuer.address);

    // // expect did level attributes to not change
    // expect(amlPostBurnA.value).equals(amlPreBurnA.value);

    // expect(didPostBurnA.value).equals(hexZeroPad('0x00', 32));
    // expect(countryPostBurnA.value).equals(hexZeroPad('0x00', 32));
    // expect(isBusinessPostBurnA.value).equals(hexZeroPad('0x00', 32));

    // await expect(
    //   reader.getAttributesTokenIncludingOnly(
    //     mockBusiness.address,
    //     TOKEN_ID,
    //     ATTRIBUTE_AML,
    //     usdc.address,
    //     [issuer.address]
    //   )
    // ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

    // await expect(
    //   reader.getAttributesTokenIncludingOnly(
    //     mockBusiness.address,
    //     TOKEN_ID,
    //     ATTRIBUTE_COUNTRY,
    //     usdc.address,
    //     [issuer.address]
    //   )
    // ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

    // await expect(
    //   reader.getAttributesTokenIncludingOnly(
    //     mockBusiness.address,
    //     TOKEN_ID,
    //     ATTRIBUTE_DID,
    //     usdc.address,
    //     [issuer.address]
    //   )
    // ).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    // });

    // it("success - mint individual, update AML to 10, deactivate, reactivate, assert AML is still 10", async () => {
    //   // this is AML 10 as a bytes32 encoded hex
    //   attributes[ATTRIBUTE_AML] = hexZeroPad('0x0a', 32);

    //   await expect(
    //     setAttributes(
    //       minterB,
    //       issuer,
    //       passport,
    //       attributes,
    //       verifiedAt,
    //       issuedAt,
    //       MINT_PRICE
    //     )
    //   ).to.not.be.reverted;

    //   // PRE BURN
    //   // account level
    //   const didAttributesPre =  await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_DID);
    //   expect(didAttributesPre.length).equals(1);
    //   const didPreBurnA = didAttributesPre[0];

    //   const countryAttributesPre =  await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_COUNTRY);
    //   expect(countryAttributesPre.length).equals(1);
    //   const countryPreBurnA = countryAttributesPre[0];

    //   const isBusinessAttributesPre =  await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_IS_BUSINESS);
    //   expect(isBusinessAttributesPre.length).equals(1);
    //   const isBusinessPreBurnA = isBusinessAttributesPre[0];

    //   expect(didPreBurnA.value).equals(did);
    //   expect(countryPreBurnA.value).equals(country);
    //   expect(isBusinessPreBurnA.value).equals(isBusiness);

    //   // // disable issuer for burn
    //   await expect(governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED))
    //     .to.emit(governance, 'IssuerStatusChanged')
    //     .withArgs(issuer.address, ISSUER_STATUS.ACTIVE, ISSUER_STATUS.DEACTIVATED);

    //   // // enable issuer
    //   // await expect(governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.ACTIVE))
    //   //   .to.emit(governance, 'IssuerStatusChanged')
    //   //   .withArgs(issuer.address, ISSUER_STATUS.DEACTIVATED, ISSUER_STATUS.ACTIVE);

    //   // // POST BURN
    //   // // did level
    //   // const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //   // // account level
    //   // const didPostBurnA = await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_DID, issuer.address);
    //   // const countryPostBurnA = await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_COUNTRY, issuer.address);
    //   // const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_IS_BUSINESS, issuer.address);

    //   // // expect did level attributes to not change
    //   // expect(amlPostBurnA.value).equals(hexZeroPad('0x0a', 32)); // check aml is still 10

    //   // expect(didPostBurnA.value).equals(didPreBurnA.value);
    //   // expect(countryPostBurnA.value).equals(countryPreBurnA.value);
    //   // expect(isBusinessPostBurnA.value).equals(isBusinessPreBurnA.value);
    // })

    //   it("success - mint individual, update AML to 10, deactivate, reactivate, burn, assert AML is still 10", async () => {
    //     aml = hexZeroPad('0x0a', 32); // this is AML 10 as a bytes32 encoded hex

    //     const sig = await signSetAttributes(
    //       issuer,
    //       minterB,
    //       TOKEN_ID,
    //       did,
    //       aml,
    //       country,
    //       isBusiness,
    //       issuedAt
    //     );

    //     const sigAccount = await signAccount(minterB);

    //     await passport
    //       .connect(minterB)
    //       .mintPassport([minterB.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
    //         value: MINT_PRICE,
    //       });

    //     // PRE BURN
    //     // did level
    //     // account level
    //     const didPreBurnA = await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_DID, issuer.address);
    //     const countryPreBurnA = await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_COUNTRY, issuer.address);
    //     const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //     expect(didPreBurnA.value).equals(did);
    //     expect(countryPreBurnA.value).equals(country);
    //     expect(isBusinessPreBurnA.value).equals(isBusiness);

    //     // disable issuer for burn
    //     await expect(governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED))
    //       .to.emit(governance, 'IssuerStatusChanged')
    //       .withArgs(issuer.address, ISSUER_STATUS.ACTIVE, ISSUER_STATUS.DEACTIVATED);

    //     // enable issuer
    //     await expect(governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.ACTIVE))
    //       .to.emit(governance, 'IssuerStatusChanged')
    //       .withArgs(issuer.address, ISSUER_STATUS.DEACTIVATED, ISSUER_STATUS.ACTIVE);

    //     expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(1);
    //     await passport.connect(issuer).burnPassportsIssuer(minterB.address, TOKEN_ID);
    //     expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);

    //     // POST BURN
    //     // did level
    //     const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //     // account level
    //     const didPostBurnA = await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_DID, issuer.address);
    //     const countryPostBurnA = await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_COUNTRY, issuer.address);
    //     const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(minterB.address, ATTRIBUTE_IS_BUSINESS, issuer.address);

    //     // expect did level attributes to not change
    //     expect(amlPostBurnA.value).equals(hexZeroPad('0x0a', 32)); // check aml is still 10

    //     expect(didPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //     expect(countryPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //     expect(isBusinessPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //   })

    //   it("success - mint business, update AML to 10, deactivate, reactivate, assert AML is still 10", async () => {
    //     aml = hexZeroPad('0x0a', 32); // this is AML 10 as a bytes32 encoded hex
    //     it("success - burnPassportsIssuer for business contract given 2 issuers", async () => {

    //       isBusiness = id("TRUE");

    //       const MockBusiness = await ethers.getContractFactory('MockBusiness')
    //       const mockBusiness = await MockBusiness.deploy(defi.address)
    //       await mockBusiness.deployed()

    //       const sigA = await signSetAttributes(
    //         issuer,
    //         mockBusiness,
    //         TOKEN_ID,
    //         did,
    //         aml,
    //         country,
    //         isBusiness,
    //         issuedAt
    //       );

    //       const sigAccount = '0x00'

    //       await passport
    //         .connect(minterB)
    //         .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigA, sigAccount, {
    //           value: MINT_PRICE,
    //         });

    //       const sigB = await signSetAttributes(
    //         issuerB,
    //         mockBusiness,
    //         TOKEN_ID,
    //         did,
    //         aml,
    //         country,
    //         isBusiness,
    //         issuedAt
    //       );

    //       await passport
    //         .connect(minterB)
    //         .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigB, sigAccount, {
    //           value: MINT_PRICE,
    //         });

    //       // PRE BURN
    //       // did level
    //       const amlPreBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //       const amlPreBurnB = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuerB.address);
    //       // account level
    //       const didPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuer.address);
    //       const didPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuerB.address);
    //       const countryPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuer.address);
    //       const countryPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuerB.address);
    //       const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //       const isBusinessPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuerB.address);

    //       expect(didPreBurnA.value).equals(did);
    //       expect(didPreBurnB.value).equals(did);
    //       expect(countryPreBurnA.value).equals(country);
    //       expect(countryPreBurnB.value).equals(country);
    //       expect(isBusinessPreBurnA.value).equals(isBusiness);
    //       expect(isBusinessPreBurnB.value).equals(isBusiness);

    //       expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);
    //       await passport
    //         .connect(issuer)
    //         .burnPassportsIssuer(mockBusiness.address, TOKEN_ID);
    //       expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);

    //       // POST BURN
    //       // did level
    //       const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //       const amlPostBurnB = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuerB.address);
    //       // account level
    //       const didPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuer.address);
    //       const didPostBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuerB.address);
    //       const countryPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuer.address);
    //       const countryPostBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuerB.address);
    //       const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //       const isBusinessPostBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuerB.address);

    //       // expect did level attributes to not change
    //       expect(amlPostBurnA.value).equals(amlPreBurnA.value);
    //       expect(amlPostBurnB.value).equals(amlPreBurnB.value);

    //       expect(didPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //       expect(didPostBurnB.value).equals(didPreBurnB.value);
    //       expect(countryPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //       expect(countryPostBurnB.value).equals(countryPreBurnB.value);
    //       expect(isBusinessPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //       expect(isBusinessPostBurnB.value).equals(isBusinessPreBurnB.value);

    //     });

    //     it("success - burnPassportsIssuer for individual given 2 issuers", async () => {

    //       const sigB = await signSetAttributes(
    //         issuerB,
    //         minterA,
    //         TOKEN_ID,
    //         did,
    //         aml,
    //         country,
    //         isBusiness,
    //         issuedAt
    //       );

    //       const sigAccount = await signAccount(minterA);

    //       await passport
    //         .connect(minterB)
    //         .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigB, sigAccount, {
    //           value: MINT_PRICE,
    //         });

    //       // PRE BURN
    //       // did level
    //       const amlPreBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //       const amlPreBurnB = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuerB.address);
    //       // account level
    //       const didPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuer.address);
    //       const didPreBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuerB.address);
    //       const countryPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuer.address);
    //       const countryPreBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuerB.address);
    //       const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //       const isBusinessPreBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuerB.address);

    //       expect(didPreBurnA.value).equals(did);
    //       expect(didPreBurnB.value).equals(did);
    //       expect(countryPreBurnA.value).equals(country);
    //       expect(countryPreBurnB.value).equals(country);
    //       expect(isBusinessPreBurnA.value).equals(isBusiness);
    //       expect(isBusinessPreBurnB.value).equals(isBusiness);

    //       expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    //       await passport
    //         .connect(issuer)
    //         .burnPassportsIssuer(minterA.address, TOKEN_ID);
    //       expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);

    //       // POST BURN
    //       // did level
    //       const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //       const amlPostBurnB = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuerB.address);
    //       // account level
    //       const didPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuer.address);
    //       const didPostBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuerB.address);
    //       const countryPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuer.address);
    //       const countryPostBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuerB.address);
    //       const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //       const isBusinessPostBurnB = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuerB.address);

    //       // expect did level attributes to not change
    //       expect(amlPostBurnA.value).equals(amlPreBurnA.value);
    //       expect(amlPostBurnB.value).equals(amlPreBurnB.value);

    //       expect(didPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //       expect(didPostBurnB.value).equals(didPreBurnB.value);
    //       expect(countryPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //       expect(countryPostBurnB.value).equals(countryPreBurnB.value);
    //       expect(isBusinessPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //       expect(isBusinessPostBurnB.value).equals(isBusinessPreBurnB.value);

    //     });

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
        passport.connect(issuer).burnPassportsIssuer(minterA.address)
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
        passport.connect(issuer).burnPassportsIssuer(minterA.address)
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
        passport.connect(issuerB).burnPassportsIssuer(minterA.address)
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

    //     it("success - mint 2 business passports, deactivate issuerA, burnIssuerA, then assert only account level attributes remain on issuerB", async () => {
    //       isBusiness = id("TRUE");

    //       const MockBusiness = await ethers.getContractFactory('MockBusiness')
    //       const mockBusiness = await MockBusiness.deploy(defi.address)
    //       await mockBusiness.deployed()

    //       const sig = await signSetAttributes(
    //         issuer,
    //         mockBusiness,
    //         TOKEN_ID,
    //         did,
    //         aml,
    //         country,
    //         id("TRUE"),
    //         issuedAt
    //       );

    //       const sigAccount = '0x00';

    //       await passport
    //         .connect(minterB)
    //         .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt], sig, sigAccount, {
    //           value: MINT_PRICE,
    //         });

    //       const sigB = await signSetAttributes(
    //         issuerB,
    //         mockBusiness,
    //         TOKEN_ID,
    //         did,
    //         aml,
    //         country,
    //         isBusiness,
    //         issuedAt
    //       );

    //       await passport
    //         .connect(minterB)
    //         .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigB, sigAccount, {
    //           value: MINT_PRICE,
    //         });

    //       // PRE BURN
    //       // did level
    //       const amlPreBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //       const amlPreBurnB = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuerB.address);
    //       // account level
    //       const didPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuer.address);
    //       const didPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuerB.address);
    //       const countryPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuer.address);
    //       const countryPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuerB.address);
    //       const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //       const isBusinessPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuerB.address);
    //       it("success - mint for individual, make country not eligible, burnPassportsIssuer, assert country isn't deleted", async () => {
    //         // PRE BURN
    //         // did level
    //         const amlPreBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //         // account level
    //         const didPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_DID, issuer.address);
    //         const countryPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_COUNTRY, issuer.address);
    //         const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(minterA.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //         expect(didPreBurnA.value).equals(did);
    //         expect(countryPreBurnA.value).equals(country);
    //         expect(isBusinessPreBurnA.value).equals(isBusiness);

    //         expect(didPreBurnB.value).equals(did);
    //         expect(countryPreBurnB.value).equals(country);
    //         expect(isBusinessPreBurnB.value).equals(isBusiness);

    //         // disable issuer for burn
    //         await expect(governance.connect(admin).setIssuerStatus(issuer.address, 1))
    //           .to.emit(governance, 'IssuerStatusChanged')
    //           .withArgs(issuer.address, 0, 1);

    //         expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);
    //         await passport.connect(issuerB).burnPassportsIssuer(mockBusiness.address, TOKEN_ID);
    //         expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);

    //         // enable issuer to see what the storage values are
    //         await expect(governance.connect(admin).setIssuerStatus(issuer.address, 0))
    //           .to.emit(governance, 'IssuerStatusChanged')
    //           .withArgs(issuer.address, 1, 0);
    //         await expect(governance.connect(admin).setEligibleAttribute(ATTRIBUTE_COUNTRY, false))
    //           .to.emit(governance, 'EligibleAttributeUpdated')
    //           .withArgs(ATTRIBUTE_COUNTRY, false);

    //         expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    //         await passport
    //           .connect(issuer)
    //           .burnPassportsIssuer(minterA.address, TOKEN_ID);
    //         expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

    //         // POST BURN
    //         // did level
    //         const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //         const amlPostBurnB = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuerB.address);
    //         // account level
    //         const didPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuer.address);
    //         const countryPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuer.address);
    //         const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //         const didPostBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuerB.address);
    //         const countryPostBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuerB.address);
    //         const isBusinessPostBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuerB.address);

    //         // expect did level attributes to not change
    //         expect(amlPostBurnB.value).equals(amlPreBurnB.value);
    //         expect(amlPostBurnA.value).equals(amlPreBurnA.value);

    //         expect(didPostBurnA.value).equals(didPreBurnA.value);
    //         expect(countryPostBurnA.value).equals(countryPreBurnA.value);
    //         expect(isBusinessPostBurnA.value).equals(isBusinessPreBurnA.value);

    //         expect(didPostBurnB.value).equals(hexZeroPad('0x00', 32));
    //         expect(countryPostBurnB.value).equals(hexZeroPad('0x00', 32));
    //         expect(isBusinessPostBurnB.value).equals(hexZeroPad('0x00', 32));
    //       });

    //       it("success - mint 2 business passports, delete issuerA, burnIssuerA, then assert only account level attributes remain on issuerB", async () => {
    //         isBusiness = id("TRUE");

    //         const MockBusiness = await ethers.getContractFactory('MockBusiness')
    //         const mockBusiness = await MockBusiness.deploy(defi.address)
    //         await mockBusiness.deployed()

    //         const sigA = await signSetAttributes(
    //           issuer,
    //           mockBusiness,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           id("TRUE"),
    //           issuedAt
    //         );

    //         const sigAccount = '0x00';

    //         await passport
    //           .connect(minterB)
    //           .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt], sig, sigAccount, {
    //             value: MINT_PRICE,
    //           });

    //         const sigB = await signSetAttributes(
    //           issuerB,
    //           mockBusiness,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt
    //         );
    //         await passport
    //           .connect(minterB)
    //           .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigA, sigAccount, {
    //             value: MINT_PRICE,
    //           });

    //         // PRE BURN
    //         // did level
    //         const amlPreBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //         const amlPreBurnB = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuerB.address);
    //         // account level
    //         const didPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuer.address);
    //         const didPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuerB.address);
    //         const countryPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuer.address);
    //         const countryPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuerB.address);
    //         const isBusinessPreBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuer.address);
    //         const isBusinessPreBurnB = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuerB.address);
    //         expect(didPreBurnA.value).equals(did);
    //         expect(countryPreBurnA.value).equals(country);
    //         expect(isBusinessPreBurnA.value).equals(isBusiness);

    //         await expect(governance.connect(admin).setEligibleAttribute(ATTRIBUTE_COUNTRY, false))
    //           .to.emit(governance, 'EligibleAttributeUpdated')
    //           .withArgs(ATTRIBUTE_COUNTRY, false);

    //         expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(1);
    //         await passport
    //           .connect(issuer)
    //           .burnPassportsIssuer(mockBusiness.address, TOKEN_ID);
    //         expect(await passport.balanceOf(mockBusiness.address, TOKEN_ID)).to.equal(0);

    //         // POST BURN
    //         // did level
    //         const amlPostBurnA = await passport.connect(dataChecker).attributesByDID(did, ATTRIBUTE_AML, issuer.address);
    //         // account level
    //         const didPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_DID, issuer.address);
    //         const countryPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_COUNTRY, issuer.address);
    //         const isBusinessPostBurnA = await passport.connect(dataChecker).attributes(mockBusiness.address, ATTRIBUTE_IS_BUSINESS, issuer.address);

    //         // expect did level attributes to not change
    //         expect(amlPostBurnA.value).equals(amlPreBurnA.value);

    //         expect(didPostBurnA.value).equals(hexZeroPad('0x00', 32));
    //         expect(countryPostBurnA.value).equals(countryPreBurnA.value);
    //         expect(isBusinessPostBurnA.value).equals(hexZeroPad('0x00', 32));

    //       });

    //       it("success - can remint after burn", async () => {
    //         await passport
    //           .connect(issuer)
    //           .burnPassportsIssuer(minterA.address, TOKEN_ID);
    //         expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(0);

    //         const newIssuedAt = issuedAt + 1;
    //         const newAML = id("HIGH");

    //         const sig = await signSetAttributes(
    //           issuer,
    //           minterA,
    //           TOKEN_ID,
    //           did,
    //           newAML,
    //           country,
    //           isBusiness,
    //           newIssuedAt
    //         );

    //         const sigAccount = await signAccount(minterA);

    //         await passport
    //           .connect(admin)
    //           .mintPassport([minterA.address, TOKEN_ID, did, newAML, country, isBusiness, newIssuedAt], sig, sigAccount, {
    //             value: MINT_PRICE,
    //           });

    //         await assertGetAttributeFree(
    //           [issuer.address],
    //           minterA,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_AML,
    //           newAML,
    //           newIssuedAt
    //         );
    //         await assertGetAttribute(
    //           minterA,
    //           treasury,
    //           issuer,
    //           issuerTreasury,
    //           usdc,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_COUNTRY,
    //           country,
    //           newIssuedAt
    //         );
    //         await assertGetAttribute(
    //           minterA,
    //           treasury,
    //           issuer,
    //           issuerTreasury,
    //           usdc,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_DID,
    //           did,
    //           newIssuedAt
    //         );
    //         expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    //       });

    //       it("fail - invalid tokenId", async () => {
    //         expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    //         const wrongTokenId = 2;
    //         await expect(
    //           passport
    //             .connect(issuer)
    //             .burnPassportsIssuer(minterA.address, wrongTokenId)
    //         ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
    //         expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    //         await assertGetAttributeFree(
    //           [issuer.address],
    //           minterA,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_AML,
    //           aml,
    //           issuedAt
    //         );
    //         await assertGetAttribute(
    //           minterA,
    //           treasury,
    //           issuer,
    //           issuerTreasury,
    //           usdc,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_COUNTRY,
    //           country,
    //           issuedAt
    //         );
    //         await assertGetAttribute(
    //           minterA,
    //           treasury,
    //           issuer,
    //           issuerTreasury,
    //           usdc,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_DID,
    //           did,
    //           issuedAt
    //         );
    //       });

    //       it("fail - passport non-existent (account never had attested data)", async () => {
    //         expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
    //         await expect(
    //           passport.connect(issuer).burnPassportsIssuer(minterB.address, TOKEN_ID)
    //         ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
    //         expect(await passport.balanceOf(minterB.address, TOKEN_ID)).to.equal(0);
    //       });

    //       it("fail - passport non-existent (indiviual account currently has attested data)", async () => {
    //         expect(await passport.balanceOf(minterA.address, 1)).to.equal(1);
    //         expect(await passport.balanceOf(minterA.address, 2)).to.equal(0);
    //         await expect(
    //           passport.connect(issuer).burnPassportsIssuer(minterA.address, 2)
    //         ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
    //         expect(await passport.balanceOf(minterA.address, 1)).to.equal(1);
    //         expect(await passport.balanceOf(minterA.address, 2)).to.equal(0);
    //       });

    //       it("fail - passport non-existent (business account currently has attested data)", async () => {
    //         isBusiness = id("TRUE");

    //         const MockBusiness = await ethers.getContractFactory('MockBusiness')
    //         const mockBusiness = await MockBusiness.deploy(defi.address)
    //         await mockBusiness.deployed()

    //         const sigA = await signSetAttributes(
    //           issuer,
    //           mockBusiness,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt
    //         );

    //         const sigAccount = '0x00'

    //         await passport
    //           .connect(minterB)
    //           .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigA, sigAccount, {
    //             value: MINT_PRICE,
    //           });

    //         expect(await passport.balanceOf(mockBusiness.address, 1)).to.equal(1);
    //         expect(await passport.balanceOf(mockBusiness.address, 2)).to.equal(0);
    //         await expect(
    //           passport.connect(issuer).burnPassportsIssuer(minterA.address, 2)
    //         ).to.revertedWith("CANNOT_BURN_ZERO_BALANCE");
    //         expect(await passport.balanceOf(mockBusiness.address, 1)).to.equal(1);
    //         expect(await passport.balanceOf(mockBusiness.address, 2)).to.equal(0);
    //       });

    //       it("fail - trying to burn indiviual account as a non issuer role", async () => {
    //         await expect(
    //           passport.connect(admin).burnPassportsIssuer(minterB.address, TOKEN_ID)
    //         ).to.revertedWith("INVALID_ISSUER");

    //         expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    //         await assertGetAttributeFree(
    //           [issuer.address],
    //           minterA,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_AML,
    //           aml,
    //           issuedAt
    //         );
    //         await assertGetAttribute(
    //           minterA,
    //           treasury,
    //           issuer,
    //           issuerTreasury,
    //           usdc,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_COUNTRY,
    //           country,
    //           issuedAt
    //         );
    //         await assertGetAttribute(
    //           minterA,
    //           treasury,
    //           issuer,
    //           issuerTreasury,
    //           usdc,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_DID,
    //           did,
    //           issuedAt
    //         );
    //       });

    //       it("fail - trying to burn business account as a non issuer role", async () => {
    //         isBusiness = id("TRUE");

    //         const MockBusiness = await ethers.getContractFactory('MockBusiness')
    //         const mockBusiness = await MockBusiness.deploy(defi.address)
    //         await mockBusiness.deployed()

    //         const sigA = await signSetAttributes(
    //           issuer,
    //           mockBusiness,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt
    //         );

    //         const sigAccount = '0x00'

    //         await passport
    //           .connect(minterB)
    //           .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigA, sigAccount, {
    //             value: MINT_PRICE,
    //           });

    //         await expect(
    //           passport.connect(admin).burnPassportsIssuer(minterB.address, TOKEN_ID)
    //         ).to.revertedWith("INVALID_ISSUER");

    //         expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    //         await assertGetAttributeFree(
    //           [issuer.address],
    //           minterA,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_AML,
    //           aml,
    //           issuedAt
    //         );
    //         await assertGetAttribute(
    //           minterA,
    //           treasury,
    //           issuer,
    //           issuerTreasury,
    //           usdc,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_COUNTRY,
    //           country,
    //           issuedAt
    //         );
    //         await assertGetAttribute(
    //           minterA,
    //           treasury,
    //           issuer,
    //           issuerTreasury,
    //           usdc,
    //           defi,
    //           passport,
    //           reader,
    //           ATTRIBUTE_DID,
    //           did,
    //           issuedAt
    //         );
    //       });
    //     })
    //   });
  });
});
