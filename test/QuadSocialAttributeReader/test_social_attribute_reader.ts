const { ethers, upgrades } = require("hardhat");
import { expect } from "chai";
import { Contract } from "ethers";
import { BytesLike } from '@ethersproject/bytes';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");


describe('SocialAttributeReader()', function() {
  let socialReader: Contract;

  beforeEach(async () => {
    let passport: Contract;
    let governance: Contract;
    let reader: Contract;
    let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
      admin: SignerWithAddress,
      treasury: SignerWithAddress,
      issuer: SignerWithAddress,
      issuerTreasury: SignerWithAddress;
    const baseURI = "https://quadrata.io";


    [deployer, admin, issuer, treasury, issuerTreasury] =
      await ethers.getSigners();
    [governance, passport, reader] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury],
      baseURI
    );

    const SocialAttributeReader = await ethers.getContractFactory("SocialAttributeReader");

    socialReader = await upgrades.deployProxy(
    SocialAttributeReader,
    ['50000000000000000', governance.address, reader.address],
    {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor"],
    });

    await socialReader.deployed();

  });

  describe('blah()', function() {
    it("asserts correct isBusinessTrue value", async () => {
    });
  });
});
