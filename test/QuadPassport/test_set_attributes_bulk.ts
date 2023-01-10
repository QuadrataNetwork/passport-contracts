import { expect } from "chai";
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
  TOKEN_ID,
  HARDHAT_CHAIN_ID,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { signSetAttributes, signAccount } = require("../helpers/signature.ts");

const { setAttributesBulk } = require("../helpers/set_attributes_bulk.ts");
const {
  assertSetAttribute,
} = require("../helpers/assert/assert_set_attributes.ts");

const {
  assertGetAttributes,
} = require("../helpers/assert/assert_get_attributes.ts");

describe("QuadPassport.setAttributes", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let defi: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
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

  let issuedAt: number, verifiedAt: number;
  const attributes: any = {
    [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
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
    verifiedAt = Math.floor(new Date().getTime() / 1000) - 100;

    await governance.connect(admin).grantRole(READER_ROLE, mockReader.address);
  });

  describe("QuadPassport.setAttributes (success)", async () => {
    beforeEach(async () => {});

    it("setAttributesBulk (Single Attribute)", async () => {
      const attributes1: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributesBulk(
        passport,
        minterA,
        [issuer],
        [attributes1],
        [verifiedAt],
        [issuedAt],
        [MINT_PRICE],
        [TOKEN_ID],
        [HARDHAT_CHAIN_ID]
      );
      await assertSetAttribute(
        minterA,
        [issuer],
        passport,
        [attributes1],
        [verifiedAt],
        [MINT_PRICE],
        mockReader
      );
    });

    it("setAttributesBulk (Multiple Attributes, Diff Issuers - same dataset)", async () => {
      await setAttributesBulk(
        passport,
        minterA,
        [issuer, issuer2],
        [attributes, attributes],
        [verifiedAt, verifiedAt],
        [issuedAt, issuedAt],
        [MINT_PRICE, MINT_PRICE],
        [TOKEN_ID, TOKEN_ID],
        [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID]
      );

      await assertSetAttribute(
        minterA,
        [issuer, issuer2],
        passport,
        [attributes, attributes],
        [verifiedAt, verifiedAt],
        [MINT_PRICE, MINT_PRICE],
        mockReader
      );
    });

    it("setAttributesBulk (Multiple Attributes, Diff Issuers - same dataset, free mint)", async () => {
      await setAttributesBulk(
        passport,
        minterA,
        [issuer, issuer2],
        [attributes, attributes],
        [verifiedAt, verifiedAt],
        [issuedAt, issuedAt],
        [0, 0],
        [TOKEN_ID, TOKEN_ID],
        [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID]
      );

      await assertSetAttribute(
        minterA,
        [issuer, issuer2],
        passport,
        [attributes, attributes],
        [verifiedAt, verifiedAt],
        [0, 0],
        mockReader
      );
    });

    it("setAttributesBulk (Multiple Attributes, Diff Issuers - diff dataset)", async () => {
      const attributes1: any = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: formatBytes32String("9"),
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      const attributes2: any = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: formatBytes32String("2"),
        [ATTRIBUTE_COUNTRY]: id("CA"),
        [ATTRIBUTE_IS_BUSINESS]: id("TRUE"),
      };
      await setAttributesBulk(
        passport,
        minterA,
        [issuer, issuer2],
        [attributes1, attributes2],
        [verifiedAt, verifiedAt + 1],
        [issuedAt, issuedAt + 1],
        [MINT_PRICE, parseInt(MINT_PRICE) + 1],
        [TOKEN_ID, TOKEN_ID],
        [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID]
      );

      await assertSetAttribute(
        minterA,
        [issuer, issuer2],
        passport,
        [attributes1, attributes2],
        [verifiedAt, verifiedAt + 1],
        [MINT_PRICE, parseInt(MINT_PRICE) + 1],
        mockReader
      );
    });
  });

  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>      ERROR TESTS   <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //

  describe("QuadPassport.setAttributesBulk (ALL ERRORS)", async () => {
    let attrKeys: any,
      attrValues: any,
      attrTypes: any,
      fee: any,
      tokenId: any,
      chainId: any,
      sigIssuer: any,
      sigAccount: any,
      attributesCopy: any;

    beforeEach(async () => {
      attrKeys = [];
      attrValues = [];
      attrTypes = [];

      let did = formatBytes32String("0");

      // Deep Copy to avoid mutating the object
      attributesCopy = Object.assign({}, attributes);
      Object.keys(attributesCopy).forEach((k, i) => {
        let attrKey;
        if (k === ATTRIBUTE_AML) {
          expect(ATTRIBUTE_DID in attributesCopy).to.equal(true);
          did = attributes[ATTRIBUTE_DID];
          attrKey = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ["bytes32", "bytes32"],
              [did, k]
            )
          );
        } else {
          attrKey = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ["address", "bytes32"],
              [minterA.address, k]
            )
          );
        }
        if (k !== ATTRIBUTE_DID) {
          attrKeys.push(attrKey);
          attrValues.push(attributesCopy[k]);
          attrTypes.push(k);
        }
      });

      delete attributesCopy[ATTRIBUTE_DID];

      fee = MINT_PRICE;
      tokenId = TOKEN_ID;
      chainId = HARDHAT_CHAIN_ID;

      sigIssuer = await signSetAttributes(
        minterA,
        issuer,
        attributesCopy,
        verifiedAt,
        issuedAt,
        fee,
        did,
        passport.address,
        chainId
      );

      sigAccount = await signAccount(minterA);
    });

    it("setAttributesBulk (Multiple Attributes, Diff Issuers - wrong DID", async () => {
      const attributes2 = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:newwrongdid"),
        [ATTRIBUTE_AML]: formatBytes32String("9"),
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await expect(
        setAttributesBulk(
          passport,
          minterA,
          [issuer, issuer2],
          [attributes, attributes2],
          [verifiedAt, verifiedAt],
          [issuedAt, issuedAt],
          [MINT_PRICE, MINT_PRICE],
          [TOKEN_ID, TOKEN_ID],
          [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID]
        )
      ).to.revertedWith("INVALID_DID");
    });

    it("setAttributesBulk (Multiple Attributes, Diff Issuers - reuse signature", async () => {
      await setAttributesBulk(
        passport,
        minterA,
        [issuer, issuer2],
        [attributes, attributes],
        [verifiedAt, verifiedAt],
        [issuedAt, issuedAt],
        [MINT_PRICE, MINT_PRICE],
        [TOKEN_ID, TOKEN_ID],
        [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID]
      );

      await expect(
        setAttributesBulk(
          passport,
          minterA,
          [issuer, issuer2],
          [attributes, attributes],
          [verifiedAt, verifiedAt],
          [issuedAt, issuedAt],
          [MINT_PRICE, MINT_PRICE],
          [TOKEN_ID, TOKEN_ID],
          [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID]
        )
      ).to.revertedWith("SIGNATURE_ALREADY_USED");
    });

    it("setAttributesBulk (Multiple Attributes, Diff Issuers - 0 verifiedAt", async () => {
      await expect(
        setAttributesBulk(
          passport,
          minterA,
          [issuer, issuer2],
          [attributes, attributes],
          [0, verifiedAt],
          [issuedAt, issuedAt],
          [MINT_PRICE, MINT_PRICE],
          [TOKEN_ID, TOKEN_ID],
          [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID]
        )
      ).to.revertedWith("VERIFIED_AT_CANNOT_BE_ZERO");
    });

    it("setAttributesBulk (Multiple Attributes, Diff Issuers - future verifiedAt", async () => {
      const blockNumAfter = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(blockNumAfter);
      const badVerifiedAt = currentBlock.timestamp + 100;

      await expect(
        setAttributesBulk(
          passport,
          minterA,
          [issuer, issuer2],
          [attributes, attributes],
          [badVerifiedAt, verifiedAt],
          [issuedAt, issuedAt],
          [MINT_PRICE, MINT_PRICE],
          [TOKEN_ID, TOKEN_ID],
          [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID]
        )
      ).to.revertedWith("INVALID_VERIFIED_AT");
    });

    it("setAttributesBulk (Multiple Attributes, Diff Issuers - expired issuedAt", async () => {
      const blockNumAfter = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(blockNumAfter);
      const expiredIssuedAt = currentBlock.timestamp - 90400;
      await expect(
        setAttributesBulk(
          passport,
          minterA,
          [issuer, issuer2],
          [attributes, attributes],
          [verifiedAt, verifiedAt],
          [expiredIssuedAt, issuedAt],
          [MINT_PRICE, MINT_PRICE],
          [TOKEN_ID, TOKEN_ID],
          [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID]
        )
      ).to.revertedWith("EXPIRED_ISSUED_AT");
    });

    it("fail - invalid fee", async () => {
      const wrongFee = fee.sub(1);
      await expect(
        passport
          .connect(minterA)
          .setAttributesBulk(
            [
              [
                attrKeys,
                attrValues,
                attrTypes,
                attributes[ATTRIBUTE_DID],
                tokenId,
                verifiedAt,
                issuedAt,
                fee,
              ],
            ],
            [sigIssuer],
            [sigAccount],
            {
              value: wrongFee,
            }
          )
      ).to.be.revertedWith("INVALID_SET_ATTRIBUTE_BULK_FEE");
    });
  });
});
