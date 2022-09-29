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
      const attributes: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributesBulk(
        passport,
        minterA,
        [issuer],
        [attributes],
        [verifiedAt],
        [issuedAt],
        [MINT_PRICE],
        [TOKEN_ID],
        [HARDHAT_CHAIN_ID],
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

    it("setAttributesBulk (Multiple Attributes, Diff Issuers - same dataset)", async () => {
      const attributes: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributesBulk(
        passport,
        minterA,
        [issuer, issuer2],
        [attributes, attributes],
        [verifiedAt, verifiedAt],
        [issuedAt, issuedAt],
        [MINT_PRICE, MINT_PRICE],
        [TOKEN_ID, TOKEN_ID],
        [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID],
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

  // describe("QuadPassport.setAttributes (ALL ERRORS)", async () => {
  //   let attrKeys: any,
  //     attrValues: any,
  //     attrTypes: any,
  //     fee: any,
  //     tokenId: any,
  //     chainId: any,
  //     sigIssuer: any,
  //     sigAccount: any,
  //     attributesCopy: any;

  //   beforeEach(async () => {
  //     attrKeys = [];
  //     attrValues = [];
  //     attrTypes = [];

  //     let did = formatBytes32String("0");

  //     // Deep Copy to avoid mutating the object
  //     attributesCopy = Object.assign({}, attributes);
  //     Object.keys(attributesCopy).forEach((k, i) => {
  //       let attrKey;
  //       if (k === ATTRIBUTE_AML) {
  //         expect(ATTRIBUTE_DID in attributesCopy).to.equal(true);
  //         did = attributes[ATTRIBUTE_DID];
  //         attrKey = ethers.utils.keccak256(
  //           ethers.utils.defaultAbiCoder.encode(
  //             ["bytes32", "bytes32"],
  //             [did, k]
  //           )
  //         );
  //       } else {
  //         attrKey = ethers.utils.keccak256(
  //           ethers.utils.defaultAbiCoder.encode(
  //             ["address", "bytes32"],
  //             [minterA.address, k]
  //           )
  //         );
  //       }
  //       if (k !== ATTRIBUTE_DID) {
  //         attrKeys.push(attrKey);
  //         attrValues.push(attributesCopy[k]);
  //         attrTypes.push(k);
  //       }
  //     });

  //     delete attributesCopy[ATTRIBUTE_DID];

  //     fee = MINT_PRICE;
  //     tokenId = TOKEN_ID;
  //     chainId = HARDHAT_CHAIN_ID;

  //     sigIssuer = await signSetAttributes(
  //       minterA,
  //       issuer,
  //       attributesCopy,
  //       verifiedAt,
  //       issuedAt,
  //       fee,
  //       did,
  //       passport.address,
  //       chainId
  //     );

  //     sigAccount = await signAccount(minterA);
  //   });

  //   it("success - tokenId not included in signature", async () => {
  //     const wrongTokenId = 2;
  //     await governance
  //       .connect(admin)
  //       .setEligibleTokenId(wrongTokenId, true, "");

  //     await passport
  //       .connect(minterA)
  //       .setAttributes(
  //         [
  //           attrKeys,
  //           attrValues,
  //           attrTypes,
  //           attributes[ATTRIBUTE_DID],
  //           wrongTokenId,
  //           verifiedAt,
  //           issuedAt,
  //           fee,
  //         ],
  //         sigIssuer,
  //         sigAccount,
  //         {
  //           value: fee,
  //         }
  //       );
  //   });

  //   it("success - with no mint with tokenId = 0", async () => {
  //     const noMint = 0;
  //     await governance.connect(admin).setEligibleTokenId(noMint, true, "");

  //     await passport
  //       .connect(minterA)
  //       .setAttributes(
  //         [
  //           attrKeys,
  //           attrValues,
  //           attrTypes,
  //           attributes[ATTRIBUTE_DID],
  //           noMint,
  //           verifiedAt,
  //           issuedAt,
  //           fee,
  //         ],
  //         sigIssuer,
  //         sigAccount,
  //         {
  //           value: fee,
  //         }
  //       );

  //     expect(await passport.balanceOf(minterA.address, 0)).equals(0);
  //     expect(await passport.balanceOf(minterA.address, 1)).equals(0);
  //     expect(await passport.balanceOf(minterA.address, 2)).equals(0);

  //     await assertGetAttributes(
  //       minterA,
  //       ATTRIBUTE_AML,
  //       reader,
  //       defi,
  //       treasury,
  //       [issuer],
  //       [attributes],
  //       [verifiedAt]
  //     );
  //     await assertGetAttributes(
  //       minterA,
  //       ATTRIBUTE_DID,
  //       reader,
  //       defi,
  //       treasury,
  //       [issuer],
  //       [attributes],
  //       [verifiedAt]
  //     );
  //     await assertGetAttributes(
  //       minterA,
  //       ATTRIBUTE_IS_BUSINESS,
  //       reader,
  //       defi,
  //       treasury,
  //       [issuer],
  //       [attributes],
  //       [verifiedAt]
  //     );
  //   });

  //   it("fail - signature already used", async () => {
  //     await setAttributes(
  //       minterA,
  //       issuer,
  //       passport,
  //       attributes,
  //       verifiedAt,
  //       issuedAt,
  //       MINT_PRICE
  //     );
  //     await expect(
  //       setAttributes(
  //         minterA,
  //         issuer,
  //         passport,
  //         attributes,
  //         verifiedAt,
  //         issuedAt,
  //         MINT_PRICE
  //       )
  //     ).to.be.revertedWith("SIGNATURE_ALREADY_USED");
  //   });

  //   it("fail - same wallet but diff DID)", async () => {
  //     await setAttributes(
  //       minterA,
  //       issuer,
  //       passport,
  //       attributes,
  //       verifiedAt,
  //       issuedAt,
  //       MINT_PRICE
  //     );

  //     const attributeByIssuer2 = {
  //       [ATTRIBUTE_DID]: formatBytes32String("quad:did:newwrongdid"),
  //       [ATTRIBUTE_AML]: formatBytes32String("9"),
  //       [ATTRIBUTE_COUNTRY]: id("US"),
  //       [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
  //     };

  //     await expect(
  //       setAttributes(
  //         minterA,
  //         issuer2,
  //         passport,
  //         attributeByIssuer2,
  //         verifiedAt + 1,
  //         issuedAt + 1,
  //         MINT_PRICE.add(1)
  //       )
  //     ).to.revertedWith("INVALID_DID");
  //   });

  //   it("fail - issuers cannot update DID when passed as attribute value", async () => {
  //     await setAttributes(
  //       minterA,
  //       issuer,
  //       passport,
  //       attributes,
  //       verifiedAt,
  //       issuedAt,
  //       MINT_PRICE
  //     );

  //     const newAttributeDID = {
  //       [ATTRIBUTE_DID]: formatBytes32String("quad:did:newwrongdid"),
  //       [ATTRIBUTE_AML]: formatBytes32String("9"),
  //       [ATTRIBUTE_COUNTRY]: id("US"),
  //       [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
  //     };

  //     await expect(
  //       setAttributes(
  //         minterA,
  //         issuer,
  //         passport,
  //         newAttributeDID,
  //         verifiedAt,
  //         issuedAt,
  //         MINT_PRICE,
  //         TOKEN_ID,
  //         HARDHAT_CHAIN_ID,
  //         {
  //           oldDid: attributes[ATTRIBUTE_DID],
  //           attemptUpdateDid: true
  //         }
  //       )
  //     ).to.revertedWith("ISSUER_UPDATED_DID");
  //   });

  //   it("fail - invalid tokenId", async () => {
  //     const badTokenId = 1337;
  //     await expect(
  //       setAttributes(
  //         minterA,
  //         issuer,
  //         passport,
  //         attributes,
  //         verifiedAt,
  //         issuedAt,
  //         MINT_PRICE,
  //         badTokenId
  //       )
  //     ).to.be.revertedWith("PASSPORT_TOKENID_INVALID");
  //   });

  //   it("fail - zero verifiedAt", async () => {
  //     const verifiedAt = 0;
  //     await expect(
  //       setAttributes(
  //         minterA,
  //         issuer,
  //         passport,
  //         attributes,
  //         verifiedAt,
  //         issuedAt,
  //         MINT_PRICE
  //       )
  //     ).to.be.revertedWith("VERIFIED_AT_CANNOT_BE_ZERO");
  //   });

  //   it("fail - future verifiedAt", async () => {
  //     const blockNumAfter = await ethers.provider.getBlockNumber();
  //     const currentBlock = await ethers.provider.getBlock(blockNumAfter);
  //     const badVerifiedAt = currentBlock.timestamp + 100;
  //     await expect(
  //       setAttributes(
  //         minterA,
  //         issuer,
  //         passport,
  //         attributes,
  //         badVerifiedAt,
  //         issuedAt,
  //         MINT_PRICE
  //       )
  //     ).to.be.revertedWith("INVALID_VERIFIED_AT");
  //   });

  //   it("fail - zero issuedAt", async () => {
  //     const badIssuedAt = 0;
  //     await expect(
  //       setAttributes(
  //         minterA,
  //         issuer,
  //         passport,
  //         attributes,
  //         verifiedAt,
  //         badIssuedAt,
  //         MINT_PRICE
  //       )
  //     ).to.be.revertedWith("ISSUED_AT_CANNOT_BE_ZERO");
  //   });

  //   it("fail - issuedAt expired", async () => {
  //     const blockNumAfter = await ethers.provider.getBlockNumber();
  //     const currentBlock = await ethers.provider.getBlock(blockNumAfter);
  //     const issuedAt = currentBlock.timestamp - 90400;
  //     await expect(
  //       setAttributes(
  //         minterA,
  //         issuer,
  //         passport,
  //         attributes,
  //         verifiedAt,
  //         issuedAt,
  //         MINT_PRICE
  //       )
  //     ).to.be.revertedWith("EXPIRED_ISSUED_AT");
  //   });

  //   it("fail - invalid fee", async () => {
  //     const wrongFee = fee.sub(1);
  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: wrongFee,
  //           }
  //         )
  //     ).to.be.revertedWith("INVALID_SET_ATTRIBUTE_FEE");
  //   });

  //   it("fail - not an ISSUER_ROLE", async () => {
  //     await governance.connect(admin).setIssuerStatus(issuer.address, false);
  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("INVALID_ISSUER");
  //   });

  //   it("fail - attrKeys.length != attrValues.length", async () => {
  //     attrKeys.push(id("wrong"));
  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("MISMATCH_LENGTH");
  //   });

  //   it("fail - attrKeys.length != attrTypes.length", async () => {
  //     attrTypes.push(id("wrong"));
  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("MISMATCH_LENGTH");
  //   });

  //   it("fail - invalid signature (attrKeys)", async () => {
  //     attrKeys[0] = id("wrong");

  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("INVALID_ISSUER");
  //   });

  //   it("fail - invalid signature (DID)", async () => {
  //     const wrongDID = id("wrong");

  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             wrongDID,
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("INVALID_ISSUER");
  //   });

  //   it("fail - invalid signature (attrValues)", async () => {
  //     attrValues[0] = id("wrong");

  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("INVALID_ISSUER");
  //   });

  //   it("fail - invalid signature (chainId)", async () => {
  //     const wrongChainId = 1;
  //     sigIssuer = await signSetAttributes(
  //       minterA,
  //       issuer,
  //       attributes,
  //       verifiedAt,
  //       issuedAt,
  //       fee,
  //       attributes[ATTRIBUTE_DID],
  //       passport.address,
  //       wrongChainId
  //     );

  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("INVALID_ISSUER");
  //   });

  //   it("fail - invalid signature (contractAddress)", async () => {
  //     sigIssuer = await signSetAttributes(
  //       minterA,
  //       issuer,
  //       attributes,
  //       verifiedAt,
  //       issuedAt,
  //       fee,
  //       attributes[ATTRIBUTE_DID],
  //       governance.address,
  //       chainId
  //     );

  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("INVALID_ISSUER");
  //   });

  //   it("fail - invalid signature (issuedAt)", async () => {
  //     const wrongIssuedAt = issuedAt - 1;

  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             wrongIssuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("INVALID_ISSUER");
  //   });

  //   it("fail - invalid signature (verifiedAt)", async () => {
  //     const wrongVerifiedAt = verifiedAt - 1;

  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             wrongVerifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("INVALID_ISSUER");
  //   });

  //   it("fail - mismatch sigAccount and sigIssuer", async () => {
  //     sigAccount = await signAccount(minterB);
  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("INVALID_ISSUER");
  //   });

  //   it("fail - contract paused", async () => {
  //     await passport.connect(admin).pause();
  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("Pausable: paused");
  //   });

  //   it("fail - issuer with no permission to issue attribute DID", async () => {
  //     await governance
  //       .connect(admin)
  //       .setIssuerAttributePermission(issuer.address, ATTRIBUTE_DID, false);
  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("ISSUER_ATTR_PERMISSION_INVALID");
  //   });

  //   it("fail - issuer with no permission to issue attribute AML", async () => {
  //     await governance
  //       .connect(admin)
  //       .setIssuerAttributePermission(issuer.address, ATTRIBUTE_AML, false);
  //     await expect(
  //       passport
  //         .connect(minterA)
  //         .setAttributes(
  //           [
  //             attrKeys,
  //             attrValues,
  //             attrTypes,
  //             attributes[ATTRIBUTE_DID],
  //             tokenId,
  //             verifiedAt,
  //             issuedAt,
  //             fee,
  //           ],
  //           sigIssuer,
  //           sigAccount,
  //           {
  //             value: fee,
  //           }
  //         )
  //     ).to.be.revertedWith("ISSUER_ATTR_PERMISSION_INVALID");
  //   });
  // });
});
