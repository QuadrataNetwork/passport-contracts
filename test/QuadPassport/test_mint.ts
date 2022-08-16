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
        [ATTRIBUTE_DID]: formatBytes32String("did:quad:123456789abcdefghi"),
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

    it("setAttributes (Multiple Issuers - same wallet but diff DID)", async () => {
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
        [ATTRIBUTE_DID]: formatBytes32String("did:quad:newdid"),
        [ATTRIBUTE_AML]: formatBytes32String("9"),
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributeByIssuer2,
        verifiedAt + 1,
        issuedAt + 1,
        MINT_PRICE.add(1)
      );

      // Check DID
      let response = await passport
        .connect(mockReader)
        .attributes(minterA.address, ATTRIBUTE_DID);

      expect(response.length).equals(2);

      expect(response[0].value).equals(attributes[ATTRIBUTE_DID]);
      expect(response[0].issuer).equals(issuer.address);
      expect(response[0].epoch).equals(verifiedAt);

      expect(response[1].value).equals(attributeByIssuer2[ATTRIBUTE_DID]);
      expect(response[1].issuer).equals(issuer2.address);
      expect(response[1].epoch).equals(verifiedAt + 1);

      // Check AML
      response = await passport
        .connect(mockReader)
        .attributes(minterA.address, ATTRIBUTE_AML);

      expect(response.length).equals(1);

      expect(response[0].value).equals(attributes[ATTRIBUTE_AML]);
      expect(response[0].issuer).equals(issuer.address);
      expect(response[0].epoch).equals(verifiedAt);

      // Check IS_BUSINESS
      response = await passport
        .connect(mockReader)
        .attributes(minterA.address, ATTRIBUTE_IS_BUSINESS);

      expect(response.length).equals(2);

      expect(response[0].value).equals(
        attributeByIssuer2[ATTRIBUTE_IS_BUSINESS]
      );
      expect(response[0].value).equals(response[1].value);
      expect(response[0].issuer).equals(issuer.address);
      expect(response[1].issuer).equals(issuer2.address);
      expect(response[0].epoch).equals(verifiedAt);
      expect(response[1].epoch).equals(verifiedAt + 1);

      expect(await passport.balanceOf(minterA.address, TOKEN_ID)).to.equal(1);
      expect(await ethers.provider.getBalance(passport.address)).to.equal(
        MINT_PRICE.mul(2).add(1)
      );
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
  });

  describe("QuadPassport.setAttributes (ALL ERRORS)", async () => {
    let attrKeys: any,
      attrValues: any,
      fee: any,
      tokenId: any,
      blockId: any,
      sigIssuer: any,
      sigAccount: any;

    beforeEach(async () => {
      attrKeys = [];
      attrValues = [];

      Object.keys(attributes).forEach((k, i) => {
        let attrKey;
        if (k === ATTRIBUTE_AML) {
          attrKey = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ["bytes32", "bytes32"],
              [attributes[ATTRIBUTE_DID], k]
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
            [attrKeys, attrValues, tokenId, verifiedAt, issuedAt, fee],
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
            [attrKeys, attrValues, tokenId, verifiedAt, issuedAt, fee],
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
            [attrKeys, attrValues, tokenId, verifiedAt, issuedAt, fee],
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
            [attrKeys, attrValues, tokenId, verifiedAt, issuedAt, fee],
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
            [attrKeys, attrValues, tokenId, verifiedAt, issuedAt, fee],
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
            [attrKeys, attrValues, tokenId, verifiedAt, issuedAt, fee],
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
            [attrKeys, attrValues, tokenId, verifiedAt, wrongIssuedAt, fee],
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
            [attrKeys, attrValues, tokenId, wrongVerifiedAt, issuedAt, fee],
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
            [attrKeys, attrValues, wrongTokenId, verifiedAt, issuedAt, fee],
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
            [attrKeys, attrValues, tokenId, verifiedAt, issuedAt, fee],
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
