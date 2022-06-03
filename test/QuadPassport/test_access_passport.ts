import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { id, parseUnits, formatBytes32String, zeroPad, hexZeroPad } from "ethers/lib/utils";

const {
  TOKEN_ID,
  MINT_PRICE,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const { signMint, signMessage } = require("../utils/signature.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract;
  let usdc: Contract;
  let defi: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuerB: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerBTreasury: SignerWithAddress,
    dataChecker: SignerWithAddress; // used as READER_ROLE to check AML and DID after burn
  let baseURI: string;
  let did: string;
  let aml: string;
  let isBusiness: string;
  let country: string;
  let issuedAt: number;

  beforeEach(async () => {
    baseURI = "https://quadrata.io";
    did = formatBytes32String("did:quad:123456789abcdefghi");
    aml = id("LOW");
    country = id("FRANCE");
    isBusiness = id("FALSE");
    issuedAt = Math.floor(new Date().getTime() / 1000);

    [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury, dataChecker, issuerB, issuerBTreasury] =
      await ethers.getSigners();
    [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury],
      baseURI
    );

    const sigIssuer = await signMint(
      issuer,
      minterA,
      TOKEN_ID,
      did,
      aml,
      country,
      isBusiness,
      issuedAt
    );

    const sigMinter = await signMessage(
      minterA,
      minterA.address,
    );

    await passport
      .connect(minterA)
      .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigIssuer, sigMinter, {
        value: MINT_PRICE,
      });

    await governance.connect(admin).grantRole(id("READER_ROLE"), dataChecker.address);
    await governance.connect(admin).setIssuer(issuerB.address, issuerBTreasury.address)

    await usdc.transfer(minterA.address, parseUnits("1000", 6));
    await usdc.transfer(minterB.address, parseUnits("1000", 6));
  });
});