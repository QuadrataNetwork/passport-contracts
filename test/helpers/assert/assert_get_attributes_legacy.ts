import { ethers } from "hardhat";
import { Contract, BigNumber } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { parseEther } from "ethers/lib/utils";

const { ISSUER_SPLIT } = require("../../../utils/constant.ts");

export const assertGetAttributesLegacy = async (
  account: SignerWithAddress,
  attributeToQuery: string,
  reader: Contract,
  defi: Contract,
  treasury: SignerWithAddress,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[]
) => {
  await assertGetAttributesEventsLegacy(
    account,
    attributeToQuery,
    reader,
    treasury,
    expectedIssuers,
    expectedAttributes,
    expectedVerifiedAt
  );
  await assertGetAttributesLegacyThroughContract(
    account,
    attributeToQuery,
    reader,
    defi,
    expectedIssuers,
    expectedAttributes,
    expectedVerifiedAt
  );
  await assertGetAttributesLegacyStatic(
    account,
    attributeToQuery,
    reader,
    expectedIssuers,
    expectedAttributes,
    expectedVerifiedAt
  );
};

export const assertGetAttributesLegacyStatic = async (
  account: SignerWithAddress,
  attributeToQuery: string,
  reader: Contract,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[]
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

  const queryFee = await reader.callStatic.queryFee(
    account.address,
    attributeToQuery
  );
  // Verify return value with callStatic
  const staticResp = await reader.callStatic.getAttributesLegacy(
    account.address,
    attributeToQuery,
    { value: queryFee }
  );
  const matchingAttributes =
    attributeToQuery in availableAttributesByTypes
      ? availableAttributesByTypes[attributeToQuery]
      : [];

  expect(staticResp.length).equals(3);
  expect(staticResp[0]).to.eql(matchingAttributes);
  expect(staticResp[1]).to.eql(
    expectedVerifiedAt.map((i) => BigNumber.from(i))
  );
  expect(staticResp[2]).to.eql(expectedIssuers.map((i) => i.address));
};

export const assertGetAttributesEventsLegacy = async (
  account: SignerWithAddress,
  attributeToQuery: string,
  reader: Contract,
  treasury: SignerWithAddress,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[]
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

  const queryFee = await reader.callStatic.queryFee(
    account.address,
    attributeToQuery
  );

  const tx = await reader
    .connect(treasury)
    .getAttributesLegacy(account.address, attributeToQuery, {
      value: queryFee,
    });

  const receipt = await tx.wait();

  if (queryFee.eq(0)) {
    expect(receipt.events.length).to.equal(1);
    expect(receipt.events[0].event).to.equal("QueryEvent");
    expect(receipt.events[0].args[0]).to.equal(account.address);
    expect(receipt.events[0].args[1]).to.equal(treasury.address);
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
    expect(receipt.events[numberOfAttrs + 1].args[1]).to.equal(
      treasury.address
    );
    expect(receipt.events[numberOfAttrs + 1].args[2]).to.equal(
      attributeToQuery
    );
  }

  const matchingAttributes =
    attributeToQuery in availableAttributesByTypes
      ? availableAttributesByTypes[attributeToQuery]
      : [];

  expect(await reader.balanceOf(account.address, attributeToQuery)).to.equal(
    matchingAttributes.length
  );

  expect(await ethers.provider.getBalance(reader.address)).to.equal(
    initialBalance.add(queryFee)
  );
};

export const assertGetAttributesLegacyThroughContract = async (
  account: SignerWithAddress,
  attributeToQuery: string,
  reader: Contract,
  defi: Contract,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[]
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

  const queryFee = await reader.callStatic.queryFee(
    account.address,
    attributeToQuery
  );
  const tx = await defi.depositLegacy(account.address, attributeToQuery, {
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

  expect(await reader.balanceOf(account.address, attributeToQuery)).to.equal(
    matchingAttributes.length
  );
};
