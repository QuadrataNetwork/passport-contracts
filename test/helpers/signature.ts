import { keccak256 } from "ethers/lib/utils";

const { ethers } = require("hardhat");
const { Signer, DataHexString } = require("ethers");

const { DIGEST_TO_SIGN, HARDHAT_CHAIN_ID } = require("../../utils/constant.ts");

const DEFAULT_TOKEN_ID = 1;

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
  const sig = await signer.signMessage(DIGEST_TO_SIGN);
  return sig;
};

export const signSetAttributes = async (
  account: typeof Signer,
  issuer: typeof Signer,
  attributes: any,
  verifiedAt: number,
  issuedAt: number,
  fee: any,
  did: string,
  passportAddress: string,
  chainId: number = HARDHAT_CHAIN_ID,
  tokenId: number = DEFAULT_TOKEN_ID
): Promise<typeof DataHexString> => {
  const attrTypes: string[] = [];
  const attrValues: string[] = [];

  Object.keys(attributes).forEach((k, i) => {
    attrValues.push(attributes[k]);
    attrTypes.push(k);
  });

  const hash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      [
        "address",
        "bytes32[]",
        "bytes32[]",
        "bytes32",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "address",
      ],
      [
        account.address,
        attrTypes,
        attrValues,
        did,
        verifiedAt,
        issuedAt,
        fee,
        tokenId,
        chainId,
        passportAddress,
      ]
    )
  );

  const sig = await issuer.signMessage(ethers.utils.arrayify(hash));

  return sig;
};

export const hash = async (msg: string): Promise<typeof DataHexString> => {
  return ethers.utils.id(msg.toLowerCase());
};
