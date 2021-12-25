import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  deployPassportAndGovernance,
} = require("../utils/deployment_and_init.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;
  const baseURI = "https://quadrata.io";

  describe("setGovernance", async () => {
    beforeEach(async () => {
      [deployer, admin, issuer, treasury, issuerTreasury] =
        await ethers.getSigners();
      [governance, passport] = await deployPassportAndGovernance(
        admin,
        issuer,
        treasury,
        issuerTreasury,
        baseURI
      );
    });

    it("fail (not governance contract)", async () => {
      expect(await passport.governance()).to.equal(governance.address);
      await expect(
        passport.connect(admin).setGovernance(deployer.address)
      ).to.be.revertedWith("ONLY_GOVERNANCE_CONTRACT");
      await expect(
        passport.connect(deployer).setGovernance(deployer.address)
      ).to.be.revertedWith("ONLY_GOVERNANCE_CONTRACT");
    });
  });
});
