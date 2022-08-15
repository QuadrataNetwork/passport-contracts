import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";

export const getAttributes = async (
  account: SignerWithAddress,
  reader: Contract,
  attribute: string
) => {
  const attributes = await reader.getAttributes(account.address, attribute);

  return attributes;
};
