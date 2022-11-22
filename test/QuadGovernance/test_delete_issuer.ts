import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract, Wallet } from "ethers";
import { ethers } from "hardhat";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

describe("QuadGovernance.deleteIssuer", async () => {
  let passport: Contract; // eslint-disable-line no-unused-vars
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer1: SignerWithAddress,
    issuer2: SignerWithAddress,
    issuer3: SignerWithAddress,
    issuerTreasury1: SignerWithAddress,
    issuerTreasury2: SignerWithAddress,
    issuerTreasury3: SignerWithAddress;

  beforeEach(async () => {
    [
      deployer,
      admin,
      issuer1,
      issuer2,
      issuer3,
      treasury,
      issuerTreasury1,
      issuerTreasury2,
      issuerTreasury3,
    ] = await ethers.getSigners();

    [governance, passport, reader] = await deployPassportEcosystem(
      admin,
      [issuer1, issuer2, issuer3],
      treasury,
      [issuerTreasury1, issuerTreasury2, issuerTreasury3]
    );
  });

  describe("deleteIssuer / getIssuerStatus", async () => {
    it("succeed - delete 3rd issuer", async () => {
      expect(await governance.getIssuersLength()).to.equal(3);
      expect(await governance.issuers(0)).to.equal(issuer1.address);
      expect(await governance.issuers(1)).to.equal(issuer2.address);
      expect(await governance.issuers(2)).to.equal(issuer3.address);

      await governance.connect(admin).deleteIssuer(issuer3.address);
      expect(await governance.getIssuerStatus(issuer3.address)).equals(false);

      expect(await governance.getIssuersLength()).to.equal(2);

      expect(await governance.issuers(0)).to.equal(issuer1.address);
      expect(await governance.issuers(1)).to.equal(issuer2.address);
    });

    it("succeed - delete 2nd issuer", async () => {
      await governance.connect(admin).deleteIssuer(issuer2.address);
      expect(await governance.getIssuerStatus(issuer2.address)).equals(false);

      expect(await governance.getIssuersLength()).to.equal(2);

      expect(await governance.issuers(0)).to.equal(issuer1.address);
      expect(await governance.issuers(1)).to.equal(issuer3.address);
    });

    it("succeed - delete 1st issuer", async () => {
      await governance.connect(admin).deleteIssuer(issuer1.address);
      expect(await governance.getIssuerStatus(issuer1.address)).equals(false);

      expect(await governance.getIssuersLength()).to.equal(2);

      expect(await governance.issuers(1)).to.equal(issuer2.address);
      expect(await governance.issuers(0)).to.equal(issuer3.address);
    });

    it("succeed - delete all issuers", async () => {
      await governance.connect(admin).deleteIssuer(issuer1.address);
      await governance.connect(admin).deleteIssuer(issuer2.address);
      await governance.connect(admin).deleteIssuer(issuer3.address);
      expect(await governance.getIssuerStatus(issuer1.address)).equals(false);
      expect(await governance.getIssuerStatus(issuer2.address)).equals(false);
      expect(await governance.getIssuerStatus(issuer3.address)).equals(false);
      expect(
        await governance.getIssuerStatus(Wallet.createRandom().address)
      ).equals(false); // random address

      expect(await governance.getIssuersLength()).to.equal(0);
    });

    it("fail - not admin", async () => {
      expect(await governance.getIssuersLength()).to.equal(3);
      await expect(governance.connect(issuerTreasury3).deleteIssuer(issuer1.address)).to.be.revertedWith(
        "INVALID_ADMIN"
      );
      expect(await governance.getIssuersLength()).to.equal(3);
    });

    it("fail - address zero", async () => {
      expect(await governance.getIssuersLength()).to.equal(3);
      await expect(
        governance.connect(admin).deleteIssuer(ethers.constants.AddressZero)
      ).to.be.revertedWith("ISSUER_ADDRESS_ZERO");
      expect(await governance.getIssuersLength()).to.equal(3);
    });
  });
});
