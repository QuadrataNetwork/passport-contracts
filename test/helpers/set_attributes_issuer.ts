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

const { signSetAttributes } = require("./signature.ts");

export const setAttributesIssuer = async (
  account: SignerWithAddress,
  issuer: SignerWithAddress,
  passport: Contract,
  attributesToSet: any,
  verifiedAt: number,
  issuedAt: number,
  tokenId: number = TOKEN_ID,
  chainId: number = HARDHAT_CHAIN_ID
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

  const fee = ethers.utils.parseEther("0");

  Object.keys(attributes).forEach((k, i) => {
    let attrKey;
    if (k === ATTRIBUTE_AML) {
      expect(ATTRIBUTE_DID in attributes).to.equal(true);
      attrKey = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["bytes32", "bytes32"], [did, k])
      );
    } else {
      attrKey = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "bytes32"],
          [account.address, k]
        )
      );
    }
    if (k !== ATTRIBUTE_DID) {
      attrKeys.push(attrKey);
      attrValues.push(attributes[k]);
      attrTypes.push(k);
    }
  });

  delete attributes[ATTRIBUTE_DID];

  const sigIssuer = await signSetAttributes(
    account,
    issuer,
    attributes,
    verifiedAt,
    issuedAt,
    fee,
    did,
    passport.address,
    chainId
  );

  await expect(
    passport
      .connect(issuer)
      .setAttributesIssuer(
        account.address,
        [
          attrKeys,
          attrValues,
          attrTypes,
          did,
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
  )
    .to.emit(passport, "SetAttributeReceipt")
    .withArgs(account.address, issuer.address, fee);
};
