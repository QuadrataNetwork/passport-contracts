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
  QUAD_DID,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { signSetAttributes, signAccount } = require("../helpers/signature.ts");

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

  let issuedAt: number, verifiedAt: number;
  const attributes: any = {
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

    it("setAttributes (Single Attribute)", async () => {
      const attributes: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );
      await assertSetAttribute(
        minterA,
        [issuer],
        passport,
        [attributes],
        [verifiedAt],
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
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      await assertSetAttribute(
        minterA,
        [issuer],
        passport,
        [attributes],
        [verifiedAt],
        [MINT_PRICE],
        mockReader
      );
    });

    it("setAttributes (Multiple issuers for exact same Attribute)", async () => {
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
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

    it("setAttributes (Multiple Issuers - same wallet same DID)", async () => {
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      const attributeByIssuer2 = {
        [ATTRIBUTE_AML]: formatBytes32String("9"),
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await governance.connect(admin).setEligibleTokenId(2, true);

      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributeByIssuer2,
        verifiedAt + 1,
        issuedAt + 1,
        MINT_PRICE.add(1),
        2 // new TokenId
      );
      await assertSetAttribute(
        minterA,
        [issuer, issuer2],
        passport,
        [attributes, attributeByIssuer2],
        [verifiedAt, verifiedAt + 1],
        [MINT_PRICE, MINT_PRICE.add(1)],
        mockReader
      );

      expect(await passport.balanceOf(minterA.address, 1)).to.equal(1);
      expect(await passport.balanceOf(minterA.address, 2)).to.equal(1);
    });

    it("setAttributes (fee = 0)", async () => {
      const attributes: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        0
      );
      await assertSetAttribute(
        minterA,
        [issuer],
        passport,
        [attributes],
        [verifiedAt],
        [0],
        mockReader
      );
    });

    it("success - overwritting position (single issuer)", async () => {
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      const updatedAttributes: any = {
        [ATTRIBUTE_AML]: formatBytes32String("5"),
        [ATTRIBUTE_COUNTRY]: id("BE"),
        [ATTRIBUTE_IS_BUSINESS]: id("TRUE"),
      };

      await setAttributes(
        minterA,
        issuer,
        passport,
        updatedAttributes,
        verifiedAt + 1,
        issuedAt + 1,
        MINT_PRICE
      );

      await assertSetAttribute(
        minterA,
        [issuer],
        passport,
        [updatedAttributes],
        [verifiedAt + 1],
        [MINT_PRICE.mul(2)],
        mockReader
      );
    });
    it("success - overwritting position (multiple issuers)", async () => {
      // Issuer 1
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      // Issuer 2
      const attributeByIssuer2 = {
        [ATTRIBUTE_AML]: formatBytes32String("9"),
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributeByIssuer2,
        verifiedAt + 10,
        issuedAt + 10,
        MINT_PRICE
      );

      await assertSetAttribute(
        minterA,
        [issuer, issuer2],
        passport,
        [attributes, attributeByIssuer2],
        [verifiedAt, verifiedAt + 10],
        [MINT_PRICE, MINT_PRICE],
        mockReader
      );

      // Update Issuer 1
      const updatedAttributes: any = {
        [ATTRIBUTE_AML]: formatBytes32String("5"),
        [ATTRIBUTE_COUNTRY]: id("BE"),
        [ATTRIBUTE_IS_BUSINESS]: id("TRUE"),
      };

      await setAttributes(
        minterA,
        issuer,
        passport,
        updatedAttributes,
        verifiedAt + 1,
        issuedAt + 1,
        MINT_PRICE
      );

      await assertSetAttribute(
        minterA,
        [issuer, issuer2],
        passport,
        [updatedAttributes, attributeByIssuer2],
        [verifiedAt + 1, verifiedAt + 10],
        [MINT_PRICE.mul(2), MINT_PRICE],
        mockReader
      );

      // Update Issuer 2
      const updatedAttrIssuer2 = {
        [ATTRIBUTE_AML]: formatBytes32String("7"),
        [ATTRIBUTE_COUNTRY]: id("DE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer2,
        passport,
        updatedAttrIssuer2,
        verifiedAt + 15,
        issuedAt + 15,
        MINT_PRICE
      );

      await assertSetAttribute(
        minterA,
        [issuer, issuer2],
        passport,
        [updatedAttributes, updatedAttrIssuer2],
        [verifiedAt + 1, verifiedAt + 15],
        [MINT_PRICE.mul(2), MINT_PRICE.mul(2)],
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

  describe("QuadPassport.setAttributes (ALL ERRORS)", async () => {
    let attrKeys: any,
      attrValues: any,
      attrTypes: any,
      fee: any,
      tokenId: any,
      blockId: any,
      sigIssuer: any,
      sigAccount: any;

    beforeEach(async () => {
      attrKeys = [];
      attrValues = [];
      attrTypes = [];

      Object.keys(attributes).forEach((k, i) => {
        let attrKey;
        if (k === ATTRIBUTE_AML) {
          attrKey = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ["bytes32", "bytes32"],
              [QUAD_DID, k]
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
        attrKeys.push(attrKey);
        attrValues.push(attributes[k]);
        attrTypes.push(k);
      });

      fee = MINT_PRICE;
      tokenId = TOKEN_ID;
      blockId = HARDHAT_CHAIN_ID;

      sigIssuer = await signSetAttributes(
        minterA,
        issuer,
        attributes,
        verifiedAt,
        issuedAt,
        fee,
        blockId,
        tokenId
      );

      sigAccount = await signAccount(minterA);
    });

    it("fail - signature already used", async () => {
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.be.revertedWith("SIGNATURE_ALREADY_USED");
    });

    it("fail - same wallet but diff DID)", async () => {
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      const attributeByIssuer2 = {
        [ATTRIBUTE_AML]: formatBytes32String("9"),
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await expect(
        setAttributes(
          minterA,
          issuer2,
          passport,
          attributeByIssuer2,
          verifiedAt + 1,
          issuedAt + 1,
          MINT_PRICE.add(1),
          TOKEN_ID,
          HARDHAT_CHAIN_ID,
          formatBytes32String("did:quad:newdid")
        )
      ).to.revertedWith("INVALID_DID");
    });

    it("fail - invalid tokenId", async () => {
      const badTokenId = 1337;
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE,
          badTokenId
        )
      ).to.be.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - zero verifiedAt", async () => {
      const verifiedAt = 0;
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.be.revertedWith("VERIFIED_AT_CANNOT_BE_ZERO");
    });

    it("fail - future verifiedAt", async () => {
      const blockNumAfter = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(blockNumAfter);
      const badVerifiedAt = currentBlock.timestamp + 100;
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          badVerifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.be.revertedWith("INVALID_VERIFIED_AT");
    });

    it("fail - zero issuedAt", async () => {
      const badIssuedAt = 0;
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          badIssuedAt,
          MINT_PRICE
        )
      ).to.be.revertedWith("ISSUED_AT_CANNOT_BE_ZERO");
    });

    it("fail - issuedAt expired", async () => {
      const blockNumAfter = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(blockNumAfter);
      const issuedAt = currentBlock.timestamp - 90400;
      await expect(
        setAttributes(
          minterA,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          MINT_PRICE
        )
      ).to.be.revertedWith("EXPIRED_ISSUED_AT");
    });

    it("fail - invalid fee", async () => {
      const wrongFee = fee.sub(1);
      await expect(
        passport
          .connect(minterA)
          .setAttributes(
            [
              attrKeys,
              attrValues,
              attrTypes,
              tokenId,
              verifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
            sigAccount,
            {
              value: wrongFee,
            }
          )
      ).to.be.revertedWith("INVALID_SET_ATTRIBUTE_FEE");
    });

    it("fail - not an ISSUER_ROLE", async () => {
      await governance.connect(admin).setIssuerStatus(issuer.address, false);
      await expect(
        passport
          .connect(minterA)
          .setAttributes(
            [
              attrKeys,
              attrValues,
              attrTypes,
              tokenId,
              verifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
            sigAccount,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - attrKeys.length != attrValues.length", async () => {
      attrKeys.push(id("wrong"));
      await expect(
        passport
          .connect(minterA)
          .setAttributes(
            [
              attrKeys,
              attrValues,
              attrTypes,
              tokenId,
              verifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
            sigAccount,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("MISMATCH_LENGTH");
    });

    it("fail - attrKeys.length != attrTypes.length", async () => {
      attrTypes.push(id("wrong"));
      await expect(
        passport
          .connect(minterA)
          .setAttributes(
            [
              attrKeys,
              attrValues,
              attrTypes,
              tokenId,
              verifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
            sigAccount,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("MISMATCH_LENGTH");
    });

    it("fail - invalid signature (attrKeys)", async () => {
      attrKeys[0] = id("wrong");

      await expect(
        passport
          .connect(minterA)
          .setAttributes(
            [
              attrKeys,
              attrValues,
              attrTypes,
              tokenId,
              verifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
            sigAccount,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid signature (attrValues)", async () => {
      attrValues[0] = id("wrong");

      await expect(
        passport
          .connect(minterA)
          .setAttributes(
            [
              attrKeys,
              attrValues,
              attrTypes,
              tokenId,
              verifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
            sigAccount,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid signature (chainId)", async () => {
      const wrongChainId = 1;
      sigIssuer = await signSetAttributes(
        minterA,
        issuer,
        attributes,
        verifiedAt,
        issuedAt,
        fee,
        wrongChainId,
        tokenId
      );

      await expect(
        passport
          .connect(minterA)
          .setAttributes(
            [
              attrKeys,
              attrValues,
              attrTypes,
              tokenId,
              verifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
            sigAccount,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid signature (issuedAt)", async () => {
      const wrongIssuedAt = issuedAt - 1;

      await expect(
        passport
          .connect(minterA)
          .setAttributes(
            [
              attrKeys,
              attrValues,
              attrTypes,
              tokenId,
              verifiedAt,
              wrongIssuedAt,
              fee,
            ],
            sigIssuer,
            sigAccount,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid signature (verifiedAt)", async () => {
      const wrongVerifiedAt = verifiedAt - 1;

      await expect(
        passport
          .connect(minterA)
          .setAttributes(
            [
              attrKeys,
              attrValues,
              attrTypes,
              tokenId,
              wrongVerifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
            sigAccount,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid signature (tokenId)", async () => {
      const wrongTokenId = 2;
      await governance.connect(admin).setEligibleTokenId(wrongTokenId, true);

      await expect(
        passport
          .connect(minterA)
          .setAttributes(
            [
              attrKeys,
              attrValues,
              attrTypes,
              wrongTokenId,
              verifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
            sigAccount,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - mismatch sigAccount and sigIssuer", async () => {
      sigAccount = await signAccount(minterB);
      await expect(
        passport
          .connect(minterA)
          .setAttributes(
            [
              attrKeys,
              attrValues,
              attrTypes,
              tokenId,
              verifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
            sigAccount,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });
  });
});
