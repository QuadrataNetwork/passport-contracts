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

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_PER_ATTRIBUTES,
} = require("../../utils/constant.ts");

const {
  assertGetAttribute,
  assertGetAttributeFree,
  assertGetAttributeETH,
} = require("../utils/verify.ts");

const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const { signMint } = require("../utils/signature.ts");

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

    await passport
      .connect(minterA)
      .mintPassport(minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt, sig, {
        value: MINT_PRICE,
      });

    await usdc.transfer(minterA.address, parseUnits("1000", 6));
    await usdc.transfer(minterB.address, parseUnits("1000", 6));
  });

  describe("getAttribute", async () => {
    it("success - getAttribute(DID) - Payable", async () => {
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
    });

    it("success - getAttribute for free attribute", async () => {
      const priceAttribute = parseUnits(
        PRICE_PER_ATTRIBUTES[ATTRIBUTE_AML].toString(),
        await usdc.decimals()
      );

      // Retrieve initialBalances
      const initialBalance = await usdc.balanceOf(minterA.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);
      const initialBalanceIssuer = await usdc.balanceOf(issuer.address);
      const initialBalanceIssuerTreasury = await usdc.balanceOf(
        issuerTreasury.address
      );
      const initialBalanceProtocolTreasury = await usdc.balanceOf(
        treasury.address
      );

      // GetAttribute function
      await expect(
        defi.connect(minterA).doSomething(ATTRIBUTE_AML, usdc.address)
      )
        .to.emit(defi, "GetAttributeEvent")
        .withArgs(aml, issuedAt);

      // Check Balance
      expect(await usdc.balanceOf(minterA.address)).to.equal(
        initialBalance.sub(priceAttribute)
      );
      expect(await usdc.balanceOf(passport.address)).to.equal(
        priceAttribute.add(initialBalancePassport)
      );
      expect(await usdc.balanceOf(issuer.address)).to.equal(
        initialBalanceIssuer
      );
      expect(await usdc.balanceOf(issuerTreasury.address)).to.equal(
        initialBalanceIssuerTreasury
      );
      expect(await usdc.balanceOf(treasury.address)).to.equal(
        initialBalanceProtocolTreasury
      );
      await expect(
        passport.withdrawToken(issuer.address, usdc.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
      await expect(
        passport.withdrawToken(issuer.address, usdc.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
      await expect(
        passport.withdrawToken(issuerTreasury.address, usdc.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
      await expect(
        passport.withdrawToken(treasury.address, usdc.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });

    it("fail - getAttribute(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesIncludingOnly(
          wallet.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address,
          [issuer.address]
        )
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - getAttribute(DID) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesIncludingOnly(
          wallet.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address,
          [issuer.address]
        )
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - insufficient allowance", async () => {
      await expect(
        reader.getAttributesIncludingOnly(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_DID,
          usdc.address,
          [issuer.address]
        )
      ).to.revertedWith("ERC20: insufficient allowance");
    });

    it("fail - getAttributesIncludingOnly from address(0)", async () => {
      await expect(
        reader.getAttributesIncludingOnly(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address,
          [issuer.address]
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("fail - getAttributesIncludingOnly ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesIncludingOnly(
          minterA.address,
          wrongTokenId,
          ATTRIBUTE_AML,
          usdc.address,
          [issuer.address]
        )
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - getAttribute ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesIncludingOnly(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address,
          [issuer.address]
        )
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });
    it("fail - getAttribute ineligible attribute (Country)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, false);
      await expect(
        reader.getAttributesIncludingOnly(
          minterA.address,
          TOKEN_ID,
          ATTRIBUTE_COUNTRY,
          usdc.address,
          [issuer.address]
        )
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });
  });

  describe("getAttributeFree", async () => {
    it("success - getAttributeFree(AML)", async () => {
      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
    });

    it("fail - getAttributesFreeIncludingOnly(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesFreeIncludingOnly(wallet.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - getAttributeFree from address(0)", async () => {
      await expect(
        reader.getAttributesFreeIncludingOnly(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_AML,
          [issuer.address]
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("fail - getAttributeFree ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesFreeIncludingOnly(minterA.address, wrongTokenId, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - getAttributeFree ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesFreeIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - attribute not free", async () => {
      await expect(
        reader.getAttributesFreeIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_DID, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_FREE");
    });
  });

  // getAttributeETH tests
  describe("getAttributeETH", async () => {
    const getDIDPrice = parseEther(
      (PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
    );

    it("success - getAttributeETH(DID) - Payable", async () => {
      await assertGetAttributeETH(
        minterA,
        defi,
        passport,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
    });

    it("fail - getAttributesETHIncludingOnly(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();

      await expect(
        reader.getAttributesETHIncludingOnly(wallet.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - getAttributeETH(DID) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesETHIncludingOnly(wallet.address, TOKEN_ID, ATTRIBUTE_DID, [issuer.address], {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - insufficient eth amount", async () => {
      await expect(
        reader.getAttributesETHIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_DID, [issuer.address], {
          value: getDIDPrice.sub(1),
        })
      ).to.revertedWith("INSUFFICIENT_PAYMENT_AMOUNT");
      await expect(
        reader.getAttributesETHIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_DID, [issuer.address], {
          value: getDIDPrice.add(1),
        })
      ).to.revertedWith("INSUFFICIENT_PAYMENT_AMOUNT");
      await expect(
        reader.getAttributesETHIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_DID, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("INSUFFICIENT_PAYMENT_AMOUNT");
    });

    it("fail - getAttributeETHInlcudingOnly from address(0)", async () => {
      await expect(
        reader.getAttributesETHIncludingOnly(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_DID,
          [issuer.address],
          { value: getDIDPrice }
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    // TODO: Add tests for excluding and multi issuer tests with null values

    it("fail - getAttributeETHInlcudingOnly ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesETHIncludingOnly(minterA.address, wrongTokenId, ATTRIBUTE_DID, [issuer.address], {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - getAttributesETHIncludingOnly ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesETHIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - getAttributesETHIncludingOnly ineligible attribute (Country)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, false);
      await expect(
        reader.getAttributesETHIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_COUNTRY, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });
  });
});
