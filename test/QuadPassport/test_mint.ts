// import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { parseUnits, formatBytes32String } from "ethers/lib/utils";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
} = require("../../utils/constant.ts");
const {
  deployPassportAndGovernance,
} = require("../utils/deployment_and_init.ts");
const { assertMint, assertGetAttribute } = require("../utils/verify.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let usdc: Contract;
  let defi: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;
  const baseURI = "https://quadrata.io";
  const did = formatBytes32String("did:quad:123456789abcdefghi");
  const aml = formatBytes32String("LOW");
  const country = formatBytes32String("FRANCE");
  const issuedAt = Math.floor(new Date().getTime() / 1000);

  describe("mintPassport", async () => {
    beforeEach(async () => {
      [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury] =
        await ethers.getSigners();
      [governance, passport, usdc, defi] = await deployPassportAndGovernance(
        admin,
        issuer,
        treasury,
        issuerTreasury,
        baseURI
      );
      await usdc.transfer(minterA.address, parseUnits("1000", 6));
      await usdc.transfer(minterB.address, parseUnits("1000", 6));
    });

    it("successfully mint", async () => {
      await assertMint(minterA, issuer, passport, did, aml, country, issuedAt);
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      await assertGetAttribute(
        minterA,
        usdc,
        defi,
        passport,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
    });
  });
});
