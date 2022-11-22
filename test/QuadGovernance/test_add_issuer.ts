import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

describe("QuadGovernance.addIssuer", async () => {
  let passport: Contract; // eslint-disable-line no-unused-vars
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer1: SignerWithAddress,
    issuer2: SignerWithAddress,
    issuer3: SignerWithAddress,
    newIssuer: SignerWithAddress,
    issuerTreasury1: SignerWithAddress,
    issuerTreasury2: SignerWithAddress,
    issuerTreasury3: SignerWithAddress,
    newIssuerTreasury: SignerWithAddress;

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
      newIssuer,
      newIssuerTreasury,
    ] = await ethers.getSigners();

    [governance, passport, reader] = await deployPassportEcosystem(
      admin,
      [issuer1, issuer2, issuer3],
      treasury,
      [issuerTreasury1, issuerTreasury2, issuerTreasury3]
    );
  });

  describe("addIssuer", async () => {
    it("succeed", async () => {
      expect(await governance.issuersTreasury(newIssuer.address)).to.equal(
        ethers.constants.AddressZero
      );
      await expect(
        governance
          .connect(admin)
          .addIssuer(newIssuer.address, newIssuerTreasury.address)
      )
        .to.emit(governance, "IssuerAdded")
        .withArgs(newIssuer.address, newIssuerTreasury.address);
      expect(await governance.issuersTreasury(newIssuer.address)).to.equal(
        newIssuerTreasury.address
      );
    });

    it("success (addIssuer maybe called multiple times without creating dupes)", async () => {
      expect(await governance.issuersTreasury(issuer1.address)).to.equal(
        issuerTreasury1.address
      );
      expect(await governance.getIssuersLength()).to.equal(3);
      await governance.connect(admin).addIssuer(issuer1.address, admin.address);

      expect(await governance.issuersTreasury(issuer1.address)).to.equal(
        admin.address
      );
      expect(await governance.getIssuersLength()).to.equal(3);
    });

    it("fail (issuer address (0))", async () => {
      await expect(
        governance
          .connect(admin)
          .addIssuer(ethers.constants.AddressZero, admin.address)
      ).to.revertedWith("ISSUER_ADDRESS_ZERO");
    });

    it("fail (treasury address (0))", async () => {
      await expect(
        governance
          .connect(admin)
          .addIssuer(newIssuer.address, ethers.constants.AddressZero)
      ).to.revertedWith("TREASURY_ISSUER_ADDRESS_ZERO");
    });

    it("fail (not admin)", async () => {
      await expect(
        governance.connect(issuerTreasury3).addIssuer(issuer1.address, admin.address)
      ).to.revertedWith("INVALID_ADMIN");
    });
  });
});
