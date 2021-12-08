import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";

const { signSetAttribute } = require("./signature.ts");
const { TOKEN_ID, PRICE_SET_ATTRIBUTE } = require("../../utils/constant.ts");

export const setAttribute = async (
  account: SignerWithAddress,
  issuer: SignerWithAddress,
  passport: Contract,
  attribute: string,
  attributeValue: string,
  issuedAt: number
) => {
  const sig = await signSetAttribute(
    issuer,
    account,
    TOKEN_ID,
    attribute,
    attributeValue,
    issuedAt
  );
  await passport
    .connect(account)
    .setAttribute(TOKEN_ID, attribute, attributeValue, issuedAt, sig, {
      value: PRICE_SET_ATTRIBUTE[attribute],
    });
};
