const { ethers } = require("hardhat");
const { Signer, DataHexString } = require("ethers");

export const signMint = async (
  issuer: typeof Signer,
  minter: typeof Signer,
  tokenId: number,
  quadDID: typeof DataHexString,
  aml: typeof DataHexString,
  country: typeof DataHexString,
  issuedAt: number
): Promise<typeof DataHexString> => {
  const hash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256", "bytes32", "bytes32", "bytes32", "uint256"],
      [minter.address, tokenId, quadDID, aml, country, issuedAt]
    )
  );
  const sig = await issuer.signMessage(ethers.utils.arrayify(hash));

  return sig;
};

export const hash = async (msg: string): Promise<typeof DataHexString> => {
  return ethers.utils.id(msg.toLowerCase());
};
