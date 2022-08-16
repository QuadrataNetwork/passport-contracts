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
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");

describe("QuadReader", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let defi: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuerB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuerTreasury: SignerWithAddress,
    issuerBTreasury: SignerWithAddress // eslint-disable-line no-unused-vars

  let issuedAt: number, verifiedAt: number;
  const attributes: Object = {
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
      treasury,
      issuerTreasury,
      issuerB,
      issuerBTreasury,
    ] = await ethers.getSigners();
    [governance, passport, reader, defi] = await deployPassportEcosystem(
      admin,
      [issuer, issuerB],
      treasury,
      [issuerTreasury, issuerBTreasury]
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
  });

  describe("QuadReader.hasPassportByIssuer", async () => {
    it("returns true for valid issuers", async () => {
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_DID, issuer.address)).to.equal(true);
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_AML, issuer.address)).to.equal(true);
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_COUNTRY, issuer.address)).to.equal(true);
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_IS_BUSINESS, issuer.address)).to.equal(true);

      expect(await reader.hasPassportByIssuer(minterB.address, ATTRIBUTE_DID, issuer.address)).to.equal(false);
      expect(await reader.hasPassportByIssuer(minterB.address, ATTRIBUTE_AML, issuer.address)).to.equal(false);
      expect(await reader.hasPassportByIssuer(minterB.address, ATTRIBUTE_COUNTRY, issuer.address)).to.equal(false);
      expect(await reader.hasPassportByIssuer(minterB.address, ATTRIBUTE_IS_BUSINESS, issuer.address)).to.equal(false);
    });

    it("returns false for issuers w/ no attestations", async () => {
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_DID, issuerB.address)).to.equal(false);
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_AML, issuerB.address)).to.equal(false);
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_COUNTRY, issuerB.address)).to.equal(false);
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_IS_BUSINESS, issuerB.address)).to.equal(false);
    });

    it("returns false for non-issuers", async () => {
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_DID, minterA.address)).to.equal(false);
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_AML, minterA.address)).to.equal(false);
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_COUNTRY, minterA.address)).to.equal(false);
      expect(await reader.hasPassportByIssuer(minterA.address, ATTRIBUTE_IS_BUSINESS, minterA.address)).to.equal(false);
    });

  });
});
