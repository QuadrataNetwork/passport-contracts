import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { OPERATOR_ROLE } = require("../../utils/constant.ts");

describe("QuadSoulbound.uri", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
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

    await governance.connect(admin).grantRole(OPERATOR_ROLE, admin.address);
  });

  describe("QuadSoulbound.uri (SUCCESS CASES)", async () => {
    it("success - uri for token that doesn't exist yet", async () => {
      await governance
        .connect(admin)
        .setTokenURI(1, "https://wwww.quadrata.com/ipfs");
      expect(await passport.uri(2)).equals("https://wwww.quadrata.com/ipfs");
    });
  });
});
