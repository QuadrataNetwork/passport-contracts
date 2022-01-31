import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  parseEther,
  parseUnits,
  formatBytes32String,
  id,
} from "ethers/lib/utils";
import { assertMintOnBehalfOf } from "../utils/verify";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
} = require("../../utils/constant.ts");
const { signMint } = require("../utils/signature.ts");
const {
  deployPassportAndGovernance,
} = require("../utils/deployment_and_init.ts");
const {
  assertGetAttribute,
  assertGetAttributeFree,
} = require("../utils/verify.ts");

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
    issuerTreasury: SignerWithAddress,
    reciptient: SignerWithAddress;
  let baseURI: string;
  let did: string;
  let aml: string;
  let country: string;
  let issuedAt: number;

  describe("mintPassport", async () => {
    beforeEach(async () => {
      baseURI = "https://quadrata.io";
      did = formatBytes32String("did:quad:123456789abcdefghi");
      aml = id("LOW");
      country = id("FRANCE");
      issuedAt = Math.floor(new Date().getTime() / 1000);

      [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury, reciptient] =
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
      await usdc.transfer(reciptient.address, parseUnits("1000", 6));
    });

    it("success mint", async () => {
      await assertMintOnBehalfOf(
        minterA,
        reciptient,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        issuedAt
      );
      await assertGetAttributeFree(
        reciptient,
        defi,
        passport,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      await assertGetAttribute(
        reciptient,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
    });
  });
});
