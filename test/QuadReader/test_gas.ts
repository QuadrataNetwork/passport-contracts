import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  parseUnits,
  formatBytes32String,
  id,
  hexZeroPad,
} from "ethers/lib/utils";

const {
  ATTRIBUTE_AML,
  TOKEN_ID,
  MINT_PRICE,
} = require("../../utils/constant.ts");

const { deployPassportEcosystem } = require("../utils/deployment_and_init.ts");

const { signMint, signMessage } = require("../utils/signature.ts");

describe("QuadReader - calculate gas", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract;
  let usdc: Contract;
  let defi: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerB: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerBTreasury: SignerWithAddress;

  let baseURI: string;
  let did: string;
  let aml: string;
  let country: string;
  let isBusiness: string;
  let issuedAt: number;

  beforeEach(async () => {
    baseURI = "https://quadrata.io";
    did = formatBytes32String("did:quad:123456789abcdefghi");
    aml = hexZeroPad("0x01", 32);
    country = id("FR");
    isBusiness = id("FALSE");
    issuedAt = Math.floor(new Date().getTime() / 1000) - 100;

    [
      deployer,
      admin,
      minterA,
      minterB,
      issuer,
      treasury,
      issuerTreasury,
      issuerB,
      issuerBTreasury,
    ] = await ethers.getSigners();
    [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury],
      baseURI
    );

    const sig = await signMint(
      issuer,
      minterA,
      TOKEN_ID,
      did,
      aml,
      country,
      isBusiness,
      issuedAt
    );
    const sigAccount = await signMessage(minterA, minterA.address);
    await passport
      .connect(minterA)
      .mintPassport(
        [minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt],
        sig,
        sigAccount,
        {
          value: MINT_PRICE,
        }
      );

    await usdc.transfer(minterA.address, parseUnits("1000", 6));
    await usdc.transfer(minterB.address, parseUnits("1000", 6));
  });

  describe("Calculate Gas Cost", async () => {
    beforeEach(async () => {
      await governance
        .connect(admin)
        .setIssuer(issuerB.address, issuerBTreasury.address);
    });

    it("getAttributesETH", async () => {
      const calcPaymentETH = await reader.calculatePaymentETH(
        ATTRIBUTE_AML,
        minterA.address
      );
      const response = await reader.callStatic.getAttributesETH(
        minterA.address,
        1,
        ATTRIBUTE_AML,
        { value: calcPaymentETH }
      );

      expect(response).to.eqls([
        [aml],
        [BigNumber.from(issuedAt)],
        [issuer.address],
      ]);
      await reader.getAttributesETH(minterA.address, 1, ATTRIBUTE_AML, {
        value: calcPaymentETH,
      });
    });
  });
});
