import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  parseEther,
  parseUnits,
  formatBytes32String,
  id,
  hexZeroPad,
} from "ethers/lib/utils";
import { assertGetAttributeETHExcluding, assertGetAttributeETHIncluding, assertGetAttributeETHWrapper, assertGetAttributeExcluding, assertGetAttributeFreeIncluding, assertGetAttributeFreeWrapper, assertGetAttributeIncluding, assertGetAttributeWrapper, assertMint, assertSetAttribute } from "../utils/verify";
import exp from "constants";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_PER_ATTRIBUTES,
  ISSUER_STATUS,
} = require("../../utils/constant.ts");

const {
  assertGetAttribute,
  assertGetAttributeFree,
  assertGetAttributeETH,
  assertGetAttributeFreeExcluding
} = require("../utils/verify.ts");

const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const { signMint, signMessage } = require("../utils/signature.ts");

describe("QuadReader", async () => {
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
    issuerB: SignerWithAddress,
    issuerC: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerBTreasury: SignerWithAddress,
    issuerCTreasury: SignerWithAddress;

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

    [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury, issuerB, issuerBTreasury, issuerC, issuerCTreasury] =
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
    const sigAccount = await signMessage(
      minterA,
      minterA.address,
    );
    await passport
      .connect(minterA)
      .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
        value: MINT_PRICE,
      });

    await usdc.transfer(minterA.address, parseUnits("1000", 6));
    await usdc.transfer(minterB.address, parseUnits("1000", 6));
  });


  describe("getAttributeFreeExcluding", async() => {
    it("success - exclude 1 issuer", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);
      await governance.connect(admin).setIssuer(signers[2].address, signers[2].address);
      expect(await governance.getIssuersLength()).to.equal(4);
      await assertMint(minterA, signers[0], signers[0], passport, id("MINTER_A_ALPHA"), id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, id("MINTER_A_BRAVO"), id("MEDIUM"), id("US"), id("FALSE"), 12, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[2], signers[2], passport, id("MINTER_A_CHARLIE"), id("LOW"), id("US"), id("FALSE"), 10, 1, {newIssuerMint: true});

      await assertGetAttributeFreeExcluding(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        [id("LOW"), id("MEDIUM"), id("LOW")],
        [BigNumber.from(15), BigNumber.from(12), BigNumber.from(10)],
      );
    })

    it("success - deactivate all issuers - exclude 1", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);
      await governance.connect(admin).setIssuer(signers[2].address, signers[2].address);
      expect(await governance.getIssuersLength()).to.equal(4);
      await assertMint(minterA, signers[0], signers[0], passport, id("MINTER_A_ALPHA"), id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, id("MINTER_A_BRAVO"), id("MEDIUM"), id("US"), id("FALSE"), 12, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[2], signers[2], passport, id("MINTER_A_CHARLIE"), id("LOW"), id("US"), id("FALSE"), 10, 1, {newIssuerMint: true});
      await governance.connect(admin).setIssuerStatus(signers[0].address, ISSUER_STATUS.DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(signers[1].address, ISSUER_STATUS.DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(signers[2].address, ISSUER_STATUS.DEACTIVATED);

      await assertGetAttributeFreeExcluding(
        [issuer.address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        [],
        [],
      );
    })

    it("success - deactivate all but 1 issuer - exclude 0", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);
      await governance.connect(admin).setIssuer(signers[2].address, signers[2].address);
      expect(await governance.getIssuersLength()).to.equal(4);
      await assertMint(minterA, signers[0], signers[0], passport, id("MINTER_A_ALPHA"), id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, id("MINTER_A_BRAVO"), id("MEDIUM"), id("US"), id("FALSE"), 12, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[2], signers[2], passport, id("MINTER_A_CHARLIE"), id("LOW"), id("US"), id("FALSE"), 10, 1, {newIssuerMint: true});
      await governance.connect(admin).setIssuerStatus(signers[0].address, ISSUER_STATUS.DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(signers[1].address, ISSUER_STATUS.DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(signers[2].address, ISSUER_STATUS.DEACTIVATED);

      await assertGetAttributeFreeExcluding(
        [],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        [aml],
        [BigNumber.from(issuedAt)],
      );
    })

    it("success - exclude 3 issuers", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);
      await governance.connect(admin).setIssuer(signers[2].address, signers[2].address);
      expect(await governance.getIssuersLength()).to.equal(4);
      await assertMint(minterA, signers[0], signers[0], passport, id("MINTER_A_ALPHA"), id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, id("MINTER_A_BRAVO"), id("MEDIUM"), id("US"), id("FALSE"), 12, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[2], signers[2], passport, id("MINTER_A_CHARLIE"), id("LOW"), id("US"), id("FALSE"), 10, 1, {newIssuerMint: true});

      await assertGetAttributeFreeExcluding(
        [issuer.address, signers[0].address, signers[2].address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        [id("MEDIUM")],
        [BigNumber.from(12)],
      );
    })

    it("success - exclude 0 issuers", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);
      await governance.connect(admin).setIssuer(signers[2].address, signers[2].address);
      expect(await governance.getIssuersLength()).to.equal(4);
      await assertMint(minterA, signers[0], signers[0], passport, id("MINTER_A_ALPHA"), id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, id("MINTER_A_BRAVO"), id("MEDIUM"), id("US"), id("FALSE"), 12, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[2], signers[2], passport, id("MINTER_A_CHARLIE"), id("LOW"), id("US"), id("FALSE"), 10, 1, {newIssuerMint: true});

      await assertGetAttributeFreeExcluding(
        [],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        [aml, id("LOW"), id("MEDIUM"), id("LOW")],
        [BigNumber.from(issuedAt), BigNumber.from(15), BigNumber.from(12), BigNumber.from(10)],
      );
    })

    it("success - exclude all 4 issuers", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);
      await governance.connect(admin).setIssuer(signers[2].address, signers[2].address);
      expect(await governance.getIssuersLength()).to.equal(4);
      await assertMint(minterA, signers[0], signers[0], passport, id("MINTER_A_ALPHA"), id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, id("MINTER_A_BRAVO"), id("MEDIUM"), id("US"), id("FALSE"), 12, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[2], signers[2], passport, id("MINTER_A_CHARLIE"), id("LOW"), id("US"), id("FALSE"), 10, 1, {newIssuerMint: true});

      await assertGetAttributeFreeExcluding(
        [issuer.address, signers[0].address, signers[1].address, signers[2].address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        [],
        [],
      );
    })

    it("fail - getAttributesFreeExcluding(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesFreeExcluding(wallet.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - getAttributesFreeExcluding from address(0)", async () => {
      await expect(
        reader.getAttributesFreeExcluding(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_AML,
          [issuer.address]
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("fail - getAttributesFreeExcluding ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesFreeExcluding(minterA.address, wrongTokenId, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - getAttributesFreeExcluding ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesFreeExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - attribute not free", async () => {
      await expect(
        reader.getAttributesFreeExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_DID, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_FREE");
    });
  })

  describe("getAttributeFreeIncluding", async() => {
    it("success - Include 2 issuers (1 supported, 1 not supported)", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).deleteIssuer(signers[0].address)
      expect(await governance.getIssuersLength()).to.equal(1);

      await assertGetAttributeFreeIncluding(
        [issuer.address, signers[0].address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        [aml],
        [BigNumber.from(issuedAt)],
        1,
        {}
      );
    });

    it("success - Include 2 issuers (2 not supported)", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);
      await governance.connect(admin).deleteIssuer(signers[0].address)
      await governance.connect(admin).deleteIssuer(signers[1].address)
      expect(await governance.getIssuersLength()).to.equal(1);

      await assertGetAttributeFreeIncluding(
        [signers[0].address, signers[1].address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        [],
        [],
        1,
        {}
      );
    });

    it("success - Include 2 issuers (2 previously supported)", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).deleteIssuer(signers[0].address)
      await governance.connect(admin).deleteIssuer(issuer.address)
      expect(await governance.getIssuersLength()).to.equal(0);

      await assertGetAttributeFreeIncluding(
        [issuer.address, signers[1].address],
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        [],
        [],
        1,
        {}
      );
    });


    it("fail - getAttributesFreeExcluding(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesFreeExcluding(wallet.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - getAttributesFreeExcluding from address(0)", async () => {
      await expect(
        reader.getAttributesFreeExcluding(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_AML,
          [issuer.address]
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("fail - getAttributesFreeIncludingOnly ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesFreeIncludingOnly(minterA.address, wrongTokenId, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - getAttributesFreeIncludingOnly ineligible attribute (AML)", async () => {
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

  describe("getAttributesExcluding", async function() {
    it('success - (1 excluded, 1 included) - DID', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(2);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(2);

      await assertGetAttributeExcluding(
        minterA,
        treasury,
        [issuer.address], // excluded issuer
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_DID,
        [did], // expected returned attributes
        [BigNumber.from(15)], // expected dates of issuance
        [signers[0].address], // expected issuers to be returned
        1,
        {}
      )
    })

    it('success - (1 excluded, 2 included) - COUNTRY', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);

      expect(await governance.getIssuersLength()).to.equal(3);

      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, did, id("MEDIUM"), id("UR"), id("FALSE"), 678, 1, {newIssuerMint: true});

      await assertGetAttributeExcluding(
        minterA,
        treasury,
        [issuer.address], // excluded issuer
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        [id("US"), id("UR")], // expected returned attributes
        [BigNumber.from(15), BigNumber.from(678)], // expected dates of issuance
        [signers[0].address, signers[1].address], // expected issuers to be returned
        1,
        {}
      )
    })


    it('success - (0 excluded, 3 included) - AML', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);

      expect(await governance.getIssuersLength()).to.equal(3);

      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, did, id("MEDIUM"), id("UR"), id("FALSE"), 678, 1, {newIssuerMint: true});

      await assertGetAttributeExcluding(
        minterA,
        treasury,
        [], // excluded issuer
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_AML,
        [aml, id("LOW"), id("MEDIUM")], // expected returned attributes
        [BigNumber.from(issuedAt), BigNumber.from(15), BigNumber.from(678)], // expected dates of issuance
        [issuer.address, signers[0].address, signers[1].address], // expected issuers to be returned
        1,
        {assertFree: true}
      )
    })

    it('success - (exclude random address)', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);

      expect(await governance.getIssuersLength()).to.equal(3);

      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, did, id("MEDIUM"), id("UR"), id("FALSE"), 678, 1, {newIssuerMint: true});

      await assertGetAttributeExcluding(
        minterA,
        treasury,
        [signers[10].address], // excluded issuer
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        [country, id("US"), id("UR")], // expected returned attributes
        [BigNumber.from(issuedAt), BigNumber.from(15), BigNumber.from(678)], // expected dates of issuance
        [issuer.address, signers[0].address, signers[1].address], // expected issuers to be returned
        1,
        {}
      )
    })
    it("fail - getAttributesExcluding(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesExcluding(wallet.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address, [wallet.address])
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - getAttributesExcluding from address(0)", async () => {
      await expect(
        reader.getAttributesExcluding(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address,
          [issuer.address]
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("fail - getAttributesExcluding ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesExcluding(minterA.address, wrongTokenId, ATTRIBUTE_AML, usdc.address, [issuer.address])
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - getAttributesExcluding ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - attribute not free", async () => {
      await expect(
        reader.getAttributesExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_DID,usdc.address, [])
      ).to.revertedWith("ERC20: insufficient allowance");
    });
  });

  describe("getAttributesIncluding", async() => {
    it('success - (1 included) - DID', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(2);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(2);

      await assertGetAttributeIncluding(
        minterA,
        treasury,
        [issuer.address], // included issuer(s)
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_DID,
        [did], // expected returned attributes
        [BigNumber.from(issuedAt)], // expected dates of issuance
        [issuer.address], // expected issuers to be returned
        1,
        {}
      )
    })

    it('success - (include random address) - DID', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(2);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(2);

      await assertGetAttributeIncluding(
        minterA,
        treasury,
        [signers[19].address], // included issuer(s)
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_DID,
        [], // expected returned attributes
        [], // expected dates of issuance
        [], // expected issuers to be returned
        1,
        {assertFree: true}
      )
    })

    it('success - (2 included) - AML', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(2);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(2);

      await assertGetAttributeIncluding(
        minterA,
        treasury,
        [issuer.address, signers[0].address], // included issuer(s)
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_AML,
        [aml, id("LOW")], // expected returned attributes
        [BigNumber.from(issuedAt), BigNumber.from(15)], // expected dates of issuance
        [issuer.address, signers[0].address], // expected issuers to be returned
        1,
        {assertFree: true}
      )
    })
    it("fail - getAttributesIncludingOnly(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesIncludingOnly(wallet.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address, [wallet.address])
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
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
        reader.getAttributesIncludingOnly(minterA.address, wrongTokenId, ATTRIBUTE_AML, usdc.address, [issuer.address])
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - getAttributesIncludingOnly ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - attribute not free", async () => {
      await expect(
        reader.getAttributesIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_DID,usdc.address, [issuer.address])
      ).to.revertedWith("ERC20: insufficient allowance");
    });
  });

  describe("getAttributeETHExcluding", async () => {
    const getDIDPrice = parseEther(
      (PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
    );

    it("success - (1 excluded, 1 included)", async() => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(2);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(2);

      await assertGetAttributeETHExcluding(
        minterA,
        [issuer.address],
        defi,
        passport,
        ATTRIBUTE_DID,
        [did],
        [BigNumber.from(15)]
      )
    });

    it("success - (0 excluded, 2 included)", async() => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(2);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(2);

      await assertGetAttributeETHExcluding(
        minterA,
        [],
        defi,
        passport,
        ATTRIBUTE_DID,
        [did, did],
        [BigNumber.from(issuedAt), BigNumber.from(15)]
      )
    });

    it("fail - getAttributesETHExcluding(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();

      await expect(
        reader.getAttributesETHExcluding(wallet.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - getAttributesETHExcluding(DID) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesETHExcluding(wallet.address, TOKEN_ID, ATTRIBUTE_DID, [issuer.address], {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - insufficient eth amount", async () => {
      await expect(
        reader.getAttributesETHExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_DID, [], {
          value: getDIDPrice.sub(1),
        })
      ).to.revertedWith("INSUFFICIENT_PAYMENT_AMOUNT");

      await expect(
        reader.getAttributesETHExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_DID, [], {
          value: getDIDPrice.add(1),
        })
      ).to.revertedWith("INSUFFICIENT_PAYMENT_AMOUNT");

      await expect(
        reader.getAttributesETHExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_DID, [], {
          value: parseEther("0"),
        })
      ).to.revertedWith("INSUFFICIENT_PAYMENT_AMOUNT");
    });

    it("fail - getAttributesETHExcluding from address(0)", async () => {
      await expect(
        reader.getAttributesETHExcluding(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_DID,
          [issuer.address],
          { value: getDIDPrice }
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("fail - getAttributesETHExcluding ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesETHExcluding(minterA.address, wrongTokenId, ATTRIBUTE_DID, [issuer.address], {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - getAttributesETHExcluding ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesETHExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - getAttributesETHExcluding ineligible attribute (Country)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, false);
      await expect(
        reader.getAttributesETHExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_COUNTRY, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });
  });

  describe("getAttributeETHIncluding", async () => {
    const getDIDPrice = parseEther(
      (PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
    );

    it("success - (1 excluded, 1 included)", async() => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(2);
      await assertMint(minterA, signers[0], signers[0], passport, id("SIGNER_0"), id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(2);

      await assertGetAttributeETHIncluding(
        minterA,
        [issuer.address],
        defi,
        passport,
        ATTRIBUTE_DID,
        [did],
        [BigNumber.from(issuedAt)]
      )
    });

    it("success - (0 excluded, 2 included)", async() => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(2);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(2);

      await assertGetAttributeETHIncluding(
        minterA,
        [issuer.address, signers[0].address],
        defi,
        passport,
        ATTRIBUTE_DID,
        [did, did],
        [BigNumber.from(issuedAt), BigNumber.from(15)]
      )
    });

    it("fail - getAttributesETHIncludingOnly(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();

      await expect(
        reader.getAttributesETHIncludingOnly(wallet.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - getAttributesETHIncludingOnly(DID) - wallet not found", async () => {
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

    it("fail - getAttributesETHIncludingOnly from address(0)", async () => {
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

    it("fail - getAttributesETHIncludingOnly ineligible Token Id", async () => {
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

  describe("getAttributes", async function() {
    beforeEach(async () => {
      await governance.connect(admin).setIssuer(issuerB.address, issuerBTreasury.address);
      await governance.connect(admin).setIssuer(issuerC.address, issuerCTreasury.address);
    });

    it('success - (all included) - DID', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(4);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(4);

      await assertGetAttributeWrapper(
        minterA,
        treasury,
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_DID,
        [did, did], // expected returned attributes
        [BigNumber.from(issuedAt), BigNumber.from(15)], // expected dates of issuance
        [issuer.address, signers[0].address], // expected issuers to be returned
        1,
        {}
      )
    })

    it("success - mint individual passport for wallet A (COUNTRY = US), assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken)
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
        [
          [id("US")],
          [BigNumber.from(15)],
          [issuer.address]
        ]
      );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));
    });

    it("success - mint business passport for wallet A (COUNTRY = US), assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken)
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
        [
          [id("US")],
          [BigNumber.from(15)],
          [issuer.address]
        ]
      );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));
    });

    it("success - mint business passport for wallet A (DID = MINTER_A), assert DID is MINTER_A", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("DID"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken)
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("DID"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("DID"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
        [
          [id("MINTER_A")],
          [BigNumber.from(15)],
          [issuer.address]
        ]
      );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));
    });

    it("success - mint individual passport for wallet A (AML = 3), assert AML is 3", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("AML"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken)
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("AML"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("AML"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [hexZeroPad('0x03', 32)],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals('0')
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals('0')
    });

    it("success - mint business passport for wallet A (AML = 3), assert AML is 3", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("AML"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken)
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("AML"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("AML"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [hexZeroPad('0x03', 32)],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals('0')
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals('0')
    });

    it("success - mint business passport for wallet A (COUNTRY = US), update COUNTRY = FR, assert COUNTRY is FR", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertSetAttribute(minterA, issuer, issuerTreasury, passport, id("COUNTRY"), id("FR"), 16, {});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken)
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("FR")],
            [BigNumber.from(16)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));
    });

    it("success - mint individual passport for wallet A (COUNTRY = US), disable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken.mul(2))
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED);
      const response2 = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      expect(response2).to.eqls([[],[],[]]);

      const issuerWithdrawAmount2 = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount2 = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount2).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount2).equals(calcPaymentToken.div(2).add(calcPaymentToken));
    });

    it("success - mint indiviual passport for wallet A (COUNTRY = US), disable the enable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.ACTIVE);
      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken.mul(2))
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

    });

    it("success - mint individual passport for wallet A (COUNTRY = US), disable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken.mul(2))
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

      await governance.connect(admin).deleteIssuer(issuer.address);

      const response2 = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      expect(response2).to.eqls([[],[],[]]);

      const issuerWithdrawAmount2 = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount2 = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount2).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount2).equals(calcPaymentToken.div(2).add(calcPaymentToken));
    });

    it("success - mint individual passport for wallet A (COUNTRY = US), burnPassport, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken.mul(2))
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

      await passport.connect(minterA).burnPassport(1);

      await expect(reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address)).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

    });

    it("success - mint business passport for wallet A (COUNTRY = US), disable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken.mul(2))
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED);
      const response2 = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      expect(response2).to.eqls([[],[],[]]);

      const issuerWithdrawAmount2 = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount2 = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      const calcPaymentToken2 = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      expect(issuerWithdrawAmount2).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount2).equals(calcPaymentToken.div(2).add(calcPaymentToken2));
    });

    it("success - mint business passport for wallet A (COUNTRY = US), disable the enable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.ACTIVE);
      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken.mul(2))
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

    });

    it("success - mint business passport for wallet A (COUNTRY = US), disable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken.mul(2))
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

      await governance.connect(admin).deleteIssuer(issuer.address); // This is part of the bug
      // when the issuer gets removed, an internal function namely: _issuersContain will not find
      // the IS_BUSINESS attribute for the issuer. Therefore, the business will get it's attributes
      // at the price of an individual. This only happens when the issuers list is empty

      /**
       * When a business account queries an attribute and governance.getIssuersLength() is zero
       * they will recieve the attribute at the price of an individual, and not at the
       * proper business price. At this point, the protocol will treat the account as an individual
       * and not as a business
       */

      const response2 = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      expect(response2).to.eqls([[],[],[]]);

      const issuerWithdrawAmount2 = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount2 = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      const calcPaymentToken2 = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      // This should pass without calcPaymentToken2 if we want to remove default individual pricing behavior

      expect(issuerWithdrawAmount2).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount2).equals(calcPaymentToken.div(2).add(calcPaymentToken2)); // BUG, SHOULD PASS

    });

    it("success - mint business passport for wallet A (COUNTRY = US), burnPassport, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken.mul(2))
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

      await passport.connect(minterA).burnPassport(1);

      await expect(reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address)).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

    });

    it("success - mint passports from issuerA, issuerB, update COUNTRY=FR, assert COUNTRY is FR from issuerB", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken.mul(2))
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US"), id("US")],
            [BigNumber.from(15), BigNumber.from(15)],
            [issuer.address, issuerB.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(4));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

      await assertSetAttribute(minterA, issuerB, issuerBTreasury, passport, id("COUNTRY"), id("FR"), 16, {});

      const response2 = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      expect(response2).to.eqls(
        [
          [id("US"), id("FR")],
          [BigNumber.from(15), BigNumber.from(16)],
          [issuer.address, issuerB.address]
        ]
      );

      const issuerWithdrawAmount2 = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount2 = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount2).equals(calcPaymentToken.div(2));
      expect(protocolWithdrawAmount2).equals(calcPaymentToken);
    });

    it("success - mint passports from issuerA, issuerB, isseurC, disable issuerB, assert only COUNTRY from A, C remain", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 16, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("FR"), id("TRUE"), 17, 1, {newIssuerMint: true});

      await governance.connect(admin).setIssuerStatus(issuerB.address, ISSUER_STATUS.DEACTIVATED);

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken)
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US"), id("FR")],
            [BigNumber.from(15), BigNumber.from(17)],
            [issuer.address, issuerC.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(4));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

    });

    it("success - mint passports from issuerA, issuerB, isseurC, delete issuerB, assert only COUNTRY from A, C remain", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 16, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("FR"), id("TRUE"), 17, 1, {newIssuerMint: true});

      await governance.connect(admin).deleteIssuer(issuerB.address);

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken)
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US"), id("FR")],
            [BigNumber.from(15), BigNumber.from(17)],
            [issuer.address, issuerC.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(4));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

    });

    it("success - mint passports from issuerA, issuerB, isseurC, burnPassport, assert only COUNTRY from A, C remain", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 16, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("FR"), id("TRUE"), 17, 1, {newIssuerMint: true});

      await passport.connect(minterA).burnPassport(1);

      expect(reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address)).to.be.revertedWith('PASSPORT_DOES_NOT_EXIST');
    });

    it("success - mint passports from issuerA, issuerB, isseurC, burn issuerB, assert only COUNTRY from A, C remain", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 16, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("FR"), id("TRUE"), 17, 1, {newIssuerMint: true});

      await passport.connect(issuerB).burnPassportIssuer(minterA.address, 1);

      const initialBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const initialBalancePassport = await usdc.balanceOf(passport.address);

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken)
      const response = await reader.callStatic.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
      await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);

      const finalBalanceInquisitor = await usdc.balanceOf(deployer.address);
      const finalBalancePassport = await usdc.balanceOf(passport.address);

      expect(response).to.eqls(
          [
            [id("US"), id("FR")],
            [BigNumber.from(15), BigNumber.from(17)],
            [issuer.address, issuerC.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentToken)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentToken)

      const issuerWithdrawAmount = await passport.callStatic.withdrawToken(issuerTreasury.address, usdc.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawToken(treasury.address, usdc.address);

      expect(issuerWithdrawAmount).equals(calcPaymentToken.div(4));
      expect(protocolWithdrawAmount).equals(calcPaymentToken.div(2));

    });

    it("fail - cannot query without valid allowance", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 16, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("FR"), id("TRUE"), 17, 1, {newIssuerMint: true});

      const calcPaymentToken = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
      usdc.approve(reader.address, calcPaymentToken)

      await governance.connect(admin).allowTokenPayment(usdc.address, false);

      expect(reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address)).to.be.revertedWith('TOKEN_PAYMENT_NOT_ALLOWED');
    });

    it('success - (all included) - COUNTRY', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);

      expect(await governance.getIssuersLength()).to.equal(5);

      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, did, id("MEDIUM"), id("UR"), id("FALSE"), 678, 1, {newIssuerMint: true});

      await assertGetAttributeWrapper(
        minterA,
        treasury,
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        [country, id("US"), id("UR")], // expected returned attributes
        [BigNumber.from(issuedAt), BigNumber.from(15), BigNumber.from(678)], // expected dates of issuance
        [issuer.address, signers[0].address, signers[1].address], // expected issuers to be returned
        1,
        {}
      )
    })


    it('success - (all included) - AML', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);

      expect(await governance.getIssuersLength()).to.equal(5);

      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, did, id("MEDIUM"), id("UR"), id("FALSE"), 678, 1, {newIssuerMint: true});

      await assertGetAttributeWrapper(
        minterA,
        treasury,
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_AML,
        [aml, id("LOW"), id("MEDIUM")], // expected returned attributes
        [BigNumber.from(issuedAt), BigNumber.from(15), BigNumber.from(678)], // expected dates of issuance
        [issuer.address, signers[0].address, signers[1].address], // expected issuers to be returned
        1,
        {assertFree: true}
      )
    })

    it("fail - getAttributes(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributes(wallet.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address)
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - getAttributes from address(0)", async () => {
      await expect(
        reader.getAttributes(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address,
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("fail - getAttributes ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributes(minterA.address, wrongTokenId, ATTRIBUTE_AML, usdc.address)
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - getAttributes ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributes(minterA.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address)
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - attribute not free", async () => {
      await expect(
        reader.getAttributes(minterA.address, TOKEN_ID, ATTRIBUTE_DID,usdc.address)
      ).to.revertedWith("ERC20: insufficient allowance");
    });
  });
  describe("getAttributeFree", async() => {
    beforeEach(async () => {
      await governance.connect(admin).setIssuer(issuerB.address, issuerBTreasury.address);
      await governance.connect(admin).setIssuer(issuerC.address, issuerCTreasury.address);
    });

    it("success - (all issuers)", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);
      await governance.connect(admin).setIssuer(signers[2].address, signers[2].address);
      expect(await governance.getIssuersLength()).to.equal(6);
      await assertMint(minterA, signers[0], signers[0], passport, id("MINTER_A_ALPHA"), id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, id("MINTER_A_BRAVO"), id("MEDIUM"), id("US"), id("FALSE"), 12, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[2], signers[2], passport, id("MINTER_A_CHARLIE"), id("LOW"), id("US"), id("FALSE"), 10, 1, {newIssuerMint: true});

      await assertGetAttributeFreeWrapper(
        minterA,
        defi,
        passport,
        reader,
        ATTRIBUTE_AML,
        [aml, id("LOW"), id("MEDIUM"), id("LOW")],
        [BigNumber.from(issuedAt), BigNumber.from(15), BigNumber.from(12), BigNumber.from(10)],
        1,
        {}
      );
    })

    it("success - mint individual passport for wallet A (AML = 1), assert AML is 1", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await ethers.provider.getBalance(admin.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));

      const finalBalanceInquisitor = await ethers.provider.getBalance(admin.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response[0][0]).equals(hexZeroPad('0x01', 32));
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor)).equals('0')
      expect(initialBalancePassport.sub(finalBalancePassport)).equals('0')
    });

    it("success - mint business passport for wallet A (AML = 1), assert AML is 1", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});

      const initialBalanceInquisitor = await ethers.provider.getBalance(admin.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));

      const finalBalanceInquisitor = await ethers.provider.getBalance(admin.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response[0][0]).equals(hexZeroPad('0x01', 32));
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor)).equals('0')
      expect(initialBalancePassport.sub(finalBalancePassport)).equals('0')
    });

    it("success - mint individual passport for wallet A (AML = 1), update to AML=5, assert AML is 5", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertSetAttribute(minterA, issuer, issuerTreasury, passport, id("AML"), hexZeroPad('0x05', 32), issuedAt, {});

      const initialBalanceInquisitor = await ethers.provider.getBalance(admin.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));

      const finalBalanceInquisitor = await ethers.provider.getBalance(admin.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response[0][0]).equals(hexZeroPad('0x05', 32));
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor)).equals('0')
      expect(initialBalancePassport.sub(finalBalancePassport)).equals('0')
    });

    it("success - mint business passport for wallet A (AML = 1), update to AML=5, assert AML is 1", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertSetAttribute(minterA, issuer, issuerTreasury, passport, id("AML"), hexZeroPad('0x05', 32), issuedAt, {});

      const initialBalanceInquisitor = await ethers.provider.getBalance(admin.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));

      const finalBalanceInquisitor = await ethers.provider.getBalance(admin.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response[0][0]).equals(hexZeroPad('0x05', 32));
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor)).equals('0')
      expect(initialBalancePassport.sub(finalBalancePassport)).equals('0')
    });

    it("success - mint individual passport for wallet A (AML = 1), deactivate issuer, assert empty response", async  () => {
      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));

      expect(response[0].length).equals(0);
      expect(response[1].length).equals(0);
      expect(response[2].length).equals(0);

    });

    it("success - mint individual passport for wallet A (AML = 1), delete issuer, assert empty response", async  () => {
      await governance.connect(admin).deleteIssuer(issuer.address);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));

      expect(response[0].length).equals(0);
      expect(response[1].length).equals(0);
      expect(response[2].length).equals(0);

    });

    it("success - mint business passport for wallet A (AML = 1), deactivate issuer, assert empty response", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});

      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));

      expect(response[0].length).equals(0);
      expect(response[1].length).equals(0);
      expect(response[2].length).equals(0);

    });

    it("success - mint business passport for wallet A (AML = 1), delete issuer, assert empty response", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});

      await governance.connect(admin).deleteIssuer(issuer.address);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));

      expect(response[0].length).equals(0);
      expect(response[1].length).equals(0);
      expect(response[2].length).equals(0);

    });

    it("fail - mint individual passport for wallet A (AML = 1), burn, assert error", async  () => {
      await passport.connect(minterA).burnPassport(1);
      await expect(reader.getAttributesFree(minterA.address, 1, id("AML"))).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - mint Business passport for wallet A (AML = 1), burn, assert error", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await passport.connect(minterA).burnPassport(1);
      await expect(reader.getAttributesFree(minterA.address, 1, id("AML"))).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("success - mint business passport for wallet A (AML = 1), burn, assert empty response", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});

      await governance.connect(admin).deleteIssuer(issuer.address);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));

      expect(response[0].length).equals(0);
      expect(response[1].length).equals(0);
      expect(response[2].length).equals(0);

    });

    it("success - mint from issuerA(AML=1) and issuerB(AML=1), update issuerB(AML=5), assert issuerA(AML=1), issuerB(AML=5)", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertSetAttribute(minterA, issuerB, issuerBTreasury, passport, id("AML"), hexZeroPad('0x05', 32), 16, {});

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));
      const expectation = [
        [hexZeroPad('0x01', 32), hexZeroPad('0x05', 32)],
        [BigNumber.from('15'), BigNumber.from('16')],
        [issuer.address, issuerB.address]
      ];
      expect(response).to.eqls(expectation);
    });

    it("success - mint from issuerA, issuerB, issuerC), deactivate issuerB, assert values from issuerA and issuerB", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 13, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 14, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      await governance.connect(admin).setIssuerStatus(issuerB.address, ISSUER_STATUS.DEACTIVATED);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));
      const expectation = [
        [hexZeroPad('0x01', 32), hexZeroPad('0x01', 32)],
        [BigNumber.from('13'), BigNumber.from('15')],
        [issuer.address, issuerC.address]
      ];
      expect(response).to.eqls(expectation);
    });

    it("success - mint from issuerA, issuerB, issuerC), deactivate issuerB, assert values from issuerA and issuerB, activate again, assert all values", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 13, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 14, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      await governance.connect(admin).setIssuerStatus(issuerB.address, ISSUER_STATUS.DEACTIVATED);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));
      const expectation = [
        [hexZeroPad('0x01', 32), hexZeroPad('0x01', 32)],
        [BigNumber.from('13'), BigNumber.from('15')],
        [issuer.address, issuerC.address]
      ];
      expect(response).to.eqls(expectation);

      await governance.connect(admin).setIssuerStatus(issuerB.address, ISSUER_STATUS.ACTIVE);

      const response2 = await reader.getAttributesFree(minterA.address, 1, id("AML"));
      const expectation2 = [
        [hexZeroPad('0x01', 32), hexZeroPad('0x01', 32), hexZeroPad('0x01', 32)],
        [BigNumber.from('13'), BigNumber.from('14'), BigNumber.from('15')],
        [issuer.address, issuerB.address, issuerC.address]
      ];
      expect(response2).to.eqls(expectation2);
    });

    it("success - mint from issuerA, issuerB, issuerC), delete issuerB, assert values from issuerA and issuerB", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 13, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 14, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      await governance.connect(admin).deleteIssuer(issuerB.address);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));
      const expectation = [
        [hexZeroPad('0x01', 32), hexZeroPad('0x01', 32)],
        [BigNumber.from('13'), BigNumber.from('15')],
        [issuer.address, issuerC.address]
      ];
      expect(response).to.eqls(expectation);
    });

    it("fail - mint from issuerA, issuerB, issuerC), burnPassport, revert PASSPORT_DOES_NOT_EXIST", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 13, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 14, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      await passport.connect(minterA).burnPassport(1);

      await expect(reader.getAttributesFree(minterA.address, 1, id("AML"))).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("success - mint from issuerA, issuerB, issuerC), burnPassport issuerB, assert values from issuerA and issuerB", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 13, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 14, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      await passport.connect(issuerB).burnPassportIssuer(minterA.address, 1);

      const response = await reader.getAttributesFree(minterA.address, 1, id("AML"));
      const expectation = [
        [hexZeroPad('0x01', 32), hexZeroPad('0x01', 32)],
        [BigNumber.from('13'), BigNumber.from('15')],
        [issuer.address, issuerC.address]
      ];
      expect(response).to.eqls(expectation);
    });

    it("fail - getAttributesFree(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesFree(wallet.address, TOKEN_ID, ATTRIBUTE_AML)
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - getAttributesFree from address(0)", async () => {
      await expect(
        reader.getAttributesFree(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_AML
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("fail - getAttributesFree ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesFree(minterA.address, wrongTokenId, ATTRIBUTE_AML)
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - getAttributesFree ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesFree(minterA.address, TOKEN_ID, ATTRIBUTE_AML)
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - attribute not free (did)", async () => {
      await expect(
        reader.getAttributesFree(minterA.address, TOKEN_ID, ATTRIBUTE_DID)
      ).to.revertedWith("ATTRIBUTE_NOT_FREE");
    });

    it("fail - attribute not free for individual (country)", async () => {
      await expect(
        reader.getAttributesFree(minterA.address, TOKEN_ID, ATTRIBUTE_COUNTRY)
      ).to.revertedWith("ATTRIBUTE_NOT_FREE");
    });

    it("fail - attribute not free for business (country)", async () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await expect(
        reader.getAttributesFree(minterA.address, TOKEN_ID, ATTRIBUTE_COUNTRY)
      ).to.revertedWith("ATTRIBUTE_NOT_FREE");
    });
  })

  describe("getAttributeETH", async () => {
    beforeEach(async () => {
      await governance.connect(admin).setIssuer(issuerB.address, issuerBTreasury.address);
      await governance.connect(admin).setIssuer(issuerC.address, issuerCTreasury.address);
    });

    const getDIDPrice = parseEther(
      (PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
    );

    it("success - (all included)", async() => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(4);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(4);

      await assertGetAttributeETHWrapper(
        minterA,
        defi,
        passport,
        ATTRIBUTE_DID,
        [did, did],
        [BigNumber.from(issuedAt), BigNumber.from(15)]
      )
    });

    it("success - mint individual passport for wallet A (COUNTRY = US), assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
        [
          [id("US")],
          [BigNumber.from(15)],
          [issuer.address]
        ]
      );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor)).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));
    });

    it("success - mint business passport for wallet A (COUNTRY = US), assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);


      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
        [
          [id("US")],
          [BigNumber.from(15)],
          [issuer.address]
        ]
      );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));
    });

    it("success - mint business passport for wallet A (DID = MINTER_A), assert DID is MINTER_A", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x01', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("DID"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("DID"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("DID"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
        [
          [id("MINTER_A")],
          [BigNumber.from(15)],
          [issuer.address]
        ]
      );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));
    });

    it("success - mint individual passport for wallet A (AML = 3), assert AML is 3", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("AML"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("AML"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("AML"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [hexZeroPad('0x03', 32)],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(gas)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals('0')
    });

    it("success - mint business passport for wallet A (AML = 3), assert AML is 3", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("AML"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("AML"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("AML"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [hexZeroPad('0x03', 32)],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(gas)
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals('0')
    });

    it("success - mint business passport for wallet A (COUNTRY = US), update COUNTRY = FR, assert COUNTRY is FR", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertSetAttribute(minterA, issuer, issuerTreasury, passport, id("COUNTRY"), id("FR"), 16, {});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("FR")],
            [BigNumber.from(16)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));
    });

    it("success - mint individual passport for wallet A (COUNTRY = US), disable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED);
      const response2 = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      expect(response2).to.eqls([[],[],[]]);

      const issuerWithdrawAmount2 = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount2 = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount2).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount2).equals(calcPaymentETH.div(2).add(calcPaymentETH));
    });

    it("success - mint indiviual passport for wallet A (COUNTRY = US), disable the enable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.ACTIVE);
      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

    });

    it("success - mint individual passport for wallet A (COUNTRY = US), disable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

      await governance.connect(admin).deleteIssuer(issuer.address);

      const response2 = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      expect(response2).to.eqls([[],[],[]]);

      const issuerWithdrawAmount2 = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount2 = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount2).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount2).equals(calcPaymentETH.div(2).add(calcPaymentETH));
    });

    it("success - mint individual passport for wallet A (COUNTRY = US), burnPassport, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

      await passport.connect(minterA).burnPassport(1);

      await expect(reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH})).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

    });

    it("success - mint business passport for wallet A (COUNTRY = US), disable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH= await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED);

      const calcPaymentETH2 = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response2 = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH2});
      await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH2});
      expect(response2).to.eqls([[],[],[]]);

      const issuerWithdrawAmount2 = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount2 = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount2).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount2).equals(calcPaymentETH.div(2).add(calcPaymentETH2));
    });

    it("success - mint business passport for wallet A (COUNTRY = US), disable the enable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(issuer.address, ISSUER_STATUS.ACTIVE);
      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

    });

    it("success - mint business passport for wallet A (COUNTRY = US), disable issuer, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"),  minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

      await governance.connect(admin).deleteIssuer(issuer.address);
      const calcPaymentETH2 = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);

      const response2 = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH2});
      await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH2});
      expect(response2).to.eqls([[],[],[]]);

      const issuerWithdrawAmount2 = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount2 = await passport.callStatic.withdrawETH(treasury.address);


      expect(issuerWithdrawAmount2).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount2).equals(calcPaymentETH.div(2).add(calcPaymentETH2));

    });

    it("success - mint business passport for wallet A (COUNTRY = US), burnPassport, assert COUNTRY is US", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US")],
            [BigNumber.from(15)],
            [issuer.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

      await passport.connect(minterA).burnPassport(1);

      await expect(reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH})).to.be.revertedWith("PASSPORT_DOES_NOT_EXIST");

    });

    it("success - mint passports from issuerA, issuerB, update COUNTRY=FR, assert COUNTRY is FR from issuerB", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US"), id("US")],
            [BigNumber.from(15), BigNumber.from(15)],
            [issuer.address, issuerB.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(4));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

      await assertSetAttribute(minterA, issuerB, issuerBTreasury, passport, id("COUNTRY"), id("FR"), 16, {});

      const response2 = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      expect(response2).to.eqls(
        [
          [id("US"), id("FR")],
          [BigNumber.from(15), BigNumber.from(16)],
          [issuer.address, issuerB.address]
        ]
      );

      const issuerWithdrawAmount2 = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount2 = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount2).equals(calcPaymentETH.div(2));
      expect(protocolWithdrawAmount2).equals(calcPaymentETH);
    });

    it("success - mint passports from issuerA, issuerB, isseurC, disable issuerB, assert only COUNTRY from A, C remain", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 16, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("FR"), id("TRUE"), 17, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      await governance.connect(admin).setIssuerStatus(issuerB.address, ISSUER_STATUS.DEACTIVATED);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US"), id("FR")],
            [BigNumber.from(15), BigNumber.from(17)],
            [issuer.address, issuerC.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(4));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

    });

    it("success - mint passports from issuerA, issuerB, isseurC, delete issuerB, assert only COUNTRY from A, C remain", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 16, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("FR"), id("TRUE"), 17, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      await governance.connect(admin).deleteIssuer(issuerB.address);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US"), id("FR")],
            [BigNumber.from(15), BigNumber.from(17)],
            [issuer.address, issuerC.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(4));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

    });

    it("success - mint passports from issuerA, issuerB, isseurC, burnPassport, assert only COUNTRY from A, C remain", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 16, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("FR"), id("TRUE"), 17, 1, {newIssuerMint: true});

      await passport.connect(minterA).burnPassport(1);
      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);

      expect(reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH})).to.be.revertedWith('PASSPORT_DOES_NOT_EXIST');
    });

    it("success - mint passports from issuerA, issuerB, isseurC, burn issuerB, assert only COUNTRY from A, C remain", async  () => {
      await assertMint(minterA, issuer, issuerTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerB, issuerBTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("US"), id("TRUE"), 16, 1, {newIssuerMint: true});
      await assertMint(minterA, issuerC, issuerCTreasury, passport, id("MINTER_A"), hexZeroPad('0x03', 32), id("FR"), id("TRUE"), 17, 1, {newIssuerMint: true});
      await passport.withdrawETH(issuerTreasury.address);

      await passport.connect(issuerB).burnPassportIssuer(minterA.address, 1);

      const initialBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const initialBalancePassport = await ethers.provider.getBalance(passport.address);

      const calcPaymentETH = await reader.calculatePaymentETH(id("COUNTRY"), minterA.address);
      const response = await reader.callStatic.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const tx = await reader.getAttributesETH(minterA.address, 1, id("COUNTRY"), {value: calcPaymentETH});
      const metaData = await tx.wait();
      const gas = metaData.cumulativeGasUsed.mul(metaData.effectiveGasPrice);

      const finalBalanceInquisitor = await ethers.provider.getBalance(deployer.address);
      const finalBalancePassport = await ethers.provider.getBalance(passport.address);

      expect(response).to.eqls(
          [
            [id("US"), id("FR")],
            [BigNumber.from(15), BigNumber.from(17)],
            [issuer.address, issuerC.address]
          ]
        );
      expect(initialBalanceInquisitor.sub(finalBalanceInquisitor).abs()).equals(calcPaymentETH.add(gas))
      expect(initialBalancePassport.sub(finalBalancePassport).abs()).equals(calcPaymentETH)

      const issuerWithdrawAmount = await passport.callStatic.withdrawETH(issuerTreasury.address);
      const protocolWithdrawAmount = await passport.callStatic.withdrawETH(treasury.address);

      expect(issuerWithdrawAmount).equals(calcPaymentETH.div(4));
      expect(protocolWithdrawAmount).equals(calcPaymentETH.div(2));

    });


    it('success - (all included) - COUNTRY', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);

      expect(await governance.getIssuersLength()).to.equal(5);

      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, did, id("MEDIUM"), id("UR"), id("FALSE"), 678, 1, {newIssuerMint: true});

      await assertGetAttributeWrapper(
        minterA,
        treasury,
        usdc,
        defi,
        governance,
        passport,
        reader,
        ATTRIBUTE_COUNTRY,
        [country, id("US"), id("UR")], // expected returned attributes
        [BigNumber.from(issuedAt), BigNumber.from(15), BigNumber.from(678)], // expected dates of issuance
        [issuer.address, signers[0].address, signers[1].address], // expected issuers to be returned
        1,
        {}
      )
    })

    it("fail - getAttributesETH(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();

      await expect(
        reader.getAttributesETH(wallet.address, TOKEN_ID, ATTRIBUTE_AML, {
          value: parseEther("0"),
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - getAttributesETH(DID) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesETH(wallet.address, TOKEN_ID, ATTRIBUTE_DID, {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it("fail - insufficient eth amount", async () => {
      await expect(
        reader.getAttributesETH(minterA.address, TOKEN_ID, ATTRIBUTE_DID, {
          value: getDIDPrice.sub(1),
        })
      ).to.revertedWith("INSUFFICIENT_PAYMENT_AMOUNT");

      await expect(
        reader.getAttributesETH(minterA.address, TOKEN_ID, ATTRIBUTE_DID, {
          value: getDIDPrice.add(1),
        })
      ).to.revertedWith("INSUFFICIENT_PAYMENT_AMOUNT");

      await expect(
        reader.getAttributesETH(minterA.address, TOKEN_ID, ATTRIBUTE_DID, {
          value: parseEther("0"),
        })
      ).to.revertedWith("INSUFFICIENT_PAYMENT_AMOUNT");
    });

    it("fail - getAttributesETH from address(0)", async () => {
      await expect(
        reader.getAttributesETH(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_DID,
          { value: getDIDPrice }
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it("fail - getAttributesETH ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesETH(minterA.address, wrongTokenId, ATTRIBUTE_DID, {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - getAttributesETH ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesETH(minterA.address, TOKEN_ID, ATTRIBUTE_AML, {
          value: parseEther("0"),
        })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it("fail - getAttributesETH ineligible attribute (Country)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, false);
      await expect(
        reader.getAttributesETH(minterA.address, TOKEN_ID, ATTRIBUTE_COUNTRY,{
          value: parseEther("0"),
        })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });
  });

});
