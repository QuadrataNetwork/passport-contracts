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
  PRICE_PER_ATTRIBUTES_ETH,
  PRICE_PER_BUSINESS_ATTRIBUTES_ETH,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");
const { setAttributesIssuer } = require("../helpers/set_attributes_issuer.ts");

const {
  assertGetAttributesLegacy,
} = require("../helpers/assert/assert_get_attributes_legacy.ts");

describe("QuadReader.getAttributesLegacy", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let defi: Contract; // eslint-disable-line no-unused-vars
  let businessPassport: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuer2: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerTreasury2: SignerWithAddress;

  let issuedAt: number, verifiedAt: number;
  const attributes: any = {
    [ATTRIBUTE_DID]: formatBytes32String("did:quad:helloworld"),
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
    ] = await ethers.getSigners();
    [governance, passport, reader, defi, businessPassport] =
      await deployPassportEcosystem(admin, [issuer, issuer2], treasury, [
        issuerTreasury,
        issuerTreasury2,
      ]);

    issuedAt = Math.floor(new Date().getTime() / 1000) - 5000;
    verifiedAt = Math.floor(new Date().getTime() / 1000) - 5000;

    await setAttributes(
      minterA,
      issuer,
      passport,
      attributes,
      verifiedAt,
      issuedAt,
      MINT_PRICE
    );
  });

  describe("QuadReader.getAttributesLegacy (SUCCESS CASES)", async () => {
    it("success - 1 issuer", async () => {
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
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

    it("success with 2 issuers", async () => {
      const attrIssuers2 = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_IS_BUSINESS]: attributes[ATTRIBUTE_IS_BUSINESS],
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_AML]: id("10"),
      };
      await setAttributes(
        minterA,
        issuer2,
        passport,
        attrIssuers2,
        verifiedAt + 1,
        issuedAt + 1,
        MINT_PRICE
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attrIssuers2],
        [verifiedAt, verifiedAt + 1]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attrIssuers2],
        [verifiedAt, verifiedAt + 1]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attrIssuers2],
        [verifiedAt, verifiedAt + 1]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attrIssuers2],
        [verifiedAt, verifiedAt + 1]
      );
    });

    it("success no passport", async () => {
      // No issuers & no existing attestation for account
      await assertGetAttributesLegacy(
        minterB,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );
      await assertGetAttributesLegacy(
        minterB,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );
      await assertGetAttributesLegacy(
        minterB,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );
      await assertGetAttributesLegacy(
        minterB,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );
    });

    it("success - existing AML and DID, but no IS_BUSINESS or COUNTRY for a new wallet", async () => {
      const attrIssuers2 = {
        [ATTRIBUTE_DID]: formatBytes32String("did:quad:newid2"),
        [ATTRIBUTE_AML]: id("10"),
      };
      await setAttributes(
        minterB,
        issuer2,
        passport,
        attrIssuers2,
        verifiedAt + 1,
        issuedAt + 1,
        MINT_PRICE
      );
      // DOES NOT EXIST
      await assertGetAttributesLegacy(
        minterB,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );
      await assertGetAttributesLegacy(
        minterB,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [],
        [],
        []
      );
      // EXIST
      await assertGetAttributesLegacy(
        minterB,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer2],
        [attrIssuers2],
        [verifiedAt + 1]
      );
      await assertGetAttributesLegacy(
        minterB,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer2],
        [attrIssuers2],
        [verifiedAt + 1]
      );
    });

    it("success - existing AML and DID, but no IS_BUSINESS or COUNTRY for an existng wallet", async () => {
      const attrIssuers2 = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: id("10"),
      };
      await setAttributes(
        minterA,
        issuer2,
        passport,
        attrIssuers2,
        verifiedAt + 1,
        issuedAt + 1,
        MINT_PRICE
      );
      // Only has `issuer` attributes
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      // Has Both attributes
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attrIssuers2],
        [verifiedAt, verifiedAt + 1]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attrIssuers2],
        [verifiedAt, verifiedAt + 1]
      );
    });

    it("success - all callers have preapproval", async () => {
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("success - overwritting position (single issuer)", async () => {
      const updatedAttributes: any = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: formatBytes32String("5"),
        [ATTRIBUTE_COUNTRY]: id("BE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer,
        passport,
        updatedAttributes,
        verifiedAt + 1,
        issuedAt + 1,
        MINT_PRICE
      );

      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [updatedAttributes],
        [verifiedAt + 1]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [updatedAttributes],
        [verifiedAt + 1]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [updatedAttributes],
        [verifiedAt + 1]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [updatedAttributes],
        [verifiedAt + 1]
      );
    });

    it("success - overwritting position (multiple issuers)", async () => {
      // Issuer 2
      const attributeByIssuer2 = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: formatBytes32String("9"),
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributeByIssuer2,
        verifiedAt + 10,
        issuedAt + 10,
        MINT_PRICE
      );

      // Update Issuer 1
      const updatedAttributes: any = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: formatBytes32String("5"),
        [ATTRIBUTE_COUNTRY]: id("BE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer,
        passport,
        updatedAttributes,
        verifiedAt + 1,
        issuedAt + 1,
        MINT_PRICE
      );

      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [updatedAttributes, attributeByIssuer2],
        [verifiedAt + 1, verifiedAt + 10]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [updatedAttributes, attributeByIssuer2],
        [verifiedAt + 1, verifiedAt + 10]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [updatedAttributes, attributeByIssuer2],
        [verifiedAt + 1, verifiedAt + 10]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [updatedAttributes, attributeByIssuer2],
        [verifiedAt + 1, verifiedAt + 10]
      );

      // Update Issuer 2
      const updatedAttrIssuer2 = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: formatBytes32String("7"),
        [ATTRIBUTE_COUNTRY]: id("DE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer2,
        passport,
        updatedAttrIssuer2,
        verifiedAt + 15,
        issuedAt + 15,
        MINT_PRICE
      );

      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [updatedAttributes, updatedAttrIssuer2],
        [verifiedAt + 1, verifiedAt + 15]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [updatedAttributes, updatedAttrIssuer2],
        [verifiedAt + 1, verifiedAt + 15]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [updatedAttributes, updatedAttrIssuer2],
        [verifiedAt + 1, verifiedAt + 15]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [updatedAttributes, updatedAttrIssuer2],
        [verifiedAt + 1, verifiedAt + 15]
      );
    });

    it("success - change business to TRUE)", async () => {
      const updatedAttributes: any = {
        [ATTRIBUTE_COUNTRY]: attributes[ATTRIBUTE_COUNTRY],
        [ATTRIBUTE_IS_BUSINESS]: id("TRUE"),
      };

      await setAttributes(
        minterA,
        issuer,
        passport,
        updatedAttributes,
        verifiedAt + 1,
        issuedAt + 1,
        MINT_PRICE
      );

      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [updatedAttributes],
        [verifiedAt + 1]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [updatedAttributes],
        [verifiedAt + 1]
      );
    });

    it("can query for business passport", async () => {
      const attributesCopy = Object.assign({}, attributes);
      attributesCopy[ATTRIBUTE_IS_BUSINESS] = id("TRUE");
      attributesCopy[ATTRIBUTE_DID] = formatBytes32String("quad:did:business");
      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributesCopy,
        verifiedAt,
        issuedAt
      );
      await assertGetAttributesLegacy(
        businessPassport,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        businessPassport,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        businessPassport,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        businessPassport,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesCopy],
        [verifiedAt]
      );
    });

    it("business passport can query DeFi", async () => {
      const attributesCopy = Object.assign({}, attributes);
      attributesCopy[ATTRIBUTE_IS_BUSINESS] = id("TRUE");
      attributesCopy[ATTRIBUTE_DID] = formatBytes32String("quad:did:business");
      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributesCopy,
        verifiedAt,
        issuedAt
      );

      await expect(
        businessPassport.depositLegacy(ATTRIBUTE_IS_BUSINESS, {
          value: PRICE_PER_BUSINESS_ATTRIBUTES_ETH[ATTRIBUTE_IS_BUSINESS],
        })
      )
        .to.emit(businessPassport, "GetAttributesEventBusiness")
        .withArgs([id("TRUE")], [verifiedAt], [issuer.address]);

      await expect(
        businessPassport.depositLegacy(ATTRIBUTE_AML, {
          value: PRICE_PER_BUSINESS_ATTRIBUTES_ETH[ATTRIBUTE_AML],
        })
      )
        .to.emit(businessPassport, "GetAttributesEventBusiness")
        .withArgs(
          [attributesCopy[ATTRIBUTE_AML]],
          [verifiedAt],
          [issuer.address]
        );

      await expect(
        businessPassport.depositLegacy(ATTRIBUTE_DID, {
          value: PRICE_PER_BUSINESS_ATTRIBUTES_ETH[ATTRIBUTE_DID],
        })
      )
        .to.emit(businessPassport, "GetAttributesEventBusiness")
        .withArgs(
          [attributesCopy[ATTRIBUTE_DID]],
          [verifiedAt],
          [issuer.address]
        );
    });
  });

  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>      ERROR TESTS   <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  //

  describe("QuadReader.getAttributesLegacy (ERROR CASES)", async () => {
    it("fail - account address zero", async () => {
      const queryFee = PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY];
      await expect(
        reader.getAttributesLegacy(
          ethers.constants.AddressZero,
          ATTRIBUTE_COUNTRY,
          {
            value: queryFee,
          }
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("sucess - non-eligible attributes may be queried", async () => {
      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, false);
      const queryFee = PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY];
      await expect(
        reader.getAttributesLegacy(minterA.address, ATTRIBUTE_COUNTRY, {
          value: queryFee,
        })
      ).to.not.be.reverted;
    });

    it("success - wrong query Fee can be accepted as a donation", async () => {
      const queryFee = PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY];
      await expect(
        reader.getAttributesLegacy(minterA.address, ATTRIBUTE_COUNTRY, {
          value: queryFee.add(1),
        })
      ).to.not.be.reverted;
    });
  });
});
