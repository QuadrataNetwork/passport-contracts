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

describe("QuadSoulbound.balanceOf", async () => {
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

  describe("QuadSoulbound.balanceOf (SUCCESS CASES)", async () => {
    it("success - 1 passport", async () => {
      expect(await passport.balanceOf(minterA.address, 1)).equals(1);
    });

    it("override - 1 passports", async () => {
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt + 1,
        issuedAt + 1,
        MINT_PRICE
      );
      expect(await passport.balanceOf(minterA.address, 1)).equals(1);
    });

    it("2 tokenIds", async () => {
      await setAttributes(
        minterB,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );
      expect(await passport.balanceOf(minterA.address, 1)).equals(1);
      expect(await passport.balanceOf(minterB.address, 1)).equals(1);
    });

    it("no account found", async () => {
      expect(await passport.balanceOf(minterB.address, 1)).equals(0);
    });

    it("no tokenId found", async () => {
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt + 3,
        issuedAt + 3,
        MINT_PRICE
      );
      expect(await passport.balanceOf(minterA.address, 2)).equals(0);
    });
  });
});
