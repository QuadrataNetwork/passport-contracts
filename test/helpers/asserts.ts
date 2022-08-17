import { ethers } from "hardhat";
import { Contract } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { parseEther } from "ethers/lib/utils";

const {
  ATTRIBUTE_DID,
  ISSUER_SPLIT,
  QUAD_DID,
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
  tokenId: number = TOKEN_ID,
  did: string = QUAD_DID
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

    // Assert DID
    const response = await passport
      .connect(mockReader)
      .attributes(account.address, ATTRIBUTE_DID);
    expect(response.length).equals(issuers.length);
    for (let j = 0; j < response.length; j++) {
      const attrResp = response[j];
      expect(attrResp.value).equals(QUAD_DID);
      expect(attrResp.issuer).equals(issuers[j].address);
      expect(attrResp.epoch).equals(verifiedAt[j]);
    }
  }

  expect(await passport.balanceOf(account.address, TOKEN_ID)).to.equal(1);
  expect(await ethers.provider.getBalance(passport.address)).to.equal(totalFee);
};

export const assertGetAttributes = async (
  account: SignerWithAddress,
  attributeToQuery: string,
  reader: Contract,
  defi: Contract,
  treasury: SignerWithAddress,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[],
  isBusiness: boolean = false
) => {
  await assertGetAttributesEvents(
    account,
    attributeToQuery,
    reader,
    treasury,
    expectedIssuers,
    expectedAttributes,
    expectedVerifiedAt,
    isBusiness
  );
  await assertGetAttributesThroughContract(
    account,
    attributeToQuery,
    reader,
    defi,
    expectedIssuers,
    expectedAttributes,
    expectedVerifiedAt,
    isBusiness
  );
  await assertGetAttributesStatic(
    account,
    reader,
    expectedIssuers,
    expectedAttributes,
    expectedVerifiedAt
  );
};

export const assertGetAttributesStatic = async (
  account: SignerWithAddress,
  reader: Contract,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[],
  isBusiness: boolean = false
) => {
  // Safety Check
  expect(expectedIssuers.length).to.equal(expectedAttributes.length);
  expect(expectedIssuers.length).to.equal(expectedVerifiedAt.length);

  const attrTypeCounter: any = {};

  for (let i = 0; i < expectedIssuers.length; i++) {
    Object.keys(expectedAttributes[i]).forEach((attrType) => {
      attrTypeCounter[attrType] = ++attrTypeCounter[attrType] || 1;
    });
  }

  for (let i = 0; i < expectedIssuers.length; i++) {
    Object.keys(expectedAttributes[i]).forEach(async (attrType) => {
      let queryFee: any;
      if (isBusiness) {
        queryFee = PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attrType];
      } else {
        queryFee = PRICE_PER_ATTRIBUTES_ETH[attrType];
      }

      // Verify return value with callStatic
      const staticResp = await reader.callStatic.getAttributes(
        account.address,
        attrType,
        { value: queryFee }
      );
      expect(staticResp.length).equals(expectedIssuers.length);
      for (let j = 0; j < staticResp.length; j++) {
        const attrResp = staticResp[j];
        expect(attrResp.value).equals(expectedAttributes[j][attrType]);
        expect(attrResp.issuer).equals(expectedIssuers[j].address);
        expect(attrResp.epoch).equals(expectedVerifiedAt[j]);
      }
    });
  }
};

