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
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");
const { setAttributesIssuer } = require("../helpers/set_attributes_issuer.ts");

const {
  assertGetAttributesBulkLegacy,
} = require("../helpers/assert/assert_get_attributes_bulk_legacy.ts");

describe("QuadReader.getAttributesBulkLegacy", async () => {
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

    issuedAt = Math.floor(new Date().getTime() / 1000) - 100;
    verifiedAt = Math.floor(new Date().getTime() / 1000) - 100;

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

  describe("QuadReader.getAttributesBulkLegacy (SUCCESS CASES)", async () => {
    it("success - 1 issuer 1 attribute", async () => {
      await assertGetAttributesBulkLegacy(
        minterA,
        [ATTRIBUTE_COUNTRY],
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("success - 1 issuer multiple attributes", async () => {
      await assertGetAttributesBulkLegacy(
        minterA,
        [
          ATTRIBUTE_AML,
          ATTRIBUTE_COUNTRY,
          ATTRIBUTE_DID,
          ATTRIBUTE_IS_BUSINESS,
        ],
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
      await assertGetAttributesBulkLegacy(
        minterA,
        [
          ATTRIBUTE_AML,
          ATTRIBUTE_COUNTRY,
          ATTRIBUTE_DID,
          ATTRIBUTE_IS_BUSINESS,
        ],
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
      await assertGetAttributesBulkLegacy(
        minterB,
        [
          ATTRIBUTE_AML,
          ATTRIBUTE_COUNTRY,
          ATTRIBUTE_DID,
          ATTRIBUTE_IS_BUSINESS,
        ],
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
      await assertGetAttributesBulkLegacy(
        minterB,
        [
          ATTRIBUTE_AML,
          ATTRIBUTE_COUNTRY,
          ATTRIBUTE_DID,
          ATTRIBUTE_IS_BUSINESS,
        ],
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
      // Has Both attributes
      await assertGetAttributesBulkLegacy(
        minterA,
        [
          ATTRIBUTE_AML,
          ATTRIBUTE_COUNTRY,
          ATTRIBUTE_DID,
          ATTRIBUTE_IS_BUSINESS,
        ],
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attrIssuers2],
        [verifiedAt, verifiedAt + 1]
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

      await assertGetAttributesBulkLegacy(
        minterA,
        [
          ATTRIBUTE_AML,
          ATTRIBUTE_COUNTRY,
          ATTRIBUTE_DID,
          ATTRIBUTE_IS_BUSINESS,
        ],
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

      await assertGetAttributesBulkLegacy(
        minterA,
        [
          ATTRIBUTE_AML,
          ATTRIBUTE_COUNTRY,
          ATTRIBUTE_DID,
          ATTRIBUTE_IS_BUSINESS,
        ],
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

      await assertGetAttributesBulkLegacy(
        minterA,
        [
          ATTRIBUTE_AML,
          ATTRIBUTE_COUNTRY,
          ATTRIBUTE_DID,
          ATTRIBUTE_IS_BUSINESS,
        ],
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

      await assertGetAttributesBulkLegacy(
        minterA,
        [
          ATTRIBUTE_AML,
          ATTRIBUTE_COUNTRY,
          ATTRIBUTE_DID,
          ATTRIBUTE_IS_BUSINESS,
        ],
        reader,
        defi,
        treasury,
        [issuer, issuer],
        [updatedAttributes, attributes],
        [verifiedAt + 1, verifiedAt]
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
      await assertGetAttributesBulkLegacy(
        businessPassport,
        [
          ATTRIBUTE_AML,
          ATTRIBUTE_COUNTRY,
          ATTRIBUTE_DID,
          ATTRIBUTE_IS_BUSINESS,
        ],
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

      const attributesToQuery = [
        ATTRIBUTE_IS_BUSINESS,
        ATTRIBUTE_DID,
        ATTRIBUTE_COUNTRY,
        ATTRIBUTE_AML,
      ];
      const queryFee = await reader.queryFeeBulk(
        businessPassport.address,
        attributesToQuery
      );

      await expect(
        businessPassport.depositBulkLegacy(attributesToQuery, {
          value: queryFee,
        })
      )
        .to.emit(businessPassport, "GetAttributesBulkEventBusiness")
        .withArgs(
          [
            attributesCopy[ATTRIBUTE_IS_BUSINESS],
            attributesCopy[ATTRIBUTE_DID],
            attributesCopy[ATTRIBUTE_COUNTRY],
            attributesCopy[ATTRIBUTE_AML],
          ],
          [verifiedAt, verifiedAt, verifiedAt, verifiedAt],
          [issuer.address, issuer.address, issuer.address, issuer.address]
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

  describe("QuadReader.getAttributesBulkLegacy (ERROR CASES)", async () => {
    it("fail - account address zero", async () => {
      const queryFee = PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY];
      await expect(
        reader.getAttributesBulkLegacy(
          ethers.constants.AddressZero,
          [ATTRIBUTE_COUNTRY],
          {
            value: queryFee,
          }
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("fail - not eligible attributes", async () => {
      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, false);
      const queryFee = PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY];
      await expect(
        reader.getAttributesBulkLegacy(minterA.address, [ATTRIBUTE_COUNTRY], {
          value: queryFee,
        })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - wrong query Fee", async () => {
      const queryFee = PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY];
      await expect(
        reader.getAttributesBulkLegacy(minterA.address, [ATTRIBUTE_COUNTRY], {
          value: queryFee.sub(1),
        })
      ).to.revertedWith("INVALID_QUERY_FEE");
    });
  });
});
