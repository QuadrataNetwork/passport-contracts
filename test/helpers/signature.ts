import { keccak256 } from "ethers/lib/utils";
import { id } from "ethers/lib/utils";

const { ethers } = require("hardhat");
const { Signer, DataHexString } = require("ethers");

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  TOKEN_ID,
  DIGEST_TO_SIGN,
  QUAD_DID,
} = require("../../utils/constant.ts");

export const signMessage = async (
  signer: typeof Signer,
  message: typeof DataHexString
): Promise<typeof DataHexString> => {
  const hash = keccak256(message);
  const sig = await signer.signMessage(ethers.utils.arrayify(hash));
  return sig;
};

export const signAccount = async (
  signer: typeof Signer
): Promise<typeof DataHexString> => {
  const digest = DIGEST_TO_SIGN;
  const sig = await signer.signMessage(ethers.utils.arrayify(digest));
  return sig;
};


export const signSetAttributes = async (
  account: typeof Signer,
  issuer: typeof Signer,
  attributes: any,
  verifiedAt: number,
  issuedAt: number,
  fee: any,
  blockId: number,
  tokenId: number = TOKEN_ID
): Promise<typeof DataHexString> => {
  let attrKeys: string[] = [];
  let attrValues: string[] = [];

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
          [account.address, k]
        )
      );
    }
    attrKeys.push(attrKey);
    attrValues.push(attributes[k]);
  });

  const hash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      [
        "address",
        "bytes32[]",
        "bytes32[]",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
      ],
      [
        account.address,
        attrKeys,
        attrValues,
        verifiedAt,
        issuedAt,
        fee,
        tokenId,
        blockId,
      ]
    )
  );

  const sig = await issuer.signMessage(ethers.utils.arrayify(hash));

  return sig;
};

export const hash = async (msg: string): Promise<typeof DataHexString> => {
  return ethers.utils.id(msg.toLowerCase());
};
