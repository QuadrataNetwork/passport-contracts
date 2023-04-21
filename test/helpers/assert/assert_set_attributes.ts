import { ethers } from "hardhat";
import { Contract } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { parseEther } from "ethers/lib/utils";

const { resolvePromisesSeq } = require("../resolve_promises.ts");

const { TOKEN_ID } = require("../../../utils/constant.ts");

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

  const attrTypeCounter: any = {};
  let totalFee: any = parseEther("0");

  for (let i = 0; i < issuers.length; i++) {
    Object.keys(attributes[i]).forEach((attrType) => {
      attrTypeCounter[attrType] = ++attrTypeCounter[attrType] || 1;
    });

    totalFee = totalFee.add(fee[i]);
  }

  let respPromises: any[];
  let respResult: any[];

  for (let i = 0; i < issuers.length; i++) {
    respPromises = [];
    Object.keys(attributes[i]).forEach(async (attrType) => {
      respPromises.push(
        passport.connect(mockReader).attributes(account.address, attrType)
      );
    });
    respResult = await resolvePromisesSeq(respPromises);

    let k = 0;
    Object.keys(attributes[i]).forEach((attrType) => {
      expect(respResult[k].length).equals(attrTypeCounter[attrType]);
      for (let j = 0; j < respResult[k].length; j++) {
        const attrResp = respResult[k][j];
        expect(attrResp.value).equals(attributes[j][attrType]);
        expect(attrResp.issuer).equals(issuers[j].address);
        expect(attrResp.epoch).to.equal(verifiedAt[j]);
      }
      k += 1;
    });
  }

  expect(await passport.balanceOf(account.address, tokenId)).to.equal(1);
  expect(await ethers.provider.getBalance(passport.address)).to.equal(totalFee);
};
