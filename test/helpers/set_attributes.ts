import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  ATTRIBUTE_DID,
  TOKEN_ID,
  HARDHAT_CHAIN_ID,
} = require("../../utils/constant.ts");

const { signSetAttributes, signAccount } = require("./signature.ts");

export const setAttributes = async (
  account: SignerWithAddress,
  issuer: SignerWithAddress,
  passport: Contract,
  attributesToSet: any,
  verifiedAt: number,
  issuedAt: number,
  fee: any,
  tokenId: number = TOKEN_ID,
  chainId: number = HARDHAT_CHAIN_ID,
  opts: any = {}
) => {
  // Deep Copy to avoid mutating the object
  const attributes = Object.assign({}, attributesToSet);
  const attrKeys: string[] = [];
  const attrTypes: string[] = [];

  const attrValues: string[] = [];
  const did =
    ATTRIBUTE_DID in attributes
      ? attributes[ATTRIBUTE_DID]
      : ethers.constants.HashZero;

  Object.keys(attributes).forEach((k, i) => {
    if (opts.attemptUpdateDid || k !== ATTRIBUTE_DID) {
      attrValues.push(attributes[k]);
      attrTypes.push(k);
    }
  });

  if (!opts.attemptUpdateDid) {
    delete attributes[ATTRIBUTE_DID];
  }

  const sigIssuer = await signSetAttributes(
    account,
    issuer,
    attributes,
    verifiedAt,
    issuedAt,
    fee,
    opts.oldDid || did,
    passport.address,
    chainId,
    tokenId
  );

  const sigAccount = await signAccount(account);
  await expect(
    passport
      .connect(account)
      .setAttributes(
        [
          attrKeys,
          attrValues,
          attrTypes,
          opts.oldDid || did,
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
  )
    .to.emit(passport, "SetAttributeReceipt")
    .withArgs(account.address, issuer.address, fee);
};
