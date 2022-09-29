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
  for(let index = 0; index < attributesList.length; index++){
    const attributes: any = attributesList[index];
    const attrKeys: string[] = [];
    const attrTypes: string[] = [];
    const attrValues: string[] = [];
    const did =
      ATTRIBUTE_DID in attributes
        ? attributes[ATTRIBUTE_DID]
        : ethers.constants.HashZero;

    Object.keys(attributes).forEach((k, i) => {
      let attrKey;
      if (k === ATTRIBUTE_AML) {
        expect(ATTRIBUTE_DID in attributes).to.equal(true);
        attrKey = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(["bytes32", "bytes32"], [opts.oldDid || did, k])
        );
      } else {
        attrKey = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["address", "bytes32"],
            [account.address, k]
          )
        );
      }
      if (opts.attemptUpdateDid || k !== ATTRIBUTE_DID) {
        attrKeys.push(attrKey);
        attrValues.push(attributes[k]);
        attrTypes.push(k);
      }
    });
    if(!opts.attemptUpdateDid) {
      delete attributes[ATTRIBUTE_DID];
    }
    const sigIssuer = await signSetAttributes(
      account,
      issuers[index],
      attributesList[index],
      verifiedAts[index],
      issuedAts[index],
      fees[index],
      opts.oldDid || did,
      passport.address,
      chainIds[index]
    );
    const sigAccount = await signAccount(account);
    bulkConfig.push([attrKeys, attrValues, attrTypes, (opts.oldDid || did), tokenIds[index], verifiedAts[index], issuedAts[index], parseInt(fees[index])])
    bulkSigIssuer.push(sigIssuer)
    bulkSigAccount.push(sigAccount)
  }
  await expect(
    passport
      .connect(account)
      .setAttributesBulk(
        bulkConfig,
        bulkSigIssuer,
        bulkSigAccount,
        {
          value: fees.reduce((total: number, eachFee: string) => total += parseInt(eachFee), 0),
        }
      )
  )
    .to.emit(passport, "SetAttributeReceipt")
};
