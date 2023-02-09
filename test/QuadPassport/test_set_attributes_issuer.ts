import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { formatBytes32String, id } from "ethers/lib/utils";

const {
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

const { signSetAttributes } = require("../helpers/signature.ts");

const { setAttributesIssuer } = require("../helpers/set_attributes_issuer.ts");
const {
  assertSetAttribute,
} = require("../helpers/assert/assert_set_attributes.ts");

const {
  assertGetAttributes,
} = require("../helpers/assert/assert_get_attributes.ts");

describe("QuadPassport.setAttributesIssuer", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let defi: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let businessPassport: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuer2: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerTreasury2: SignerWithAddress,
    mockReader: SignerWithAddress;

  let issuedAt: number, verifiedAt: number;
  let attributes: any = {
    [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
    [ATTRIBUTE_AML]: formatBytes32String("1"),
    [ATTRIBUTE_COUNTRY]: id("FRANCE"),
    [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
  };
  const zeroFee = ethers.utils.parseEther("0");

  beforeEach(async () => {
    [
      deployer,
      admin,
      minterA,
      issuer,
      issuer2,
      treasury,
      issuerTreasury,
      issuerTreasury2,
      mockReader,
    ] = await ethers.getSigners();
    [governance, passport, reader, defi, businessPassport] =
      await deployPassportEcosystem(admin, [issuer, issuer2], treasury, [
        issuerTreasury,
        issuerTreasury2,
      ]);

    // set issued at to current block timestamp
    issuedAt = await ethers.provider.getBlock("latest").then((block) => block.timestamp) - 100;
    verifiedAt = issuedAt;

    await governance.connect(admin).grantRole(READER_ROLE, mockReader.address);
  });

  describe("QuadPassport.setAttributesIssuer (success)", async () => {
    beforeEach(async () => {});

    it("setAttributesIssuer (Single Attribute)", async () => {
      const attributes: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );
      await assertSetAttribute(
        businessPassport,
        [issuer],
        passport,
        [attributes],
        [verifiedAt],
        [zeroFee],
        mockReader
      );
    });

    it("setAttributesIssuer (Single Attribute for EOA)", async () => {
      const attributes: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributesIssuer(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );
      await assertSetAttribute(
        minterA,
        [issuer],
        passport,
        [attributes],
        [verifiedAt],
        [zeroFee],
        mockReader
      );
    });

    it("setAttributesIssuer (Multiple Attribute)", async () => {
      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );

      await assertSetAttribute(
        businessPassport,
        [issuer],
        passport,
        [attributes],
        [verifiedAt],
        [zeroFee],
        mockReader
      );
    });

    it("setAttributesIssuer (Multiple issuers for exact same Attribute)", async () => {
      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );

      await setAttributesIssuer(
        businessPassport,
        issuer2,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );

      await assertSetAttribute(
        businessPassport,
        [issuer, issuer2],
        passport,
        [attributes, attributes],
        [verifiedAt, verifiedAt],
        [zeroFee, zeroFee],
        mockReader
      );
    });

    it("setAttributesIssuer (Multiple Issuers - same wallet same DID)", async () => {
      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );

      const attributeByIssuer2 = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: formatBytes32String("9"),
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await governance.connect(admin).setEligibleTokenId(2, true, "");

      await setAttributesIssuer(
        businessPassport,
        issuer2,
        passport,
        attributeByIssuer2,
        verifiedAt + 1,
        issuedAt + 1,
        2 // new TokenId
      );
      await assertSetAttribute(
        businessPassport,
        [issuer, issuer2],
        passport,
        [attributes, attributeByIssuer2],
        [verifiedAt, verifiedAt + 1],
        [zeroFee, zeroFee],
        mockReader
      );

      expect(await passport.balanceOf(businessPassport.address, 1)).to.equal(1);
      expect(await passport.balanceOf(businessPassport.address, 2)).to.equal(1);
    });

    it("setAttributesIssuer (fee = 0)", async () => {
      const attributes: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );
      await assertSetAttribute(
        businessPassport,
        [issuer],
        passport,
        [attributes],
        [verifiedAt],
        [0],
        mockReader
      );
    });

    it("success - overwritting position (single issuer)", async () => {
      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );

      const updatedAttributes: any = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: formatBytes32String("5"),
        [ATTRIBUTE_COUNTRY]: id("BE"),
        [ATTRIBUTE_IS_BUSINESS]: id("TRUE"),
      };

      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        updatedAttributes,
        verifiedAt + 1,
        issuedAt + 1
      );

      await assertSetAttribute(
        businessPassport,
        [issuer],
        passport,
        [updatedAttributes],
        [verifiedAt + 1],
        [zeroFee.mul(2)],
        mockReader
      );
    });

    it("success - overwritting position (multiple issuers)", async () => {
      // Issuer 1
      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );

      // Issuer 2
      const attributeByIssuer2 = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: formatBytes32String("9"),
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributesIssuer(
        businessPassport,
        issuer2,
        passport,
        attributeByIssuer2,
        verifiedAt + 10,
        issuedAt + 10
      );

      await assertSetAttribute(
        businessPassport,
        [issuer, issuer2],
        passport,
        [attributes, attributeByIssuer2],
        [verifiedAt, verifiedAt + 10],
        [zeroFee, zeroFee],
        mockReader
      );

      // Update Issuer 1
      const updatedAttributes: any = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: formatBytes32String("5"),
        [ATTRIBUTE_COUNTRY]: id("BE"),
        [ATTRIBUTE_IS_BUSINESS]: id("TRUE"),
      };

      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        updatedAttributes,
        verifiedAt + 1,
        issuedAt + 1
      );

      await assertSetAttribute(
        businessPassport,
        [issuer, issuer2],
        passport,
        [updatedAttributes, attributeByIssuer2],
        [verifiedAt + 1, verifiedAt + 10],
        [zeroFee.mul(2), zeroFee],
        mockReader
      );

      // Update Issuer 2
      const updatedAttrIssuer2 = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: formatBytes32String("7"),
        [ATTRIBUTE_COUNTRY]: id("DE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributesIssuer(
        businessPassport,
        issuer2,
        passport,
        updatedAttrIssuer2,
        verifiedAt + 15,
        issuedAt + 15
      );

      await assertSetAttribute(
        businessPassport,
        [issuer, issuer2],
        passport,
        [updatedAttributes, updatedAttrIssuer2],
        [verifiedAt + 1, verifiedAt + 15],
        [zeroFee.mul(2), zeroFee.mul(2)],
        mockReader
      );
    });

    it("setAttributesIssuer (overwrite with diff tokenId)", async () => {
      const attributes: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      const newTokenId = 2;
      await governance.connect(admin).setEligibleTokenId(newTokenId, true, "");

      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );

      const attributes2: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("TRUE"),
      };

      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributes2,
        verifiedAt + 1,
        issuedAt + 1
      );

      await assertSetAttribute(
        businessPassport,
        [issuer],
        passport,
        [attributes2],
        [verifiedAt + 1],
        [zeroFee],
        mockReader,
        newTokenId
      );

      // Check that old tokenId still exists
      await assertSetAttribute(
        businessPassport,
        [issuer],
        passport,
        [attributes2],
        [verifiedAt + 1],
        [zeroFee],
        mockReader,
        1
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

  describe("QuadPassport.setAttributesIssuer (ALL ERRORS)", async () => {
    let attrKeys: any,
      attrValues: any,
      attrTypes: any,
      fee: any,
      tokenId: any,
      chainId: any,
      sigIssuer: any;

    beforeEach(async () => {
      attrKeys = [];
      attrValues = [];
      attrTypes = [];

      attributes = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("1"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      let did = attributes[ATTRIBUTE_DID];
      // Deep Copy to avoid mutating the object
      const attributesCopy = Object.assign({}, attributes);
      Object.keys(attributesCopy).forEach((k, i) => {
        if (k === ATTRIBUTE_AML) {
          expect(ATTRIBUTE_DID in attributesCopy).to.equal(true);
        }
        if (k !== ATTRIBUTE_DID) {
          attrValues.push(attributesCopy[k]);
          attrTypes.push(k);
        }
      });

      delete attributesCopy[ATTRIBUTE_DID];

      fee = zeroFee;
      tokenId = TOKEN_ID;
      chainId = HARDHAT_CHAIN_ID;

      sigIssuer = await signSetAttributes(
        businessPassport,
        issuer,
        attributesCopy,
        verifiedAt,
        issuedAt,
        fee,
        did,
        passport.address,
        chainId
      );
    });

    it("success - make sure all parameters work", async () => {
      await passport
        .connect(issuer)
        .setAttributesIssuer(
          businessPassport.address,
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
          sigIssuer,
          {
            value: fee,
          }
        );
    });

    it("success - issuerB can sign using issuerA's sig", async () => {
      await expect(
        passport
          .connect(issuer2)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.not.be.reverted;
    });

    it("success - not an ISSUER_ROLE", async () => {
      await governance.connect(admin).setIssuerStatus(issuer.address, false);
      await expect(
        passport
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.be.reverted;
    });

    it("success - invalid (signature) - wrong issuer sender", async () => {
      await expect(
        passport
          .connect(minterA)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.not.be.reverted;
    });

    it("fail - signature too old (must be used within 6 hours of issuance", async () => {
      // set block timestamp to be 5 hours passed issuedAt
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        issuedAt + 5 * 60 * 60,
      ]);
      await expect(
        setAttributesIssuer(
          businessPassport,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt
        )
      ).to.not.be.reverted;

      // set block timestamp to be 7 hours passed issuedAt
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        issuedAt + 7 * 60 * 60,
      ]);
      await expect(
        setAttributesIssuer(
          businessPassport,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt
        )
      ).to.be.revertedWith("EXPIRED_ISSUED_AT");
    });

    it("fail - same wallet but diff DID)", async () => {
      await setAttributesIssuer(
        businessPassport,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );

      const attributeByIssuer2 = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:newwrongdid"),
        [ATTRIBUTE_AML]: formatBytes32String("9"),
        [ATTRIBUTE_COUNTRY]: id("US"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await expect(
        setAttributesIssuer(
          businessPassport,
          issuer2,
          passport,
          attributeByIssuer2,
          verifiedAt + 1,
          issuedAt + 1
        )
      ).to.revertedWith("INVALID_DID");
    });

    it("fail - invalid tokenId", async () => {
      const badTokenId = 1337;
      await expect(
        setAttributesIssuer(
          businessPassport,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt,
          badTokenId
        )
      ).to.be.revertedWith("PASSPORT_TOKENID_INVALID");
    });

    it("fail - zero verifiedAt", async () => {
      const verifiedAt = 0;
      await expect(
        setAttributesIssuer(
          businessPassport,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt
        )
      ).to.be.revertedWith("VERIFIED_AT_CANNOT_BE_ZERO");
    });

    it("fail - future verifiedAt", async () => {
      const blockNumAfter = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(blockNumAfter);
      const badVerifiedAt = currentBlock.timestamp + 100;
      await expect(
        setAttributesIssuer(
          businessPassport,
          issuer,
          passport,
          attributes,
          badVerifiedAt,
          issuedAt
        )
      ).to.be.revertedWith("INVALID_VERIFIED_AT");
    });

    it("fail - future issuedAt", async () => {
      const blockNumAfter = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(blockNumAfter);
      const badIssuedAt = currentBlock.timestamp + 100;
      await expect(
        setAttributesIssuer(
          businessPassport,
          issuer,
          passport,
          attributes,
          verifiedAt,
          badIssuedAt
        )
      ).to.be.revertedWith("INVALID_ISSUED_AT");
    });

    it("fail - zero issuedAt", async () => {
      const badIssuedAt = 0;
      await expect(
        setAttributesIssuer(
          businessPassport,
          issuer,
          passport,
          attributes,
          verifiedAt,
          badIssuedAt
        )
      ).to.be.revertedWith("ISSUED_AT_CANNOT_BE_ZERO");
    });

    it("fail - issuedAt expired", async () => {
      const blockNumAfter = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(blockNumAfter);
      const issuedAt = currentBlock.timestamp - 90400;
      await expect(
        setAttributesIssuer(
          businessPassport,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt
        )
      ).to.be.revertedWith("EXPIRED_ISSUED_AT");
    });

    it("fail - invalid fee", async () => {
      const wrongFee = fee.add(1);
      await expect(
        passport
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
            {
              value: wrongFee,
            }
          )
      ).to.be.revertedWith("INVALID_SET_ATTRIBUTE_FEE");
    });

    it("fail - attrTypes.length != attrValues.length", async () => {
      attrTypes.push(id("wrong"));
      await expect(
        passport
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
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
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
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
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid signature (DID)", async () => {
      const wrongDID = id("wrong");

      await expect(
        passport
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
            [
              attrKeys,
              attrValues,
              attrTypes,
              wrongDID,
              tokenId,
              verifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
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
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid signature (chainId)", async () => {
      const wrongChainId = 1;
      sigIssuer = await signSetAttributes(
        businessPassport,
        issuer,
        attributes,
        verifiedAt,
        issuedAt,
        fee,
        attributes[ATTRIBUTE_DID],
        passport.address,
        wrongChainId
      );

      await expect(
        passport
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - invalid signature (passport address)", async () => {
      sigIssuer = await signSetAttributes(
        businessPassport,
        issuer,
        attributes,
        verifiedAt,
        issuedAt,
        fee,
        attributes[ATTRIBUTE_DID],
        governance.address,
        chainId
      );

      await expect(
        passport
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
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
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
            [
              attrKeys,
              attrValues,
              attrTypes,
              attributes[ATTRIBUTE_DID],
              tokenId,
              verifiedAt,
              wrongIssuedAt,
              fee,
            ],
            sigIssuer,
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
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
            [
              attrKeys,
              attrValues,
              attrTypes,
              attributes[ATTRIBUTE_DID],
              tokenId,
              wrongVerifiedAt,
              issuedAt,
              fee,
            ],
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("success - tokenId not included in signature", async () => {
      const wrongTokenId = 2;
      await governance
        .connect(admin)
        .setEligibleTokenId(wrongTokenId, true, "");

      const did = attributes[ATTRIBUTE_DID];
      //remove first key-value mapping in attributes
      delete attributes[ATTRIBUTE_DID]

      // create issuer sig for the following attributes
      sigIssuer = await signSetAttributes(
        businessPassport,
        issuer,
        attributes,
        verifiedAt,
        issuedAt,
        fee,
        did,
        passport.address,
        chainId
      );

      // set attrValues to values of attributes
      attrValues = Object.values(attributes)
      attrTypes = [
        ATTRIBUTE_AML,
        ATTRIBUTE_COUNTRY,
        ATTRIBUTE_IS_BUSINESS,
      ]

      await passport
        .connect(issuer)
        .setAttributesIssuer(
          businessPassport.address,
          [
            attrKeys,
            attrValues,
            attrTypes,
            did,
            wrongTokenId,
            verifiedAt,
            issuedAt,
            fee,
          ],
          sigIssuer,
          {
            value: fee,
          }
        );
    });

    it("success - with no mint with tokenId = 0", async () => {
      const noMint = 0;
      await governance.connect(admin).setEligibleTokenId(noMint, true, "");

      const did = attributes[ATTRIBUTE_DID];
      delete attributes[ATTRIBUTE_DID]
      sigIssuer = await signSetAttributes(
        businessPassport,
        issuer,
        attributes,
        verifiedAt,
        issuedAt,
        fee,
        did,
        passport.address,
        chainId
      );

      await passport
        .connect(issuer)
        .setAttributesIssuer(
          businessPassport.address,
          [
            attrKeys,
            attrValues,
            attrTypes,
            did,
            noMint,
            verifiedAt,
            issuedAt,
            fee,
          ],
          sigIssuer,
          {
            value: fee,
          }
        );

      expect(await passport.balanceOf(businessPassport.address, 0)).equals(0);
      expect(await passport.balanceOf(businessPassport.address, 1)).equals(0);
      expect(await passport.balanceOf(businessPassport.address, 2)).equals(0);

      await assertGetAttributes(
        businessPassport,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      // add DID back to attributes
      attributes[ATTRIBUTE_DID] = did;

      await assertGetAttributes(
        businessPassport,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributes(
        businessPassport,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("fail - invalid signature (account)", async () => {
      const wrongAccount = treasury.address;

      await expect(
        passport
          .connect(issuer)
          .setAttributesIssuer(
            wrongAccount,
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
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("INVALID_ISSUER");
    });

    it("fail - account address(0)", async () => {
      const wrongAccount = ethers.constants.AddressZero;

      await expect(
        passport
          .connect(issuer)
          .setAttributesIssuer(
            wrongAccount,
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
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("ACCOUNT_CANNOT_BE_ZERO");
    });

    it("fail - contract paused", async () => {
      await passport.connect(admin).pause();
      await expect(
        passport
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("Pausable: paused");
    });

    it("fail - issuer with no permission to issue attribute DID", async () => {
      await governance
        .connect(admin)
        .setIssuerAttributePermission(issuer.address, ATTRIBUTE_DID, false);
      await expect(
        passport
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("ISSUER_ATTR_PERMISSION_INVALID");
    });

    it("fail - issuer with no permission to issue attribute AML", async () => {
      await governance
        .connect(admin)
        .setIssuerAttributePermission(issuer.address, ATTRIBUTE_AML, false);
      await expect(
        passport
          .connect(issuer)
          .setAttributesIssuer(
            businessPassport.address,
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
            sigIssuer,
            {
              value: fee,
            }
          )
      ).to.be.revertedWith("ISSUER_ATTR_PERMISSION_INVALID");
    });
  });

    // clean up test state and reset hardhat network
    after(async () => {
      await network.provider.request({
        method: "hardhat_reset",
      });
    });
});
