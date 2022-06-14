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
import { assertGetAttributeETHExcluding, assertGetAttributeETHIncluding, assertGetAttributeETHWrapper, assertGetAttributeExcluding, assertGetAttributeFreeIncluding, assertGetAttributeFreeWrapper, assertGetAttributeIncluding, assertGetAttributeWrapper, assertMint } from "../utils/verify";
import exp from "constants";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  TOKEN_ID,
  MINT_PRICE,
  PRICE_PER_ATTRIBUTES,
  DEACTIVATED
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
    it.skip("success - exclude 1 issuer", async  () => {
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

    it.skip("success - deactivate all issuers - exclude 1", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);
      await governance.connect(admin).setIssuer(signers[2].address, signers[2].address);
      expect(await governance.getIssuersLength()).to.equal(4);
      await assertMint(minterA, signers[0], signers[0], passport, id("MINTER_A_ALPHA"), id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, id("MINTER_A_BRAVO"), id("MEDIUM"), id("US"), id("FALSE"), 12, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[2], signers[2], passport, id("MINTER_A_CHARLIE"), id("LOW"), id("US"), id("FALSE"), 10, 1, {newIssuerMint: true});
      await governance.connect(admin).setIssuerStatus(signers[0].address, DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(signers[1].address, DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(signers[2].address, DEACTIVATED);

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

    it.skip("success - deactivate all but 1 issuer - exclude 0", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);
      await governance.connect(admin).setIssuer(signers[2].address, signers[2].address);
      expect(await governance.getIssuersLength()).to.equal(4);
      await assertMint(minterA, signers[0], signers[0], passport, id("MINTER_A_ALPHA"), id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[1], signers[1], passport, id("MINTER_A_BRAVO"), id("MEDIUM"), id("US"), id("FALSE"), 12, 1, {newIssuerMint: true});
      await assertMint(minterA, signers[2], signers[2], passport, id("MINTER_A_CHARLIE"), id("LOW"), id("US"), id("FALSE"), 10, 1, {newIssuerMint: true});
      await governance.connect(admin).setIssuerStatus(signers[0].address, DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(signers[1].address, DEACTIVATED);
      await governance.connect(admin).setIssuerStatus(signers[2].address, DEACTIVATED);

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

    it.skip("success - exclude 3 issuers", async  () => {
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

    it.skip("success - exclude 0 issuers", async  () => {
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

    it.skip("success - exclude all 4 issuers", async  () => {
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

    it.skip("fail - getAttributesFreeExcluding(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesFreeExcluding(wallet.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - getAttributesFreeExcluding from address(0)", async () => {
      await expect(
        reader.getAttributesFreeExcluding(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_AML,
          [issuer.address]
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it.skip("fail - getAttributesFreeExcluding ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesFreeExcluding(minterA.address, wrongTokenId, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it.skip("fail - getAttributesFreeExcluding ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesFreeExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it.skip("fail - attribute not free", async () => {
      await expect(
        reader.getAttributesFreeExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_DID, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_FREE");
    });
  })

  describe("getAttributeFreeIncluding", async() => {
    it.skip("success - Include 2 issuers (1 supported, 1 not supported)", async  () => {
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

    it.skip("success - Include 2 issuers (2 not supported)", async  () => {
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

    it.skip("success - Include 2 issuers (2 previously supported)", async  () => {
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


    it.skip("fail - getAttributesFreeExcluding(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesFreeExcluding(wallet.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - getAttributesFreeExcluding from address(0)", async () => {
      await expect(
        reader.getAttributesFreeExcluding(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_AML,
          [issuer.address]
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it.skip("fail - getAttributesFreeIncludingOnly ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesFreeIncludingOnly(minterA.address, wrongTokenId, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it.skip("fail - getAttributesFreeIncludingOnly ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesFreeIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it.skip("fail - attribute not free", async () => {
      await expect(
        reader.getAttributesFreeIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_DID, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_FREE");
    });
  });

  describe("getAttributesExcluding", async function() {
    it.skip('success - (1 excluded, 1 included) - DID', async () => {
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

    it.skip('success - (1 excluded, 2 included) - COUNTRY', async () => {
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


    it.skip('success - (0 excluded, 3 included) - AML', async () => {
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

    it.skip('success - (exclude random address)', async () => {
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
    it.skip("fail - getAttributesExcluding(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesExcluding(wallet.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address, [wallet.address])
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - getAttributesExcluding from address(0)", async () => {
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

    it.skip("fail - getAttributesExcluding ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesExcluding(minterA.address, wrongTokenId, ATTRIBUTE_AML, usdc.address, [issuer.address])
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it.skip("fail - getAttributesExcluding ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it.skip("fail - attribute not free", async () => {
      await expect(
        reader.getAttributesExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_DID,usdc.address, [])
      ).to.revertedWith("ERC20: insufficient allowance");
    });
  });

  describe("getAttributesIncluding", async() => {
    it.skip('success - (1 included) - DID', async () => {
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

    it.skip('success - (include random address) - DID', async () => {
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

    it.skip('success - (2 included) - AML', async () => {
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
    it.skip("fail - getAttributesIncludingOnly(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesIncludingOnly(wallet.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address, [wallet.address])
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - getAttributesIncludingOnly from address(0)", async () => {
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

    it.skip("fail - getAttributesIncludingOnly ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesIncludingOnly(minterA.address, wrongTokenId, ATTRIBUTE_AML, usdc.address, [issuer.address])
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it.skip("fail - getAttributesIncludingOnly ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address, [issuer.address])
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it.skip("fail - attribute not free", async () => {
      await expect(
        reader.getAttributesIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_DID,usdc.address, [issuer.address])
      ).to.revertedWith("ERC20: insufficient allowance");
    });
  });

  describe("getAttributeETHExcluding", async () => {
    const getDIDPrice = parseEther(
      (PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
    );

    it.skip("success - (1 excluded, 1 included)", async() => {
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

    it.skip("success - (0 excluded, 2 included)", async() => {
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

    it.skip("fail - getAttributesETHExcluding(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();

      await expect(
        reader.getAttributesETHExcluding(wallet.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - getAttributesETHExcluding(DID) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesETHExcluding(wallet.address, TOKEN_ID, ATTRIBUTE_DID, [issuer.address], {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - insufficient eth amount", async () => {
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

    it.skip("fail - getAttributesETHExcluding from address(0)", async () => {
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

    it.skip("fail - getAttributesETHExcluding ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesETHExcluding(minterA.address, wrongTokenId, ATTRIBUTE_DID, [issuer.address], {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it.skip("fail - getAttributesETHExcluding ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesETHExcluding(minterA.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it.skip("fail - getAttributesETHExcluding ineligible attribute (Country)", async () => {
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

    it.skip("success - (1 excluded, 1 included)", async() => {
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

    it.skip("success - (0 excluded, 2 included)", async() => {
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

    it.skip("fail - getAttributesETHIncludingOnly(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();

      await expect(
        reader.getAttributesETHIncludingOnly(wallet.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - getAttributesETHIncludingOnly(DID) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesETHIncludingOnly(wallet.address, TOKEN_ID, ATTRIBUTE_DID, [issuer.address], {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - insufficient eth amount", async () => {
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

    it.skip("fail - getAttributesETHIncludingOnly from address(0)", async () => {
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

    it.skip("fail - getAttributesETHIncludingOnly ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesETHIncludingOnly(minterA.address, wrongTokenId, ATTRIBUTE_DID, [issuer.address], {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it.skip("fail - getAttributesETHIncludingOnly ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesETHIncludingOnly(minterA.address, TOKEN_ID, ATTRIBUTE_AML, [issuer.address], {
          value: parseEther("0"),
        })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it.skip("fail - getAttributesETHIncludingOnly ineligible attribute (Country)", async () => {
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
    it.skip('success - (all included) - DID', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(2);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(2);

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

    it.skip('success - (all included) - COUNTRY', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);

      expect(await governance.getIssuersLength()).to.equal(3);

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


    it.skip('success - (all included) - AML', async () => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);

      expect(await governance.getIssuersLength()).to.equal(3);

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

    it.skip("fail - getAttributes(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributes(wallet.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address)
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - getAttributes from address(0)", async () => {
      await expect(
        reader.getAttributes(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_AML,
          usdc.address,
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it.skip("fail - getAttributes ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributes(minterA.address, wrongTokenId, ATTRIBUTE_AML, usdc.address)
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it.skip("fail - getAttributes ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributes(minterA.address, TOKEN_ID, ATTRIBUTE_AML, usdc.address)
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it.skip("fail - attribute not free", async () => {
      await expect(
        reader.getAttributes(minterA.address, TOKEN_ID, ATTRIBUTE_DID,usdc.address)
      ).to.revertedWith("ERC20: insufficient allowance");
    });
  });
  describe("getAttributeFree", async() => {
    it.skip("success - (all issuers)", async  () => {
      const signers = await ethers.getSigners()
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      await governance.connect(admin).setIssuer(signers[1].address, signers[1].address);
      await governance.connect(admin).setIssuer(signers[2].address, signers[2].address);
      expect(await governance.getIssuersLength()).to.equal(4);
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


    it.skip("fail - getAttributesFree(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesFree(wallet.address, TOKEN_ID, ATTRIBUTE_AML)
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - getAttributesFree from address(0)", async () => {
      await expect(
        reader.getAttributesFree(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_AML
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it.skip("fail - getAttributesFree ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesFree(minterA.address, wrongTokenId, ATTRIBUTE_AML)
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it.skip("fail - getAttributesFree ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesFree(minterA.address, TOKEN_ID, ATTRIBUTE_AML)
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it.skip("fail - attribute not free", async () => {
      await expect(
        reader.getAttributesFree(minterA.address, TOKEN_ID, ATTRIBUTE_DID)
      ).to.revertedWith("ATTRIBUTE_NOT_FREE");
    });
  })

  describe("getAttributeETH", async () => {
    const getDIDPrice = parseEther(
      (PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID] / 4000).toString()
    );

    it.skip("success - (all included)", async() => {
      const signers = await ethers.getSigners();
      await governance.connect(admin).setIssuer(signers[0].address, signers[0].address);
      expect(await governance.getIssuersLength()).to.equal(2);
      await assertMint(minterA, signers[0], signers[0], passport, did, id("LOW"), id("US"), id("FALSE"), 15, 1, {newIssuerMint: true});

      expect(await governance.getIssuersLength()).to.equal(2);

      await assertGetAttributeETHWrapper(
        minterA,
        defi,
        passport,
        ATTRIBUTE_DID,
        [did, did],
        [BigNumber.from(issuedAt), BigNumber.from(15)]
      )
    });


    it.skip("fail - getAttributesETH(AML) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();

      await expect(
        reader.getAttributesETH(wallet.address, TOKEN_ID, ATTRIBUTE_AML, {
          value: parseEther("0"),
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - getAttributesETH(DID) - wallet not found", async () => {
      const wallet = ethers.Wallet.createRandom();
      await expect(
        reader.getAttributesETH(wallet.address, TOKEN_ID, ATTRIBUTE_DID, {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_DOES_NOT_EXIST");
    });

    it.skip("fail - insufficient eth amount", async () => {
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

    it.skip("fail - getAttributesETH from address(0)", async () => {
      await expect(
        reader.getAttributesETH(
          ethers.constants.AddressZero,
          TOKEN_ID,
          ATTRIBUTE_DID,
          { value: getDIDPrice }
        )
      ).to.revertedWith("ACCOUNT_ADDRESS_ZERO");
    });

    it.skip("fail - getAttributesETH ineligible Token Id", async () => {
      const wrongTokenId = 2;
      await expect(
        reader.getAttributesETH(minterA.address, wrongTokenId, ATTRIBUTE_DID, {
          value: getDIDPrice,
        })
      ).to.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it.skip("fail - getAttributesETH ineligible attribute (AML)", async () => {
      await governance
        .connect(admin)
        .setEligibleAttributeByDID(ATTRIBUTE_AML, false);
      await expect(
        reader.getAttributesETH(minterA.address, TOKEN_ID, ATTRIBUTE_AML, {
          value: parseEther("0"),
        })
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });

    it.skip("fail - getAttributesETH ineligible attribute (Country)", async () => {
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
