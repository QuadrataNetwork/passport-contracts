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
  assertGetAttributes,
} = require("../helpers/assert/assert_get_attributes.ts");

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

  describe("QuadReader.getAttributes (ERROR CASES)", async () => {
    it("fail - account address zero", async () => {
      const queryFee = PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY];
      await expect(
        reader.getAttributes(ethers.constants.AddressZero, ATTRIBUTE_COUNTRY, {
          value: queryFee,
        })
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("fail - not eligible attributes", async () => {
      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, false);
      const queryFee = PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY];
      await expect(
        reader.getAttributes(minterA.address, ATTRIBUTE_COUNTRY, {
          value: queryFee,
        })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - wrong query Fee", async () => {
      const queryFee = PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY];
      await expect(
        reader.getAttributes(minterA.address, ATTRIBUTE_COUNTRY, {
          value: queryFee.sub(1),
        })
      ).to.revertedWith("INVALID_QUERY_FEE");
    });
  });
});
