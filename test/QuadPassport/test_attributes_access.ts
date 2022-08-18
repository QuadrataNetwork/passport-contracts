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

describe("QuadPassport.attributes", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
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
      mockReader,
    ] = await ethers.getSigners();
    [governance, passport] = await deployPassportEcosystem(
      admin,
      [issuer, issuer2],
      treasury,
      [issuerTreasury, issuerTreasury2]
    );

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

    await governance.connect(admin).grantRole(READER_ROLE, mockReader.address);
  });

  describe("attributes", async () => {
    it("success - 1 issuer", async () => {
      expect(
        await governance.connect(admin).hasRole(READER_ROLE, mockReader.address)
      ).equals(true);

      const didResponse = await passport
        .connect(mockReader)
        .attributes(minterA.address, ATTRIBUTE_DID);
      const countryResponse = await passport
        .connect(mockReader)
        .attributes(minterA.address, ATTRIBUTE_COUNTRY);
      const isBusinessResponse = await passport
        .connect(mockReader)
        .attributes(minterA.address, ATTRIBUTE_IS_BUSINESS);
      const amlResponse = await passport
        .connect(mockReader)
        .attributes(minterA.address, ATTRIBUTE_AML);

      expect(didResponse.length).equals(1);
      expect(countryResponse.length).equals(1);
      expect(isBusinessResponse.length).equals(1);
      expect(amlResponse.length).equals(1);

      expect(didResponse[0].value).equals(attributes[ATTRIBUTE_DID]);
      expect(countryResponse[0].value).equals(attributes[ATTRIBUTE_COUNTRY]);
      expect(isBusinessResponse[0].value).equals(
        attributes[ATTRIBUTE_IS_BUSINESS]
      );
      expect(amlResponse[0].value).equals(attributes[ATTRIBUTE_AML]);
    });

    it("success with two issuers", async () => {
      const updatedAttributes = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_IS_BUSINESS]: attributes[ATTRIBUTE_IS_BUSINESS],
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_AML]: id("10"),
      };
      await setAttributes(
        minterA,
        issuer2,
        passport,
        updatedAttributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      const didResponse = await passport
        .connect(mockReader)
        .attributes(minterA.address, ATTRIBUTE_DID);
      const countryResponse = await passport
        .connect(mockReader)
        .attributes(minterA.address, ATTRIBUTE_COUNTRY);
      const isBusinessResponse = await passport
        .connect(mockReader)
        .attributes(minterA.address, ATTRIBUTE_IS_BUSINESS);
      const amlResponse = await passport
        .connect(mockReader)
        .attributes(minterA.address, ATTRIBUTE_AML);

      expect(didResponse.length).equals(2);
      expect(countryResponse.length).equals(2);
      expect(isBusinessResponse.length).equals(2);
      expect(amlResponse.length).equals(2);

      expect(didResponse[0].value).equals(attributes[ATTRIBUTE_DID]);
      expect(countryResponse[0].value).equals(attributes[ATTRIBUTE_COUNTRY]);
      expect(isBusinessResponse[0].value).equals(
        attributes[ATTRIBUTE_IS_BUSINESS]
      );
      expect(amlResponse[0].value).equals(attributes[ATTRIBUTE_AML]);

      expect(didResponse[1].value).equals(attributes[ATTRIBUTE_DID]);
      expect(countryResponse[1].value).equals(
        updatedAttributes[ATTRIBUTE_COUNTRY]
      );
      expect(isBusinessResponse[1].value).equals(
        updatedAttributes[ATTRIBUTE_IS_BUSINESS]
      );
      expect(amlResponse[1].value).equals(updatedAttributes[ATTRIBUTE_AML]);
    });

    it("success no attributes", async () => {
      const attrs = {
        [ATTRIBUTE_DID]: id("10"),
        [ATTRIBUTE_COUNTRY]: id("US"),
      };
      await setAttributes(
        minterB,
        issuer,
        passport,
        attrs,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      const didResponse = await passport
        .connect(mockReader)
        .attributes(minterB.address, ATTRIBUTE_DID);
      const countryResponse = await passport
        .connect(mockReader)
        .attributes(minterB.address, ATTRIBUTE_COUNTRY);
      const isBusinessResponse = await passport
        .connect(mockReader)
        .attributes(minterB.address, ATTRIBUTE_IS_BUSINESS);
      const amlResponse = await passport
        .connect(mockReader)
        .attributes(minterB.address, ATTRIBUTE_AML);

      expect(didResponse.length).equals(1);
      expect(countryResponse.length).equals(1);
      expect(isBusinessResponse.length).equals(0);
      expect(amlResponse.length).equals(0);

      expect(didResponse[0].value).equals(attrs[ATTRIBUTE_DID]);
      expect(countryResponse[0].value).equals(attrs[ATTRIBUTE_COUNTRY]);
      expect(isBusinessResponse).to.deep.equal([]);
      expect(amlResponse).to.deep.equal([]);
    });

    it("fail - a user without READER_ROLE may not query attributes", async () => {
      expect(
        await governance.connect(admin).hasRole(READER_ROLE, minterB.address)
      ).equals(false);

      // TODO: Figure out why it's wrong exception thrown
      await expect(
        passport.connect(minterB).attributes(minterA.address, ATTRIBUTE_DID)
      ).to.be.revertedWith("INVALID_READER");
      await expect(
        passport.connect(minterB).attributes(minterA.address, ATTRIBUTE_COUNTRY)
      ).to.be.revertedWith("INVALID_READER");
      await expect(
        passport
          .connect(minterB)
          .attributes(minterA.address, ATTRIBUTE_IS_BUSINESS)
      ).to.be.revertedWith("INVALID_READER");
    });
  });
});
