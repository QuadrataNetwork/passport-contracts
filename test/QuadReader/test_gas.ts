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
    issuerC: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuerTreasury: SignerWithAddress,
    issuerBTreasury: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuerCTreasury: SignerWithAddress; // eslint-disable-line no-unused-vars

  let issuedAt: number, verifiedAt: number;
  const attributes: Object = {
    [ATTRIBUTE_DID]: formatBytes32String("did:quad:123456789abcdefghi"),
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
      issuerC,
      issuerCTreasury,
    ] = await ethers.getSigners();
    [governance, passport, reader, defi] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury]
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

  describe("calculate Gas - 1 issuer | 4 attributes", async () => {
    const attributeToQuery = [
      ATTRIBUTE_DID,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_AML,
    ];

    it("getAttributes", async () => {
      const attribute = attributeToQuery[0];
      const fee = await reader.queryFee(minterA.address, attribute);
      await reader.connect(minterA).getAttributes(minterA.address, attribute, {
        value: fee,
      });
    });

    it("getAttributes (Legacy)", async () => {
      const attribute = attributeToQuery[0];
      const fee = await reader.queryFee(minterA.address, attribute);
      await reader
        .connect(minterA)
        .getAttributesLegacy(minterA.address, attribute, {
          value: fee,
        });
    });

    it("getAttributesBulk (Legacy)", async () => {
      const fee = await reader.queryFeeBulk(minterA.address, attributeToQuery);
      await reader
        .connect(minterA)
        .getAttributesBulkLegacy(minterA.address, attributeToQuery, {
          value: fee,
        });
    });

    it("getAttributes (DeFi)", async () => {
      await defi.connect(minterA).queryMultipleAttributes(attributeToQuery, {
        value: ethers.utils.parseEther("1"),
      });
    });

    it("getAttributesBulk (DeFi)", async () => {
      await defi.connect(minterA).queryMultipleBulk(attributeToQuery, {
        value: ethers.utils.parseEther("1"),
      });
    });
  });

  describe("calculate Gas - 3 issuers | 4 attributes", async () => {
    const attributeToQuery = [
      ATTRIBUTE_DID,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_AML,
    ];
    beforeEach(async () => {
      await governance
        .connect(admin)
        .addIssuer(issuerB.address, issuerBTreasury.address);
      await governance
        .connect(admin)
        .addIssuer(issuerC.address, issuerCTreasury.address);
      for (const iss of [issuerB, issuerC]) {
        await setAttributes(
          minterA,
          iss,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        );
      }
    });

    it("getAttributes", async () => {
      const attribute = attributeToQuery[0];
      const fee = await reader.queryFee(minterA.address, attribute);
      await reader.connect(minterA).getAttributes(minterA.address, attribute, {
        value: fee,
      });
    });

    it("getAttributes (Legacy)", async () => {
      const attribute = attributeToQuery[0];
      const fee = await reader.queryFee(minterA.address, attribute);
      await reader
        .connect(minterA)
        .getAttributesLegacy(minterA.address, attribute, {
          value: fee,
        });
    });

    it("getAttributesBulk (Legacy)", async () => {
      const fee = await reader.queryFeeBulk(minterA.address, attributeToQuery);
      await reader
        .connect(minterA)
        .getAttributesBulkLegacy(minterA.address, attributeToQuery, {
          value: fee,
        });
    });

    it("getAttributes (DeFi)", async () => {
      await defi.connect(minterA).queryMultipleAttributes(attributeToQuery, {
        value: ethers.utils.parseEther("1"),
      });
    });

    it("getAttributesBulk (DeFi)", async () => {
      await defi.connect(minterA).queryMultipleBulk(attributeToQuery, {
        value: ethers.utils.parseEther("1"),
      });
    });
  });
});
