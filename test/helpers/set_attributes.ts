import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  TOKEN_ID,
  HARDHAT_CHAIN_ID,
} = require("../../utils/constant.ts");

const { signSetAttributes, signAccount } = require("./signature.ts");

export const setAttributes = async (
  account: SignerWithAddress,
  issuer: SignerWithAddress,
  passport: Contract,
  attributes: any,
  verifiedAt: number,
  issuedAt: number,
  fee: any,
  tokenId: number = TOKEN_ID,
  blockId: number = HARDHAT_CHAIN_ID
) => {
  const attrKeys: string[] = [];
  const attrTypes: string[] = [];
  const attrValues: string[] = [];

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
          [account.address, k]
        )
      );
    }
    attrKeys.push(attrKey);
    attrValues.push(attributes[k]);
    attrTypes.push(k);
  });

  const sigIssuer = await signSetAttributes(
    account,
    issuer,
    attributes,
    verifiedAt,
    issuedAt,
    fee,
    blockId,
    tokenId
  );

  const sigAccount = await signAccount(account);

  await expect(
    passport
      .connect(account)
      .setAttributes(
        [attrKeys, attrValues, attrTypes, tokenId, verifiedAt, issuedAt, fee],
        sigIssuer,
        sigAccount,
        {
          value: fee,
        }
      )
  )
    .to.emit(passport, "SetAttributeReceipt")
    .withArgs(account.address, issuer.address, fee);
};
