import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { deploy } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { id } from "ethers/lib/utils";
import {READER_ROLE} from "../../utils/constant"

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
    const {attributeNames, issuers, issuedAts} = await feUtils.unsafeGetBalanceOfBulk(deployer.address, [id("AML")]);
    expect(attributeNames.length == 0).equals(true)
    expect(issuers.length == 0).equals(true)
    expect(issuedAts.length == 0).equals(true)
  });

});
