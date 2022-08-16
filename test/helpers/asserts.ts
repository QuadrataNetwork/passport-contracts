import { ethers } from "hardhat";
import { Contract } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_COUNTRY,
  TOKEN_ID,
  PRICE_PER_BUSINESS_ATTRIBUTES_ETH,
  PRICE_PER_ATTRIBUTES_ETH,
} = require("../../utils/constant.ts");

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
  let totalFee: any = ethers.utils.parseEther("0");

  for (let i = 0; i < issuers.length; i++) {
    Object.keys(attributes[i]).forEach((attrType) => {
      attrTypeCounter[attrType] = ++attrTypeCounter[attrType] || 1;
    });

    totalFee = totalFee.add(fee[i]);
  }

  for (let i = 0; i < issuers.length; i++) {
    Object.keys(attributes[i]).forEach(async (attrType) => {
      const response = await passport
        .connect(mockReader)
        .attributes(account.address, attrType);

      expect(response.length).equals(attrTypeCounter[attrType]);

      for (let j = 0; j < response.length; j++) {
        const attrResp = response[j];
        expect(attrResp.value).equals(attributes[j][attrType]);
        expect(attrResp.issuer).equals(issuers[j].address);
        expect(attrResp.epoch).equals(verifiedAt[j]);
      }
    });
  }

  expect(await passport.balanceOf(account.address, TOKEN_ID)).to.equal(1);
  expect(await ethers.provider.getBalance(passport.address)).to.equal(totalFee);
};

export const assertGetAttributes = async (
  account: SignerWithAddress,
  issuers: SignerWithAddress[],
  reader: Contract,
  attributes: any[],
  verifiedAt: number[],
  isBusiness: boolean = false
) => {
  // Safety Check
  expect(issuers.length).to.equal(attributes.length);
  expect(issuers.length).to.equal(verifiedAt.length);

  const attrTypeCounter: any = {};
  let queryFee: any = ethers.utils.parseEther("0");

  for (let i = 0; i < issuers.length; i++) {
    Object.keys(attributes[i]).forEach((attrType) => {
      attrTypeCounter[attrType] = ++attrTypeCounter[attrType] || 1;
    });
  }

  for (let i = 0; i < issuers.length; i++) {
    Object.keys(attributes[i]).forEach(async (attrType) => {
      const initialBalance = await ethers.provider.getBalance(reader.address);
      const response = await reader.getAttributes(account.address, attrType);

      expect(response.length).equals(attrTypeCounter[attrType]);

      for (let j = 0; j < response.length; j++) {
        const attrResp = response[j];
        expect(attrResp.value).equals(attributes[j][attrType]);
        expect(attrResp.issuer).equals(issuers[j].address);
        expect(attrResp.epoch).equals(verifiedAt[j]);
      }

      // Check QuadReader balance
      if (isBusiness) {
        queryFee = PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attrType];
      } else {
        queryFee = PRICE_PER_ATTRIBUTES_ETH[attrType];
      }
      expect(await ethers.provider.getBalance(reader.address)).to.equal(
        initialBalance.add(queryFee)
      );
    });
  }

  // No issuers & no existing attestation for account
  if (issuers.length === 0) {
    Object.keys([
      ATTRIBUTE_DID,
      ATTRIBUTE_AML,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
    ]).forEach(async (attrType) => {
      const initialBalance = await ethers.provider.getBalance(reader.address);
      const response = await reader.getAttributes(account.address, attrType);

      expect(response.length).equals(0);

      expect(await ethers.provider.getBalance(reader.address)).to.equal(
        initialBalance
      );
    });
  }
};
