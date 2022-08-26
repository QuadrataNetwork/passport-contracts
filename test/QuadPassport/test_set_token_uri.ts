import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { deployGovernance } = require("../../utils/deployment.ts");

const {
  GOVERNANCE_ROLE,
  DEFAULT_ADMIN_ROLE,
} = require("../../utils/constant.ts");

describe("QuadPassport.setTokenURI", async () => {
  let passport: Contract;
  let governance: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;

  beforeEach(async () => {
    [deployer, admin, issuer, treasury, issuerTreasury] =
      await ethers.getSigners();
    [governance, passport] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury]
    );
  });

  describe("QuadPassport.setTokenURI", async () => {
    it("fail (not governance contract)", async () => {
      await expect(
        passport.connect(treasury).setTokenURI(1, "hello")
      ).to.be.revertedWith("ONLY_GOVERNANCE_CONTRACT");
    });
  });
});
