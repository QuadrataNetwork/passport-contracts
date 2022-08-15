// import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { formatBytes32String, id } from "ethers/lib/utils";

const {
  MINT_PRICE,
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_COUNTRY,
  READER_ROLE,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");
const { assertSetAttribute } = require("../helpers/asserts.ts");

describe("QuadPassport.setAttributes", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let defi: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuer2: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerTreasury2: SignerWithAddress,
    mockReader: SignerWithAddress;

  let issuedAt: number;
  const attributes: any = {
    [ATTRIBUTE_DID]: formatBytes32String("did:quad:123456789abcdefghi"),
    [ATTRIBUTE_AML]: formatBytes32String("1"),
    [ATTRIBUTE_COUNTRY]: id("FRANCE"),
    [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
  };

  beforeEach(async () => {
    [
      deployer,
      admin,
      minterA,
      minterB,
      issuer,
      issuer2,
      treasury,
      issuerTreasury,
      issuerTreasury2,
      mockReader,
    ] = await ethers.getSigners();
    [governance, passport, reader, defi] = await deployPassportEcosystem(
      admin,
      [issuer, issuer2],
      treasury,
      [issuerTreasury, issuerTreasury2]
    );

    issuedAt = Math.floor(new Date().getTime() / 1000) - 100;

    await governance.connect(admin).grantRole(READER_ROLE, mockReader.address);
  });

  describe("QuadPassport.setAttributes (success)", async () => {
    beforeEach(async () => {});

    it("setAttributes (Single Attribute)", async () => {
      const attributes: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        issuedAt,
        MINT_PRICE
      );
      await assertSetAttribute(
        minterA,
        [issuer],
        passport,
        [attributes],
        [issuedAt],
        [MINT_PRICE],
        mockReader
      );
    });

    it("setAttributes (Multiple Attribute)", async () => {
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        issuedAt,
        MINT_PRICE
      );

      await assertSetAttribute(
        minterA,
        [issuer],
        passport,
        [attributes],
        [issuedAt],
        [MINT_PRICE],
        mockReader
      );
    });

    it("setAttributes (Multiple Issuers)", async () => {
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        issuedAt,
        MINT_PRICE
      );

      const attributeByIssuer2 = {
        [ATTRIBUTE_DID]: formatBytes32String("did:quad:123456789abcdefghi"),
        [ATTRIBUTE_AML]: formatBytes32String("9"),
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributeByIssuer2,
        issuedAt + 1,
        MINT_PRICE.add(1)
      );
      await assertSetAttribute(
        minterA,
        [issuer, issuer2],
        passport,
        [attributes, attributeByIssuer2],
        [issuedAt, issuedAt + 1],
        [MINT_PRICE, MINT_PRICE.add(1)],
        mockReader
      );

      console.log("issuer 1: ", issuer.address);
      console.log("issuer 2: ", issuer2.address);
    });

    // it("success - mint with default values 0x00....000 ie bytes32(0) for aml", async () => {
    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     hexZeroPad("0x00", 32),
    //     hexZeroPad("0x00", 32),
    //     hexZeroPad("0x00", 32),
    //     hexZeroPad("0x00", 32),
    //     issuedAt
    //   );

    //   await assertGetAttributeFreeExcluding(
    //     [],
    //     minterA,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_AML,
    //     [],
    //     [],
    //     1,
    //     {}
    //   );
    // });

    // it("success - mint multiple passports with same DID", async () => {
    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   await assertMint(
    //     minterB,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   for (const wallet of [minterA, minterB]) {
    //     await assertGetAttributeFree(
    //       [issuer.address],
    //       wallet,
    //       defi,
    //       passport,
    //       reader,
    //       ATTRIBUTE_AML,
    //       aml,
    //       issuedAt
    //     );
    //     await assertGetAttribute(
    //       wallet,
    //       treasury,
    //       issuer,
    //       issuerTreasury,
    //       usdc,
    //       defi,
    //       passport,
    //       reader,
    //       ATTRIBUTE_COUNTRY,
    //       country,
    //       issuedAt
    //     );
    //     await assertGetAttribute(
    //       wallet,
    //       treasury,
    //       issuer,
    //       issuerTreasury,
    //       usdc,
    //       defi,
    //       passport,
    //       reader,
    //       ATTRIBUTE_DID,
    //       did,
    //       issuedAt
    //     );
    //   }
    // });

    // it("success - two issuers may mint multiple passports with same DID", async () => {
    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   await passport.connect(issuer).withdraw(issuerTreasury.address);

    //   await assertMint(
    //     minterB,
    //     issuerB,
    //     issuerBTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   await passport.connect(issuerB).withdraw(issuerBTreasury.address);

    //   await assertGetAttributeFree(
    //     [issuer.address],
    //     minterA,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_AML,
    //     aml,
    //     issuedAt
    //   );

    //   await assertGetAttributeFree(
    //     [issuerB.address],
    //     minterB,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_AML,
    //     aml,
    //     issuedAt
    //   );

    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_COUNTRY,
    //     country,
    //     issuedAt
    //   );

    //   await assertGetAttribute(
    //     minterB,
    //     treasury,
    //     issuerB,
    //     issuerBTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_COUNTRY,
    //     country,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_DID,
    //     did,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterB,
    //     treasury,
    //     issuerB,
    //     issuerBTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_DID,
    //     did,
    //     issuedAt
    //   );
    // });

    // it("success mint -- two issuers mint same args for account", async () => {
    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   await assertMint(
    //     minterA,
    //     issuerB,
    //     issuerBTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt,
    //     1,
    //     { newIssuerMint: true }
    //   );

    //   const expectedDIDs = [did, did];
    //   const expectedAMLs = [aml, aml];
    //   const expectedCOUNTRYs = [country, country];
    //   const expectedIssuedAts = [
    //     BigNumber.from(issuedAt),
    //     BigNumber.from(issuedAt),
    //   ];
    //   const expectedIsBusinesses = [isBusiness, isBusiness];

    //   await assertGetAttributeFixedWrapper(
    //     minterA,
    //     defi,
    //     passport,
    //     ATTRIBUTE_DID,
    //     expectedDIDs,
    //     expectedIssuedAts
    //   );

    //   await assertGetAttributeFreeWrapper(
    //     minterA,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_AML,
    //     expectedAMLs,
    //     expectedIssuedAts,
    //     1,
    //     {}
    //   );
    //   await assertGetAttributeFixedWrapper(
    //     minterA,
    //     defi,
    //     passport,
    //     ATTRIBUTE_COUNTRY,
    //     expectedCOUNTRYs,
    //     expectedIssuedAts
    //   );
    //   await assertGetAttributeFixedWrapper(
    //     minterA,
    //     defi,
    //     passport,
    //     ATTRIBUTE_IS_BUSINESS,
    //     expectedIsBusinesses,
    //     expectedIssuedAts
    //   );
    // });

    // it("success mint -- two issuers mint different args for account", async () => {
    //   const expectedDIDs = [id("Mr. T"), id("Prof. Aaron")];
    //   const expectedAMLs = [aml, aml];
    //   const expectedCOUNTRYs = [id("KR"), id("SR")];
    //   const expectedIssuedAts = [BigNumber.from(1999), BigNumber.from(1890)];
    //   const expectedIsBusinesses = [id("TRUE"), isBusiness];

    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     expectedDIDs[0],
    //     expectedAMLs[0],
    //     expectedCOUNTRYs[0],
    //     expectedIsBusinesses[0],
    //     expectedIssuedAts[0]
    //   );
    //   await assertMint(
    //     minterA,
    //     issuerB,
    //     issuerBTreasury,
    //     passport,
    //     expectedDIDs[1],
    //     expectedAMLs[1],
    //     expectedCOUNTRYs[1],
    //     expectedIsBusinesses[1],
    //     expectedIssuedAts[1],
    //     1,
    //     { newIssuerMint: true }
    //   );

    //   await assertGetAttributeFixedWrapper(
    //     minterA,
    //     defi,
    //     passport,
    //     ATTRIBUTE_DID,
    //     expectedDIDs,
    //     expectedIssuedAts
    //   );

    //   await assertGetAttributeFreeWrapper(
    //     minterA,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_AML,
    //     expectedAMLs,
    //     expectedIssuedAts,
    //     1,
    //     {}
    //   );

    //   await assertGetAttributeFixedWrapper(
    //     minterA,
    //     defi,
    //     passport,
    //     ATTRIBUTE_COUNTRY,
    //     expectedCOUNTRYs,
    //     expectedIssuedAts
    //   );

    //   await assertGetAttributeFixedWrapper(
    //     minterA,
    //     defi,
    //     passport,
    //     ATTRIBUTE_IS_BUSINESS,
    //     expectedIsBusinesses,
    //     expectedIssuedAts
    //   );
    // });

    // it("success mint -- EOA that is a business", async () => {
    //   await assertMint(
    //     minterB,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     id("TRUE"),
    //     issuedAt
    //   );
    //   await assertGetAttributeFree(
    //     [issuer.address],
    //     minterB,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_AML,
    //     aml,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterB,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_COUNTRY,
    //     country,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterB,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_DID,
    //     did,
    //     issuedAt
    //   );
    // });

    // it("success - mint with mint price (0)", async () => {
    //   await governance.connect(admin).setMintPrice(0);
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   const sigAccount = await signMessage(minterA, minterA.address);

    //   await passport
    //     .connect(minterA)
    //     .mintPassport(
    //       [minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt],
    //       sig,
    //       sigAccount,
    //       {
    //         value: parseEther("0"),
    //       }
    //     );
    //   expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
    //   expect(await passport.provider.getBalance(passport.address)).to.equal(0);
    //   await expect(
    //     passport.withdraw(issuerTreasury.address)
    //   ).to.be.revertedWith("NOT_ENOUGH_BALANCE");
    // });

    // it("success - aml (high)", async () => {
    //   aml = id("HIGH");
    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   await assertGetAttributeFree(
    //     [issuer.address],
    //     minterA,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_AML,
    //     aml,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_COUNTRY,
    //     country,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_DID,
    //     did,
    //     issuedAt
    //   );
    // });

    // it("success - same wallet, different tokenIds", async () => {
    //   const newTokenId = 2;
    //   await governance.connect(admin).setEligibleTokenId(newTokenId, true);

    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt,
    //     newTokenId
    //   );
    //   for (const tokenId of [TOKEN_ID, newTokenId]) {
    //     await assertGetAttributeFree(
    //       [issuer.address],
    //       minterA,
    //       defi,
    //       passport,
    //       reader,
    //       ATTRIBUTE_AML,
    //       aml,
    //       issuedAt,
    //       tokenId
    //     );
    //     await assertGetAttribute(
    //       minterA,
    //       treasury,
    //       issuer,
    //       issuerTreasury,
    //       usdc,
    //       defi,
    //       passport,
    //       reader,
    //       ATTRIBUTE_COUNTRY,
    //       country,
    //       issuedAt,
    //       tokenId
    //     );

    //     await assertGetAttribute(
    //       minterA,
    //       treasury,
    //       issuer,
    //       issuerTreasury,
    //       usdc,
    //       defi,
    //       passport,
    //       reader,
    //       ATTRIBUTE_DID,
    //       did,
    //       issuedAt,
    //       tokenId
    //     );
    //   }
    // });

    // it("fail - mint the same passport using the exact same arguments", async () => {
    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         "0x00",
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("SIGNATURE_ALREADY_USED");

    //   await assertGetAttributeFree(
    //     [issuer.address],
    //     minterA,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_AML,
    //     aml,
    //     issuedAt,
    //     1
    //   );
    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_COUNTRY,
    //     country,
    //     issuedAt,
    //     1
    //   );

    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_DID,
    //     did,
    //     issuedAt,
    //     1
    //   );
    // });

    // it("success - change of issuer treasury", async () => {
    //   const newIssuerTreasury = ethers.Wallet.createRandom();
    //   await governance
    //     .connect(admin)
    //     .setIssuer(issuer.address, newIssuerTreasury.address);

    //   await assertMint(
    //     minterA,
    //     issuer,
    //     newIssuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   await assertGetAttributeFree(
    //     [issuer.address],
    //     minterA,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_AML,
    //     aml,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     newIssuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_COUNTRY,
    //     country,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     newIssuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_DID,
    //     did,
    //     issuedAt
    //   );
    //   await expect(passport.withdraw(issuerTreasury.address)).to.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    // });

    // it("fail - mint then transfer", async () => {
    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   await assertGetAttributeFree(
    //     [issuer.address],
    //     minterA,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_AML,
    //     aml,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_COUNTRY,
    //     country,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_DID,
    //     did,
    //     issuedAt
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(1);
    //   const txPromise = passport
    //     .connect(minterA)
    //     .safeTransferFrom(minterA.address, minterB.address, 1, 1, "0x00");
    //   await expect(txPromise).to.be.revertedWith("ONLY_MINT_OR_BURN_ALLOWED");
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(1);
    // });

    // it("fail - mint then do batch transfer", async () => {
    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   await assertGetAttributeFree(
    //     [issuer.address],
    //     minterA,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_AML,
    //     aml,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_COUNTRY,
    //     country,
    //     issuedAt
    //   );
    //   await assertGetAttribute(
    //     minterA,
    //     treasury,
    //     issuer,
    //     issuerTreasury,
    //     usdc,
    //     defi,
    //     passport,
    //     reader,
    //     ATTRIBUTE_DID,
    //     did,
    //     issuedAt
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(1);
    //   const txPromise = passport
    //     .connect(minterA)
    //     .safeBatchTransferFrom(
    //       minterA.address,
    //       minterB.address,
    //       [1],
    //       [1],
    //       "0x00"
    //     );
    //   await expect(txPromise).to.be.revertedWith("ONLY_MINT_OR_BURN_ALLOWED");
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(1);
    // });

    // it("fail - invalid mint Price", async () => {
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    //   const sigAccount = await signMessage(minterA, minterA.address);
    //   const wrongMintPrice = parseEther("1");

    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: wrongMintPrice,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_MINT_PRICE");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    // });

    // it("fail - passing 0 wei for mint", async () => {
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         "0x00",
    //         {
    //           value: 0,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_MINT_PRICE");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    // });

    // it("fail - invalid tokenId", async () => {
    //   const badTokenId = 1337;
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     badTokenId,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   const sigAccount = await signMessage(minterA, minterA.address);
    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           badTokenId,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("PASSPORT_TOKENID_INVALID");
    // });

    // it("fail - zero account", async () => {
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   const sigAccount = await signMessage(minterA, minterA.address);
    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           "0x0000000000000000000000000000000000000000",
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("ACCOUNT_CANNOT_BE_ZERO");
    // });

    // it("fail - zero issuedAt", async () => {
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     0
    //   );
    //   const sigAccount = await signMessage(minterA, minterA.address);
    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [minterA.address, TOKEN_ID, did, aml, country, isBusiness, 0],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("ISSUED_AT_CANNOT_BE_ZERO");
    // });

    // it("fail - future issuedAt", async () => {
    //   const blockNumAfter = await ethers.provider.getBlockNumber();
    //   const blockAfter = await ethers.provider.getBlock(blockNumAfter);

    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     blockAfter.timestamp + 100
    //   );
    //   const sigAccount = await signMessage(minterA, minterA.address);
    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           blockAfter.timestamp + 100,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_ISSUED_AT");
    // });

    // it("fail - passport already exists", async () => {
    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   const sigAccount = await signMessage(minterA, minterA.address);

    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("SIGNATURE_ALREADY_USED");
    // });

    // it("success - passport already exists - two diff issuers", async () => {
    //   const issuerB = ethers.Wallet.createRandom();
    //   const issuerBTreasury = ethers.Wallet.createRandom();
    //   await governance
    //     .connect(admin)
    //     .setIssuer(issuerB.address, issuerBTreasury.address);

    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const sig = await signMint(
    //     issuerB,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const sigAccount = await signMessage(minterA, minterA.address);

    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.not.be.reverted;
    // });

    // it("fail - invalid hash (wrong DID)", async () => {
    //   const wrongDID = id("Ceaser");
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    //   const sigAccount = await signMessage(minterA, minterA.address);
    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           wrongDID,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_ISSUER");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    // });

    // it("fail - invalid hash (wrong aml), invalid sigAccount", async () => {
    //   const wrongAML = id("HIGH");
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    //   const sigAccount = await signMessage(issuer, minterA.address);
    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           wrongAML,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_ISSUER");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    // });

    // it("fail - invalid hash (wrong country)", async () => {
    //   const wrongCountry = id("RU");
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    //   const sigAccount = await signMessage(minterA, minterA.address);
    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           wrongCountry,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_ISSUER");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    // });

    // it("fail - invalid hash (wrong isBusiness)", async () => {
    //   const wrongIsBusiness = id("MAYBE");
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           wrongIsBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         "0x00",
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_ISSUER");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    // });

    // it("fail - invalid hash (issuedAt)", async () => {
    //   const wrongIssuedAt = Math.floor(new Date().getTime() / 1000) + 1;
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    //   const sigAccount = await signMessage(minterA, minterA.address);
    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           wrongIssuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_ISSUER");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    // });

    // it("fail - invalid hash (wrong TokenId)", async () => {
    //   const wrongTokenId = 1337;
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     wrongTokenId,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    //   const sigAccount = await signMessage(issuer, minterA.address);

    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_ISSUER");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    // });

    // it("fail - using someone else signature", async () => {
    //   await assertMint(
    //     minterA,
    //     issuer,
    //     issuerTreasury,
    //     passport,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );
    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterB.address, 1)).equals(0);

    //   const sigAccount = await signMessage(minterA, minterA.address);

    //   await expect(
    //     passport
    //       .connect(minterB)
    //       .mintPassport(
    //         [
    //           minterB.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_ISSUER");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterB.address, 1)).equals(0);
    // });

    // it("fail - using sig from a non-issuer", async () => {
    //   const nonIssuer = Wallet.createRandom();

    //   const sig = await signMint(
    //     nonIssuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         "0x00",
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_ISSUER");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    // });

    // it("fail - invalid issuer", async () => {
    //   const invalidSigner = ethers.Wallet.createRandom();
    //   const sig = await signMint(
    //     invalidSigner,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(invalidSigner.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    //   const sigAccount = await signMessage(invalidSigner, minterA.address);

    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         sigAccount,
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_ISSUER");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(invalidSigner.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    // });

    // it("fail - invalid account", async () => {
    //   const sig = await signMint(
    //     issuer,
    //     minterB,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);

    //   await expect(
    //     passport
    //       .connect(minterA)
    //       .mintPassport(
    //         [
    //           minterA.address,
    //           TOKEN_ID,
    //           did,
    //           aml,
    //           country,
    //           isBusiness,
    //           issuedAt,
    //         ],
    //         sig,
    //         "0x00",
    //         {
    //           value: MINT_PRICE,
    //         }
    //       )
    //   ).to.be.revertedWith("INVALID_ISSUER");

    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    // });
    // });

    // describe("KYB", async () => {
    // it("fail - contracts cannot pose and mint as individuals even when their code length is 0", async () => {
    //   const nonce = await ethers.provider.getTransactionCount(attacker.address);

    //   const nextAddress = utils.getContractAddress({
    //     from: attacker.address,
    //     nonce: nonce,
    //   });

    //   const sig = await signMint(
    //     issuer,
    //     { address: nextAddress },
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   var accountSig = "0x00"; // isBusiness is false so this should trigger ECDSA length error

    //   // attempt being a non-business EOA
    //   const BadMinter = await ethers.getContractFactory("BadMinter");
    //   var badMinterPromise = BadMinter.deploy(
    //     passport.address,
    //     [nextAddress, TOKEN_ID, did, aml, country, isBusiness, issuedAt],
    //     sig,
    //     accountSig,
    //     {
    //       value: MINT_PRICE,
    //     }
    //   );
    //   await expect(badMinterPromise).to.be.revertedWith(
    //     "ECDSA: invalid signature length"
    //   );

    //   accountSig = await signMessage(attacker, nextAddress); // isBusiness is false so this should trigger INVALID_ACCOUNT
    //   badMinterPromise = BadMinter.deploy(
    //     passport.address,
    //     [nextAddress, TOKEN_ID, did, aml, country, isBusiness, issuedAt],
    //     sig,
    //     accountSig,
    //     {
    //       value: MINT_PRICE,
    //     }
    //   );
    //   await expect(badMinterPromise).to.be.revertedWith("INVALID_ACCOUNT");
    // });

    // it("fail - mint passport to contract while not a business", async () => {
    //   const DeFi = await ethers.getContractFactory("DeFi");
    //   const defi = await DeFi.deploy(passport.address, reader.address);
    //   await defi.deployed();

    //   const sig = await signMint(
    //     issuer,
    //     mockBusiness,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const sigAccount = await signMessage(minterA, mockBusiness.address);

    //   expect(await passport.balanceOf(mockBusiness.address, 1)).equals(0);
    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   const promise = passport
    //     .connect(minterA)
    //     .mintPassport(
    //       [
    //         mockBusiness.address,
    //         TOKEN_ID,
    //         did,
    //         aml,
    //         country,
    //         isBusiness,
    //         issuedAt,
    //       ],
    //       sig,
    //       sigAccount,
    //       {
    //         value: MINT_PRICE,
    //       }
    //     );

    //   await expect(promise).to.be.revertedWith("INVALID_ACCOUNT");
    //   expect(await passport.balanceOf(mockBusiness.address, 1)).equals(0);
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(passport.withdraw(issuer.address)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    // });
    // it("fail - mint passport to contract with account forging contract sig while not a business", async () => {
    //   const DeFi = await ethers.getContractFactory("DeFi");
    //   const defi = await DeFi.deploy(passport.address, reader.address);
    //   await defi.deployed();

    //   const sig = await signMint(
    //     issuer,
    //     mockBusiness,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     isBusiness,
    //     issuedAt
    //   );

    //   const sigAccount = await signMessage(minterA, minterA.address);

    //   const promise = passport
    //     .connect(minterA)
    //     .mintPassport(
    //       [
    //         mockBusiness.address,
    //         TOKEN_ID,
    //         did,
    //         aml,
    //         country,
    //         isBusiness,
    //         issuedAt,
    //       ],
    //       sig,
    //       sigAccount,
    //       {
    //         value: MINT_PRICE,
    //       }
    //     );

    //   await expect(promise).to.be.revertedWith("INVALID_ACCOUNT");
    // });
    // it("success - mint a business passport for a smart contract owned account", async () => {
    //   const newIsBusiness = id("TRUE");

    //   const DeFi = await ethers.getContractFactory("DeFi");
    //   const defi = await DeFi.deploy(passport.address, reader.address);
    //   await defi.deployed();

    //   const sig = await signMint(
    //     issuer,
    //     mockBusiness,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     newIsBusiness,
    //     issuedAt
    //   );
    //   expect(await passport.balanceOf(mockBusiness.address, 1)).equals(0);
    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(
    //     passport.withdraw(issuerTreasury.address)
    //   ).to.be.revertedWith("NOT_ENOUGH_BALANCE");

    //   const promise = passport
    //     .connect(minterA)
    //     .mintPassport(
    //       [
    //         mockBusiness.address,
    //         TOKEN_ID,
    //         did,
    //         aml,
    //         country,
    //         newIsBusiness,
    //         issuedAt,
    //       ],
    //       sig,
    //       "0x00",
    //       {
    //         value: MINT_PRICE,
    //       }
    //     );

    //   await promise;
    //   expect(await passport.balanceOf(mockBusiness.address, 1)).equals(1);
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   const response = await passport.callStatic.withdraw(
    //     issuerTreasury.address
    //   );
    //   expect(response).to.equals(MINT_PRICE);
    // });

    // it("success - mint a business passport for an EAO", async () => {
    //   const newIsBusiness = id("TRUE");

    //   const sig = await signMint(
    //     issuer,
    //     minterA,
    //     TOKEN_ID,
    //     did,
    //     aml,
    //     country,
    //     newIsBusiness,
    //     issuedAt
    //   );

    //   const sigAccount = await signMessage(minterA, minterA.address);

    //   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
    //   const protocolTreasury = (await governance.config()).treasury;
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   await expect(
    //     passport.withdraw(issuerTreasury.address)
    //   ).to.not.be.revertedWith("NOT_ENOUGH_BALANCE");

    //   const promise = passport
    //     .connect(minterA)
    //     .mintPassport(
    //       [
    //         minterA.address,
    //         TOKEN_ID,
    //         did,
    //         aml,
    //         country,
    //         newIsBusiness,
    //         issuedAt,
    //       ],
    //       sig,
    //       sigAccount,
    //       {
    //         value: MINT_PRICE,
    //       }
    //     );

    //   await promise;
    //   expect(await passport.balanceOf(mockBusiness.address, 1)).equals(1);
    //   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
    //     "NOT_ENOUGH_BALANCE"
    //   );
    //   const response = await passport.callStatic.withdraw(
    //     issuerTreasury.address
    //   );
    //   expect(response).to.equals(MINT_PRICE);
    // });
  });
});
