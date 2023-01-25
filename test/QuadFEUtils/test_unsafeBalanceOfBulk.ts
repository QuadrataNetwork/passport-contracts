import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { deploy } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { formatBytes32String, id } from "ethers/lib/utils";
import {ATTRIBUTE_AML, ATTRIBUTE_COUNTRY, ATTRIBUTE_DID, ATTRIBUTE_IS_BUSINESS, MINT_PRICE, READER_ROLE} from "../../utils/constant"
import { setAttributes } from "../helpers/set_attributes";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

describe("QuadFEUtils.unsafeGetBalanceOfBulk", async () => {
  let passport: Contract; // eslint-disable-line no-unused-vars
  let governance: Contract; // eslint-disable-line no-unused-vars
  let feUtils: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress; // eslint-disable-line no-unused-vars
  let issuerA: SignerWithAddress; // eslint-disable-line no-unused-vars
  let issuerB: SignerWithAddress; // eslint-disable-line no-unused-vars

  beforeEach(async () => {
    [deployer, issuerA, issuerB] =  await ethers.getSigners();
    let reader, defi, mockbusiness;
    [governance, passport,reader, defi, mockbusiness, feUtils] = await deployPassportEcosystem(
      deployer,
      [deployer, issuerA, issuerB],
      deployer,
      [deployer, issuerA, issuerB]
    );

  });

  it("success - isEmpty", async () => {
    const {attributeNames, issuers, issuedAts} = await feUtils.unsafeGetBalanceOfBulk(deployer.address, [id("AML")]);
    expect(attributeNames.length == 0).equals(true)
    expect(issuers.length == 0).equals(true)
    expect(issuedAts.length == 0).equals(true)
  });

  it("success - has one", async () => {
    const attributes: any = {
      [ATTRIBUTE_DID]: formatBytes32String("did:quad:helloworld"),
      [ATTRIBUTE_AML]: formatBytes32String("1"),
      [ATTRIBUTE_COUNTRY]: id("FRANCE"),
      [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
    };

    const issuedAt = Math.floor(new Date().getTime() / 1000) - 100;
    const verifiedAt = Math.floor(new Date().getTime() / 1000) - 100;

    await setAttributes(
      deployer,
      deployer,
      passport,
      attributes,
      verifiedAt,
      issuedAt,
      MINT_PRICE
    );

    const {attributeNames, issuers, issuedAts} = await feUtils.unsafeGetBalanceOfBulk(deployer.address, [id("AML")]);
    expect(attributeNames.length == 1).equals(true)
    expect(issuers.length == 1).equals(true)
    expect(issuedAts.length == 1).equals(true)
    expect(attributeNames[0]).equals(ATTRIBUTE_AML);
    expect(issuers[0]).equals(deployer.address);
    expect(issuedAts[0]).equals(issuedAt);
  });

  it("success - has two", async () => {
    const attributes: any = {
      [ATTRIBUTE_DID]: formatBytes32String("did:quad:helloworld"),
      [ATTRIBUTE_AML]: formatBytes32String("1"),
      [ATTRIBUTE_COUNTRY]: id("FRANCE"),
      [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
    };

    const issuedAt = Math.floor(new Date().getTime() / 1000) - 100;
    const verifiedAt = Math.floor(new Date().getTime() / 1000) - 100;

    await setAttributes(
      deployer,
      deployer,
      passport,
      attributes,
      verifiedAt,
      issuedAt,
      MINT_PRICE
    );

    await setAttributes(
      deployer,
      issuerA,
      passport,
      attributes,
      verifiedAt,
      issuedAt,
      MINT_PRICE
    );

    const {attributeNames, issuers, issuedAts} = await feUtils.unsafeGetBalanceOfBulk(deployer.address, [id("AML")]);
    expect(attributeNames.length == 2).equals(true)
    expect(issuers.length == 2).equals(true)
    expect(issuedAts.length == 2).equals(true)

    expect(attributeNames[0]).equals(ATTRIBUTE_AML);
    expect(issuers[0]).equals(deployer.address);
    expect(issuedAts[0]).equals(issuedAt);

    expect(attributeNames[1]).equals(ATTRIBUTE_AML);
    expect(issuers[1]).equals(issuerA.address);
    expect(issuedAts[1]).equals(issuedAt);
  });

  it("success - has two different attributes", async () => {
    const attributes: any = {
      [ATTRIBUTE_DID]: formatBytes32String("did:quad:helloworld"),
      [ATTRIBUTE_AML]: formatBytes32String("1"),
      [ATTRIBUTE_COUNTRY]: id("FRANCE"),
      [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
    };

    const issuedAt = Math.floor(new Date().getTime() / 1000) - 100;
    const verifiedAt = Math.floor(new Date().getTime() / 1000) - 100;

    await setAttributes(
      deployer,
      deployer,
      passport,
      attributes,
      verifiedAt,
      issuedAt,
      MINT_PRICE
    );

    await setAttributes(
      deployer,
      issuerA,
      passport,
      attributes,
      verifiedAt,
      issuedAt,
      MINT_PRICE
    );

    const {attributeNames, issuers, issuedAts} = await feUtils.unsafeGetBalanceOfBulk(deployer.address, [id("AML"), id("COUNTRY")]);
    expect(attributeNames.length == 4).equals(true)
    expect(issuers.length == 4).equals(true)
    expect(issuedAts.length == 4).equals(true)

    expect(attributeNames[0]).equals(ATTRIBUTE_AML);
    expect(issuers[0]).equals(deployer.address);
    expect(issuedAts[0]).equals(issuedAt);

    expect(attributeNames[2]).equals(ATTRIBUTE_COUNTRY);
    expect(issuers[2]).equals(deployer.address);
    expect(issuedAts[2]).equals(issuedAt);
  });
});
