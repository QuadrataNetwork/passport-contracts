import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { ATTRIBUTE_DID, ATTRIBUTE_AML } = require("../../utils/constant.ts");

const { signSetAttributes, signAccount } = require("./signature.ts");

export const setAttributesBulk = async (
  passport: Contract,
  account: SignerWithAddress,
  issuers: SignerWithAddress[],
  attributesToSet: any,
  verifiedAts: number[],
  issuedAts: number[],
  fees: any,
  tokenIds: number[],
  chainIds: number[],
  opts: any = {}
) => {
  const bulkConfig: any[] = [];
  const bulkSigIssuer: any[] = [];
  const bulkSigAccount: any[] = [];

  // Deep Copy to avoid mutating the object
  const attributesList = Object.assign([], attributesToSet);
  for (let index = 0; index < attributesList.length; index++) {
    // Deep Copy to avoid mutating the object
    const attributes: any = Object.assign({}, attributesList[index]);
    const attrKeys: string[] = [];
    const attrTypes: string[] = [];
    const attrValues: string[] = [];
    const did =
      ATTRIBUTE_DID in attributes
        ? attributes[ATTRIBUTE_DID]
        : ethers.constants.HashZero;

    Object.keys(attributes).forEach((k, i) => {
      if (k === ATTRIBUTE_AML) {
        expect(ATTRIBUTE_DID in attributes).to.equal(true);
      }
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
      issuers[index],
      attributes,
      verifiedAts[index],
      issuedAts[index],
      fees[index],
      opts.oldDid || did,
      passport.address,
      chainIds[index]
    );
    const sigAccount = await signAccount(account);
    bulkConfig.push([
      attrKeys,
      attrValues,
      attrTypes,
      opts.oldDid || did,
      tokenIds[index],
      verifiedAts[index],
      issuedAts[index],
      parseInt(fees[index]),
    ]);
    bulkSigIssuer.push(sigIssuer);
    bulkSigAccount.push(sigAccount);
  }
  await expect(
    passport
      .connect(account)
      .setAttributesBulk(bulkConfig, bulkSigIssuer, bulkSigAccount, {
        value: fees.reduce(
          (total: number, eachFee: string) => (total += parseInt(eachFee)),
          0
        ),
      })
  ).to.emit(passport, "SetAttributeReceipt");
};
