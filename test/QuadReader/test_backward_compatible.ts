import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber } from "ethers";
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

describe("QuadReader.getAttributes", async () => {
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

    const attributes2: any = {
      [ATTRIBUTE_IS_BUSINESS]: id("TRUE"),
    };

    await setAttributesIssuer(
      businessPassport,
      issuer,
      passport,
      attributes2,
      verifiedAt,
      issuedAt
    );
  });

  describe("QuadReader DEPRECATED FUNCTIONS", async () => {
    it("calculatePaymentETH (EOA)", async () => {
      expect(
        await reader.calculatePaymentETH(ATTRIBUTE_COUNTRY, minterA.address)
      ).to.equal(PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY]);
    });

    it("calculatePaymentETH (Smart Contract Business)", async () => {
      expect(
        await reader.calculatePaymentETH(
          ATTRIBUTE_COUNTRY,
          businessPassport.address
        )
      ).to.equal(PRICE_PER_BUSINESS_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY]);
    });

    it("getAttributesETH", async () => {
      const queryFee = await reader.callStatic.calculatePaymentETH(
        ATTRIBUTE_COUNTRY,
        minterA.address
      );
      // Verify return value with callStatic
      const staticResp = await reader.callStatic.getAttributesETH(
        minterA.address,
        1,
        ATTRIBUTE_COUNTRY,
        { value: queryFee }
      );

      expect(staticResp.length).equals(3);
      expect(staticResp[0]).to.eql([attributes[ATTRIBUTE_COUNTRY]]);
      expect(staticResp[1]).to.eql([BigNumber.from(verifiedAt)]);
      expect(staticResp[2]).to.eql([issuer.address]);
    });
  });
});