export const assertGetAttributesEvents = async (
  account: SignerWithAddress,
  attributeToQuery: string,
  reader: Contract,
  treasury: SignerWithAddress,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[],
  isBusiness: boolean = false
) => {
  // Safety Check
  expect(expectedIssuers.length).to.equal(expectedIssuers.length);
  expect(expectedIssuers.length).to.equal(expectedVerifiedAt.length);

  const initialBalance = await ethers.provider.getBalance(reader.address);

  const availableAttributesByTypes: any = {};

  for (let i = 0; i < expectedAttributes.length; i++) {
    Object.keys(expectedAttributes[i]).forEach((attrType) => {
      if (availableAttributesByTypes[attrType]) {
        availableAttributesByTypes[attrType].push(
          expectedAttributes[i][attrType]
        );
      } else {
        availableAttributesByTypes[attrType] = [
          expectedAttributes[i][attrType],
        ];
      }
    });
  }

  let queryFee: any;
  if (isBusiness) {
    queryFee = PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attributeToQuery];
  } else {
    queryFee = PRICE_PER_ATTRIBUTES_ETH[attributeToQuery];
  }

  const tx = await reader
    .connect(account)
    .getAttributes(account.address, attributeToQuery, {
      value: queryFee,
    });

  const receipt = await tx.wait();

  if (queryFee.eq(0)) {
    expect(receipt.events.length).to.equal(1);
    expect(receipt.events[0].event).to.equal("QueryEvent");
    expect(receipt.events[0].args[0]).to.equal(account.address);
    expect(receipt.events[0].args[1]).to.equal(account.address);
    expect(receipt.events[0].args[2]).to.equal(attributeToQuery);
  } else {
    let feeIssuer = parseEther("0");
    const numberOfAttrs =
      attributeToQuery in availableAttributesByTypes
        ? availableAttributesByTypes[attributeToQuery].length
        : 0;
    if (numberOfAttrs !== 0) {
      feeIssuer = queryFee.mul(ISSUER_SPLIT).div(100).div(numberOfAttrs);
    }
    expect(receipt.events.length).to.equal(numberOfAttrs + 2);
    for (let i = 0; i < numberOfAttrs; i++) {
      const event = receipt.events[i];
      expect(event.event).to.equal("QueryFeeReceipt");
      expect(event.args[0]).to.equal(expectedIssuers[i].address);
      expect(event.args[1]).to.equal(feeIssuer);
    }

    expect(receipt.events[numberOfAttrs].event).to.equal("QueryFeeReceipt");
    expect(receipt.events[numberOfAttrs].args[0]).to.equal(treasury.address);
    expect(receipt.events[numberOfAttrs].args[1]).to.equal(
      queryFee.sub(feeIssuer.mul(numberOfAttrs))
    );

    expect(receipt.events[numberOfAttrs + 1].event).to.equal("QueryEvent");
    expect(receipt.events[numberOfAttrs + 1].args[0]).to.equal(account.address);
    expect(receipt.events[numberOfAttrs + 1].args[1]).to.equal(account.address);
    expect(receipt.events[numberOfAttrs + 1].args[2]).to.equal(
      attributeToQuery
    );
  }

  expect(await ethers.provider.getBalance(reader.address)).to.equal(
    initialBalance.add(queryFee)
  );
};

export const assertGetAttributesThroughContract = async (
  account: SignerWithAddress,
  attributeToQuery: string,
  reader: Contract,
  defi: Contract,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[],
  isBusiness: boolean = false
) => {
  // Safety Check
  expect(expectedIssuers.length).to.equal(expectedAttributes.length);
  expect(expectedIssuers.length).to.equal(expectedVerifiedAt.length);

  const availableAttributesByTypes: any = {};

  for (let i = 0; i < expectedAttributes.length; i++) {
    Object.keys(expectedAttributes[i]).forEach((attrType) => {
      if (availableAttributesByTypes[attrType]) {
        availableAttributesByTypes[attrType].push(
          expectedAttributes[i][attrType]
        );
      } else {
        availableAttributesByTypes[attrType] = [
          expectedAttributes[i][attrType],
        ];
      }
    });
  }
  const initialBalance = await ethers.provider.getBalance(reader.address);

  let queryFee: any;
  if (isBusiness) {
    queryFee = PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attributeToQuery];
  } else {
    queryFee = PRICE_PER_ATTRIBUTES_ETH[attributeToQuery];
  }

  const tx = await defi.deposit(account.address, attributeToQuery, {
    value: queryFee,
  });

  const matchingAttributes =
    attributeToQuery in availableAttributesByTypes
      ? availableAttributesByTypes[attributeToQuery]
      : [];

  await expect(tx)
    .to.emit(defi, "GetAttributesEvent")
    .withArgs(
      matchingAttributes,
      expectedVerifiedAt,
      expectedIssuers.map((i) => i.address)
    );

  expect(await ethers.provider.getBalance(reader.address)).to.equal(
    initialBalance.add(queryFee)
  );
};
