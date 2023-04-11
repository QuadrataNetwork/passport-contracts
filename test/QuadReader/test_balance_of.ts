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

describe("QuadReader.balanceOf", async () => {
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

  describe("QuadReader.balanceOf (SUCCESS CASES)", async () => {
    it("success - 1 issuer", async () => {
      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_DID)).to.equal(
        1
      );
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_IS_BUSINESS)
      ).to.equal(1);
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_COUNTRY)
      ).to.equal(1);
      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_AML)).to.equal(
        1
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

      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_DID)).to.equal(
        2
      );
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_IS_BUSINESS)
      ).to.equal(2);
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_COUNTRY)
      ).to.equal(2);
      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_AML)).to.equal(
        2
      );
    });

    it("success no passport", async () => {
      expect(await reader.balanceOf(minterB.address, ATTRIBUTE_DID)).to.equal(
        0
      );
      expect(
        await reader.balanceOf(minterB.address, ATTRIBUTE_IS_BUSINESS)
      ).to.equal(0);
      expect(
        await reader.balanceOf(minterB.address, ATTRIBUTE_COUNTRY)
      ).to.equal(0);
      expect(await reader.balanceOf(minterB.address, ATTRIBUTE_AML)).to.equal(
        0
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
      expect(await reader.balanceOf(minterB.address, ATTRIBUTE_DID)).to.equal(
        1
      );
      expect(
        await reader.balanceOf(minterB.address, ATTRIBUTE_IS_BUSINESS)
      ).to.equal(0);
      expect(
        await reader.balanceOf(minterB.address, ATTRIBUTE_COUNTRY)
      ).to.equal(0);
      expect(await reader.balanceOf(minterB.address, ATTRIBUTE_AML)).to.equal(
        1
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

      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_DID)).to.equal(
        2
      );
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_IS_BUSINESS)
      ).to.equal(1);
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_COUNTRY)
      ).to.equal(1);
      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_AML)).to.equal(
        2
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

      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_DID)).to.equal(
        1
      );
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_IS_BUSINESS)
      ).to.equal(1);
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_COUNTRY)
      ).to.equal(1);
      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_AML)).to.equal(
        1
      );
    });

    it("for business passport", async () => {
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

      expect(
        await reader.balanceOf(businessPassport.address, ATTRIBUTE_DID)
      ).to.equal(1);
      expect(
        await reader.balanceOf(businessPassport.address, ATTRIBUTE_IS_BUSINESS)
      ).to.equal(1);
      expect(
        await reader.balanceOf(businessPassport.address, ATTRIBUTE_COUNTRY)
      ).to.equal(1);
      expect(
        await reader.balanceOf(businessPassport.address, ATTRIBUTE_AML)
      ).to.equal(1);
    });

    it("success - after burning (themselves)", async () => {
      await passport.connect(minterA).burnPassports(1);
      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_DID)).to.equal(
        0
      );
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_IS_BUSINESS)
      ).to.equal(0);
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_COUNTRY)
      ).to.equal(0);
      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_AML)).to.equal(
        0
      );
    });

    it("success - after burning (issuer)", async () => {
      await passport.connect(issuer).burnPassportsIssuer(minterA.address, 1);
      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_DID)).to.equal(
        0
      );
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_IS_BUSINESS)
      ).to.equal(0);
      expect(
        await reader.balanceOf(minterA.address, ATTRIBUTE_COUNTRY)
      ).to.equal(0);
      expect(await reader.balanceOf(minterA.address, ATTRIBUTE_AML)).to.equal(
        0
      );
    });
  });
});
