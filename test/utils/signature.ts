import { utils } from "ethers";
import { keccak256, RLP } from "ethers/lib/utils";

const { ethers } = require("hardhat");
const { Signer, DataHexString } = require("ethers");

export const signMessage = async (
  signer: typeof Signer,
  message: typeof DataHexString,
): Promise<typeof DataHexString> => {
  const hash = ethers.utils.keccak256(message);
  const sig = await signer.signMessage(ethers.utils.arrayify(hash));
  return sig;
};

export const signMint = async (
  issuer: typeof Signer,
  minter: typeof Signer,
  tokenId: number,
  quadDID: typeof DataHexString,
  aml: typeof DataHexString,
  country: typeof DataHexString,
  isBusiness: typeof DataHexString,
  issuedAt: number
): Promise<typeof DataHexString> => {
  const hash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256", "bytes32", "bytes32", "bytes32", "bytes32", "uint256"],
      [minter.address, tokenId, quadDID, aml, country, isBusiness, issuedAt]
    )
  );
  const sig = await issuer.signMessage(ethers.utils.arrayify(hash));

  return sig;
};

export const signSetAttribute = async (
  issuer: typeof Signer,
  account: typeof Signer,
  tokenId: number,
  attribute: typeof DataHexString,
  attributeValue: typeof DataHexString,
  issuedAt: number
): Promise<typeof DataHexString> => {
  const hash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256", "bytes32", "bytes32", "uint256"],
      [account.address, tokenId, attribute, attributeValue, issuedAt]
    )
  );
  const sig = await issuer.signMessage(ethers.utils.arrayify(hash));

  return sig;
};

export const hash = async (msg: string): Promise<typeof DataHexString> => {
  return ethers.utils.id(msg.toLowerCase());
};
