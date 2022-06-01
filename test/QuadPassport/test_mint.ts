import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract, utils, Wallet } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  parseEther,
  parseUnits,
  formatBytes32String,
  id,
} from "ethers/lib/utils";
import { assertGetAttributeETHWrapper, assertGetAttributeFreeWrapper } from "../utils/verify";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  ATTRIBUTE_IS_BUSINESS,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_PER_BUSINESS_ATTRIBUTES,
  PRICE_PER_ATTRIBUTES,
} = require("../../utils/constant.ts");
const { signMint, signMessage } = require("../utils/signature.ts");
const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");
const {
  assertMint,
  assertGetAttribute,
  assertGetAttributeFree,
} = require("../utils/verify.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract;
  let usdc: Contract;
  let defi: Contract;
  let mockBusiness: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuerB: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerBTreasury: SignerWithAddress,
    attacker: SignerWithAddress;
  let baseURI: string;
  let did: string;
  let aml: string;
  let country: string;
  let isBusiness: string;
  let issuedAt: number;

  describe("mintPassport", async () => {
    beforeEach(async () => {
      baseURI = "https://quadrata.io";
      did = formatBytes32String("did:quad:123456789abcdefghi");
      aml = id("LOW");
      country = id("FRANCE");
      isBusiness = id("FALSE");
      issuedAt = Math.floor(new Date().getTime() / 1000);

      [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury, issuerB, issuerBTreasury, attacker] =
        await ethers.getSigners();
      [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
        admin,
        [issuer, issuerB],
        treasury,
        [issuerTreasury, issuerBTreasury],
        baseURI
      );

      const MockBusiness = await ethers.getContractFactory('MockBusiness')
      mockBusiness = await MockBusiness.deploy(defi.address)
      await mockBusiness.deployed()

      await usdc.transfer(minterA.address, parseUnits("1000", 6));
      await usdc.transfer(minterB.address, parseUnits("1000", 6));
    });

    it("success mint", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
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
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
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

    it.skip("success - mint multiple passports with same DID", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await assertMint(
        minterB,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      for (const wallet of [minterA, minterB]) {
        await assertGetAttributeFree(
          [issuer.address],
          wallet,
          defi,
          passport,
          reader,
          ATTRIBUTE_AML,
          aml,
          issuedAt
        );
        await assertGetAttribute(
          wallet,
          treasury,
          issuer,
          issuerTreasury,
          usdc,
          defi,
          passport,
          reader,
          ATTRIBUTE_COUNTRY,
          country,
          issuedAt
        );
        await assertGetAttribute(
          wallet,
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
      }
    });

    it.skip("success - two issuers may mint multiple passports with same DID", async () => {

      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await passport.connect(issuer).withdrawETH(issuerTreasury.address);

      await assertMint(
        minterB,
        issuerB,
        issuerBTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await passport.connect(issuerB).withdrawETH(issuerBTreasury.address);

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

      await assertGetAttributeFree(
        [issuerB.address],
        minterB,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );

      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );

      await assertGetAttribute(
        minterB,
        treasury,
        issuerB,
        issuerBTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
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
      await assertGetAttribute(
        minterB,
        treasury,
        issuerB,
        issuerBTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
    });

    it.skip('success mint -- two issuers mint same args for account', async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      await assertMint(
        minterA,
        issuerB,
        issuerBTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt,
        1,
        { newIssuerMint: true }
      );

      const expectedDIDs = [did, did];
      const expectedAMLs = [aml, aml];
      const expectedCOUNTRYs = [country, country];
      const expectedIssuedAts = [BigNumber.from(issuedAt), BigNumber.from(issuedAt)];
      const expectedIsBusinesses = [isBusiness, isBusiness];

      await assertGetAttributeETHWrapper(
        minterA,
        defi,
        passport,
        ATTRIBUTE_DID,
        expectedDIDs,
        expectedIssuedAts,
      );

      await assertGetAttributeFreeWrapper(
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        expectedAMLs,
        expectedIssuedAts,
        1,
        {}
      )
      await assertGetAttributeETHWrapper(
        minterA,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        expectedCOUNTRYs,
        expectedIssuedAts,
      );
      await assertGetAttributeETHWrapper(
        minterA,
        defi,
        passport,
        ATTRIBUTE_IS_BUSINESS,
        expectedIsBusinesses,
        expectedIssuedAts,
      );
    });

    it.skip('success mint -- two issuers mint different args for account', async () => {

      const expectedDIDs = [id("Mr. T"), id("Prof. Aaron")];
      const expectedAMLs = [aml, aml];
      const expectedCOUNTRYs = [id("KR"), id("SR")];
      const expectedIssuedAts = [BigNumber.from(1999), BigNumber.from(1890)];
      const expectedIsBusinesses = [id("TRUE"), isBusiness];

      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        expectedDIDs[0],
        expectedAMLs[0],
        expectedCOUNTRYs[0],
        expectedIsBusinesses[0],
        expectedIssuedAts[0]
      );
      await assertMint(
        minterA,
        issuerB,
        issuerBTreasury,
        passport,
        expectedDIDs[1],
        expectedAMLs[1],
        expectedCOUNTRYs[1],
        expectedIsBusinesses[1],
        expectedIssuedAts[1],
        1,
        { newIssuerMint: true }
      );

      await assertGetAttributeETHWrapper(
        minterA,
        defi,
        passport,
        ATTRIBUTE_DID,
        expectedDIDs,
        expectedIssuedAts,
      );

      await assertGetAttributeFreeWrapper(
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        expectedAMLs,
        expectedIssuedAts,
        1,
        {}
      )

      await assertGetAttributeETHWrapper(
        minterA,
        defi,
        passport,
        ATTRIBUTE_COUNTRY,
        expectedCOUNTRYs,
        expectedIssuedAts,
      );

      await assertGetAttributeETHWrapper(
        minterA,
        defi,
        passport,
        ATTRIBUTE_IS_BUSINESS,
        expectedIsBusinesses,
        expectedIssuedAts,
      );
    });

    it.skip("success mint -- EOA that is a business", async () => {
      await assertMint(
        minterB,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        id("TRUE"),
        issuedAt
      );
      await assertGetAttributeFree(
        [issuer.address],
        minterB,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        aml,
        issuedAt
      );
      await assertGetAttribute(
        minterB,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      await assertGetAttribute(
        minterB,
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

    it.skip("success - mint with mint price (0)", async () => {
      await governance.connect(admin).setMintPrice(0);
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
        .connect(minterA)
        .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
          value: parseEther("0"),
        });
      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      expect(await passport.provider.getBalance(passport.address)).to.equal(0);
      await expect(
        passport.withdrawETH(issuerTreasury.address)
      ).to.be.revertedWith("NOT_ENOUGH_BALANCE");
    });

    it.skip("success - aml (high)", async () => {
      aml = id("HIGH");
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
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
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
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

    it.skip("success - same wallet, different tokenIds", async () => {
      const newTokenId = 2;
      await governance.connect(admin).setEligibleTokenId(newTokenId, true);

      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt,
        newTokenId
      );
      for (const tokenId of [TOKEN_ID, newTokenId]) {
        await assertGetAttributeFree(
          [issuer.address],
          minterA,
          defi,
          passport,
          reader,
          ATTRIBUTE_AML,
          aml,
          issuedAt,
          tokenId
        );
        await assertGetAttribute(
          minterA,
          treasury,
          issuer,
          issuerTreasury,
          usdc,
          defi,
          passport,
          reader,
          ATTRIBUTE_COUNTRY,
          country,
          issuedAt,
          tokenId
        );

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
          issuedAt,
          tokenId
        );
      }
    });

    it.skip("fail - mint the same passport using the exact same arguments", async () => {

      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
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

      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, '0x00', {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("SIGNATURE_ALREADY_USED");

      await assertGetAttributeFree(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        aml,
        issuedAt,
        1
      );
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        issuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt,
        1
      );

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
        issuedAt,
        1
      );
    });

    it.skip("success - change of issuer treasury", async () => {
      const newIssuerTreasury = ethers.Wallet.createRandom();
      await governance
        .connect(admin)
        .setIssuer(issuer.address, newIssuerTreasury.address);

      await assertMint(
        minterA,
        issuer,
        newIssuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

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
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        newIssuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        country,
        issuedAt
      );
      await assertGetAttribute(
        minterA,
        treasury,
        issuer,
        newIssuerTreasury,
        usdc,
        defi,
        passport,
        reader,
        ATTRIBUTE_DID,
        did,
        issuedAt
      );
      await expect(
        passport.withdrawETH(issuerTreasury.address)
      ).to.revertedWith("NOT_ENOUGH_BALANCE");
    });

    it.skip("fail - invalid mint Price", async () => {
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

      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);


      const sigAccount = await signMessage(minterA, minterA.address);
      const wrongMintPrice = parseEther("1");

      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
            value: wrongMintPrice,
          })
      ).to.be.revertedWith("INVALID_MINT_PRICE");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    });

    it.skip("fail - passing 0 wei for mint", async () => {
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
      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);

      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, '0x00', {
            value: 0,
          })
      ).to.be.revertedWith("INVALID_MINT_PRICE");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    });

    it.skip("fail - invalid tokenId", async () => {
      const badTokenId = 1337;
      const sig = await signMint(
        issuer,
        minterA,
        badTokenId,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      const sigAccount = await signMessage(minterA, minterA.address);
      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, badTokenId, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it.skip("fail - passport already exists", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
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

      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("SIGNATURE_ALREADY_USED");
    });

    it.skip("success - passport already exists - two diff issuers", async () => {
      const issuerB = ethers.Wallet.createRandom();
      const issuerBTreasury = ethers.Wallet.createRandom();
      await governance
        .connect(admin)
        .setIssuer(issuerB.address, issuerBTreasury.address);

      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      const sig = await signMint(
        issuerB,
        minterA,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      const sigAccount = await signMessage(minterA, minterA.address);

      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
            value: MINT_PRICE,
          })
      ).to.not.be.reverted;
    });

    it.skip("fail - invalid hash (wrong DID)", async () => {
      const wrongDID = id("Ceaser");
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

      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);

      const sigAccount = await signMessage(minterA, minterA.address);
      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, wrongDID, aml, country, isBusiness, issuedAt], sig, sigAccount, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    });

    it.skip("fail - invalid hash (wrong aml), invalid sigAccount", async () => {
      const wrongAML = id("HIGH");
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

      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);

      const sigAccount = await signMessage(issuer, minterA.address);
      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, wrongAML, country, isBusiness, issuedAt], sig, sigAccount, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    });

    it.skip("fail - invalid hash (wrong country)", async () => {
      const wrongCountry = id("RU");
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
      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);

      const sigAccount = await signMessage(minterA, minterA.address);
      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, wrongCountry, isBusiness, issuedAt], sig, sigAccount, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    });

    it.skip("fail - invalid hash (wrong isBusiness)", async () => {
      const wrongIsBusiness = id("MAYBE");
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

      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);

      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, country, wrongIsBusiness, issuedAt], sig, '0x00', {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    });

    it.skip("fail - invalid hash (issuedAt)", async () => {
      const wrongIssuedAt = Math.floor(new Date().getTime() / 1000) + 1;
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
      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);

      const sigAccount = await signMessage(minterA, minterA.address);
      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, wrongIssuedAt], sig, sigAccount, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    });

    it.skip("fail - invalid hash (wrong TokenId)", async () => {
      const wrongTokenId = 1337;
      const sig = await signMint(
        issuer,
        minterA,
        wrongTokenId,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );
      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);
      const sigAccount = await signMessage(issuer, minterA.address);

      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    });

    it.skip("fail - using someone else signature", async () => {
      await assertMint(
        minterA,
        issuer,
        issuerTreasury,
        passport,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
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
      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterB.address, 1)).equals(0);

      const sigAccount = await signMessage(minterA, minterA.address);

      await expect(
        passport
          .connect(minterB)
          .mintPassport([minterB.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterB.address, 1)).equals(0);

    });

    it.skip("fail - using sig from a non-issuer", async () => {

      const nonIssuer = Wallet.createRandom();

      const sig = await signMint(
        nonIssuer,
        minterA,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);

      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, '0x00', {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    });

    it.skip("fail - invalid issuer", async () => {
      const invalidSigner = ethers.Wallet.createRandom();
      const sig = await signMint(
        invalidSigner,
        minterA,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(invalidSigner.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);

      const sigAccount = await signMessage(invalidSigner, minterA.address);

      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(invalidSigner.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    });

    it.skip("fail - invalid account", async () => {
      const sig = await signMint(
        issuer,
        minterB,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);

      await expect(
        passport
          .connect(minterA)
          .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, '0x00', {
            value: MINT_PRICE,
          })
      ).to.be.revertedWith("INVALID_ISSUER");

      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    });
  });

  describe("KYB", async () => {

    it("fail - contracts cannot mint as individuals even when their code length is 0", async () => {
      const nextAddress = utils.getContractAddress({from: attacker.address, nonce: 0});
      console.log(nextAddress);
      console.log(utils.getContractAddress({from: attacker.address, nonce: 1}));
      console.log(utils.getContractAddress({from: attacker.address, nonce: 2}));

      const sig = await signMint(
        issuer,
        nextAddress,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      console.log(passport)
      console.log(passport.address)
      console.log([nextAddress, TOKEN_ID, did, aml, country, isBusiness, issuedAt])
      console.log(sig)

      const BadMinter = await ethers.getContractFactory("BadMinter");
      const badMinter = await BadMinter.deploy(passport.address, [nextAddress, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, '0x00');
      await badMinter.deployed();
    });

    it.skip("fail - mint passport to contract while not a business", async () => {

      const DeFi = await ethers.getContractFactory("DeFi");
      const defi = await DeFi.deploy(passport.address, reader.address);
      await defi.deployed();

      const sig = await signMint(
        issuer,
        mockBusiness,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      const sigAccount = await signMessage(minterA, mockBusiness.address);

      expect(await passport.balanceOf(mockBusiness.address, 1)).equals(0);
      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      const promise = passport
        .connect(minterA)
        .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
          value: MINT_PRICE,
        });

      await expect(promise).to.be.revertedWith("INVALID_ACCOUNT");
      expect(await passport.balanceOf(mockBusiness.address, 1)).equals(0);
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuer.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');

    });
    it.skip("fail - mint passport to contract with account forging contract sig while not a business", async () => {

      const DeFi = await ethers.getContractFactory("DeFi");
      const defi = await DeFi.deploy(passport.address, reader.address);
      await defi.deployed();

      const sig = await signMint(
        issuer,
        mockBusiness,
        TOKEN_ID,
        did,
        aml,
        country,
        isBusiness,
        issuedAt
      );

      const sigAccount = await signMessage(minterA, minterA.address);

      const promise = passport
        .connect(minterA)
        .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
          value: MINT_PRICE,
        });

      await expect(promise).to.be.revertedWith("INVALID_ACCOUNT");


    });
    it.skip("success - mint a business passport for a smart contract owned account", async () => {

      const newIsBusiness = id("TRUE")

      const DeFi = await ethers.getContractFactory("DeFi");
      const defi = await DeFi.deploy(passport.address, reader.address);
      await defi.deployed();

      const sig = await signMint(
        issuer,
        mockBusiness,
        TOKEN_ID,
        did,
        aml,
        country,
        newIsBusiness,
        issuedAt
      );
      expect(await passport.balanceOf(mockBusiness.address, 1)).equals(0);
      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuerTreasury.address)).to.be.revertedWith('NOT_ENOUGH_BALANCE');

      const promise = passport
        .connect(minterA)
        .mintPassport([mockBusiness.address, TOKEN_ID, did, aml, country, newIsBusiness, issuedAt], sig, '0x00', {
          value: MINT_PRICE,
        });

      await promise;
      expect(await passport.balanceOf(mockBusiness.address, 1)).equals(1);
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      const response = await passport.callStatic.withdrawETH(issuerTreasury.address);
      expect(response).to.equals(MINT_PRICE);
    });

    it.skip("success - mint a business passport for an EAO", async () => {

      const newIsBusiness = id("TRUE")

      const sig = await signMint(
        issuer,
        minterA,
        TOKEN_ID,
        did,
        aml,
        country,
        newIsBusiness,
        issuedAt
      );

      const sigAccount = await signMessage(minterA, minterA.address);

      expect(await passport.balanceOf(minterA.address, 1)).equals(0);
      const protocolTreasury = (await governance.config()).treasury;
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      await expect(passport.withdrawETH(issuerTreasury.address)).to.not.be.revertedWith('NOT_ENOUGH_BALANCE');

      const promise = passport
        .connect(minterA)
        .mintPassport([minterA.address, TOKEN_ID, did, aml, country, newIsBusiness, issuedAt], sig, sigAccount, {
          value: MINT_PRICE,
        });

      await promise;
      expect(await passport.balanceOf(mockBusiness.address, 1)).equals(1);
      await expect(passport.withdrawETH(protocolTreasury)).to.be.revertedWith('NOT_ENOUGH_BALANCE');
      const response = await passport.callStatic.withdrawETH(issuerTreasury.address);
      expect(response).to.equals(MINT_PRICE);
    });
  })
});
