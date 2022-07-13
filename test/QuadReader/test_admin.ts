import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { GOVERNANCE_ROLE } = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const { deployGovernance } = require("../../utils/deployment.ts");


describe("QuadReader", async () => {
  let passport: Contract;
  let governance: Contract;
  let reader: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;
  const baseURI = "https://quadrata.io";

    beforeEach(async () => {
      [deployer, admin, issuer, treasury, issuerTreasury] =
        await ethers.getSigners();
      [governance, passport, reader] = await deployPassportEcosystem(
        admin,
        [issuer],
        treasury,
        [issuerTreasury],
        baseURI
      );
    });

  describe("upgrade", async () => {
    it("fail (not admin)", async () => {
      const QuadReaderV2 = await ethers.getContractFactory("QuadReaderV2");
      await expect(
        upgrades.upgradeProxy(reader.address, QuadReaderV2, {unsafeAllow: ['constructor']})
      ).to.revertedWith("INVALID_ADMIN");
    });
    it("succeed", async () => {
      const QuadReaderV2 = await ethers.getContractFactory("QuadReaderV2");
      await governance
        .connect(admin)
        .grantRole(GOVERNANCE_ROLE, deployer.address);
      const readerv2 = await upgrades.upgradeProxy(
        reader.address,
        QuadReaderV2,
        {unsafeAllow: ['constructor']}
      );
      expect(await readerv2.foo()).to.equal(1337);
      expect(reader.address).to.equal(readerv2.address);
      expect(await readerv2.governance()).to.equal(governance.address);
    });
  });
});
