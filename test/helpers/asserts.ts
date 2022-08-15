import { ethers } from "hardhat";
import { Contract } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { TOKEN_ID } = require("../../utils/constant.ts");

export const assertSetAttribute = async (
  account: SignerWithAddress,
  issuers: SignerWithAddress[],
  passport: Contract,
  attributes: any[],
  verifiedAt: number[],
  fee: any[],
  mockReader: SignerWithAddress,
  tokenId: number = TOKEN_ID
) => {
  // Safety Check
  expect(issuers.length).to.equal(attributes.length);
  expect(issuers.length).to.equal(verifiedAt.length);
  expect(issuers.length).to.equal(fee.length);

  const initialBalance = await ethers.provider.getBalance(passport.address);
  const attrTypeCounter: any = {};
  const totalFee: any = ethers.utils.parseEther("0");

  for (let i = 0; i < issuers.length; i++) {
    Object.keys(attributes[i]).forEach((attrType) => {
      attrTypeCounter[attrType] = ++attrTypeCounter[attrType] || 1;
    });

    totalFee.add(fee[i]);
  }

  Object.keys(attributes[i]).forEach(async (attrType) => {
    const response = await passport
      .connect(mockReader)
      .attributes(account.address, attrType);

    expect(response.length).equals(attrTypeCounter[attrType]);

    console.log({ response });

    for (let i = 0; i < response.length; i++) {
      const attrResp = response[i];
      expect(attrResp[i].value).equals(attributes[i][attrType]);
      expect(attrResp[i].issuer).equals(issuers[i].address);
      expect(attrResp[i].epoch).equals(verifiedAt[i]);
    }
  });

  expect(await passport.balanceOf(account.address, TOKEN_ID)).to.equal(1);
  expect(await ethers.provider.getBalance(passport.address)).to.equal(
    initialBalance.add(totalFee)
  );
};
