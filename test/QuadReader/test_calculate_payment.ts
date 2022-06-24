import { expect } from "chai";
import { ethers } from "hardhat";
import { constants, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  parseEther,
  parseUnits,
  formatBytes32String,
  id,
  hexZeroPad,
} from "ethers/lib/utils";
import exp from "constants";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_PER_ATTRIBUTES,
  PRICE_PER_BUSINESS_ATTRIBUTES,
  READER_ROLE
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
  let defi: Contract; // eslint-disable-line no-unused-vars
  let mockBusiness: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;

  let baseURI: string;
  let did: string;
  let aml: string;
  let country: string;
  let isBusiness: string;
  let issuedAt: number;

  beforeEach(async () => {
    baseURI = "https://quadrata.io";
    did = formatBytes32String("did:quad:123456789abcdefghi");
    aml = id("LOW");
    country = id("FRANCE");
    isBusiness = id("FALSE");

    issuedAt = Math.floor(new Date().getTime() / 1000);

    [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury] =
      await ethers.getSigners();
    [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury],
      baseURI
    );

    const MockBusiness = await ethers.getContractFactory('MockBusiness')
    mockBusiness = await MockBusiness.deploy(defi.address)
    await mockBusiness.deployed()

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

    const sigAccount = await signMessage(
      minterA,
      minterA.address,
    );

    await passport
      .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
        value: MINT_PRICE,
      });

    const sigBusiness = await signMint(
      issuer,
      mockBusiness,
      TOKEN_ID,
      did,
      aml,
      country,
      id("TRUE"),
      issuedAt
    );

    await passport
      .connect(minterA)
      .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, id("TRUE"), issuedAt], sigBusiness, '0x00', {
        value: MINT_PRICE,
      });


    await usdc.transfer(minterA.address, parseUnits("1000", 6));
    await usdc.transfer(minterB.address, parseUnits("1000", 6));

   expect(await governance.hasRole(READER_ROLE, deployer.address)).equals(false);
  });

  describe("calculatePaymentToken", async () => {
    it("success (AML)", async () => {
      expect(
        await reader.calculatePaymentToken(ATTRIBUTE_AML, usdc.address, minterA.address)
      ).to.equal(0);

      expect(
        await reader.calculatePaymentToken(ATTRIBUTE_AML, usdc.address, mockBusiness.address)
      ).to.equal(0);
    });

    it("success (COUNTRY)", async () => {
      expect(
        await reader.calculatePaymentToken(ATTRIBUTE_COUNTRY, usdc.address, minterA.address)
      ).to.equal(
        parseUnits(
          PRICE_PER_ATTRIBUTES[ATTRIBUTE_COUNTRY].toString(),
          await usdc.decimals()
        )
      );

      expect(
        await reader.calculatePaymentToken(ATTRIBUTE_COUNTRY, usdc.address, mockBusiness.address)
      ).to.equal(
        parseUnits(
          PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY].toString(),
          await usdc.decimals()
        )
      );
    });

    it("success (DID)", async () => {
      expect(
        await reader.calculatePaymentToken(ATTRIBUTE_DID, usdc.address, minterA.address)
      ).to.equal(
        parseUnits(
          PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID].toString(),
          await usdc.decimals()
        )
      );

      expect(
        await reader.calculatePaymentToken(ATTRIBUTE_DID, usdc.address, mockBusiness.address)
      ).to.equal(
        parseUnits(
          PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID].toString(),
          await usdc.decimals()
        )
      );
    });

    it("fail - ineligible payment token", async () => {
      const ERC20 = await ethers.getContractFactory("USDC");
      const wbtc = await ERC20.deploy();
      await wbtc.deployed();
      await expect(
        reader.calculatePaymentToken(ATTRIBUTE_DID, wbtc.address, minterA.address)
      ).to.revertedWith("TOKEN_PAYMENT_NOT_ALLOWED");
    });

    it("fail - wrong erc20", async () => {
      await expect(
        reader.calculatePaymentToken(ATTRIBUTE_DID, admin.address, minterA.address)
      ).to.revertedWith("TOKEN_PAYMENT_NOT_ALLOWED");
    });

    it("fail - address(0)", async () => {
      await expect(
        reader.calculatePaymentToken(ATTRIBUTE_DID, constants.AddressZero, minterA.address)
      ).to.revertedWith("TOKEN_PAYMENT_NOT_ALLOWED");
    });

    it("fail - oracle zero", async () => {
      [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
        admin,
        [issuer],
        treasury,
        [issuerTreasury],
        baseURI,
        {skipOracle: true}
      );
      await expect(
        reader.calculatePaymentToken(ATTRIBUTE_DID, usdc.address, minterA.address)
      ).to.revertedWith("ORACLE_ADDRESS_ZERO");
    });

    it("fail - governance incorrectly set", async () => {
      await governance.connect(admin).updateGovernanceInPassport(admin.address);
      await governance.connect(admin).acceptGovernanceInPassport();
      await expect(reader.calculatePaymentToken(ATTRIBUTE_DID, usdc.address, minterA.address))
        .to.reverted;
    });
  });

  describe("calculatePaymentETH", async () => {
    it("success (AML)", async () => {
      expect(await reader.calculatePaymentETH(ATTRIBUTE_AML, minterA.address)).to.equal(0);
    });

    it("success (COUNTRY)", async () => {
      const priceAttribute = parseEther(
        (PRICE_PER_ATTRIBUTES[ATTRIBUTE_COUNTRY] / 4000).toString()
      );
      expect(await reader.calculatePaymentETH(ATTRIBUTE_COUNTRY, minterA.address)).to.equal(
        priceAttribute
      );

      const priceBusinessAttribute = parseEther(
        (PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_COUNTRY] / 4000).toString()
      );
      expect(await reader.calculatePaymentETH(ATTRIBUTE_COUNTRY, mockBusiness.address)).to.equal(
        priceBusinessAttribute
      );
    });

    it("success (DID)", async () => {
      const priceAttribute = parseEther(
        (PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
      );

      expect(await reader.calculatePaymentETH(ATTRIBUTE_DID, minterA.address)).to.equal(
        priceAttribute
      );

      const priceBusniessAttribute = parseEther(
        (PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
      );

      expect(await reader.calculatePaymentETH(ATTRIBUTE_DID, mockBusiness.address)).to.equal(
        priceBusniessAttribute
      );
    });

    it("fail - governance incorrectly set", async () => {
      await governance.connect(admin).updateGovernanceInPassport(admin.address);
      await governance.connect(admin).acceptGovernanceInPassport();
      await expect(reader.calculatePaymentETH(ATTRIBUTE_DID, minterA.address)).to.reverted;
    });


    it("fail - oracle zero", async () => {
      [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
        admin,
        [issuer],
        treasury,
        [issuerTreasury],
        baseURI,
        {skipOracle: true}
      );
      await expect(
        reader.calculatePaymentETH(ATTRIBUTE_DID, minterA.address)
      ).to.revertedWith("ORACLE_ADDRESS_ZERO");
    });
  });
});
