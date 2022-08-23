import { ethers } from "hardhat";
import { Contract } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { parseEther } from "ethers/lib/utils";

const { ISSUER_SPLIT } = require("../../../utils/constant.ts");

export const assertGetAttributesBulk = async (
  account: SignerWithAddress,
  attributesToQuery: string[],
  reader: Contract,
  defi: Contract,
  treasury: SignerWithAddress,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[]
) => {
  await assertGetAttributesBulkEvents(
    account,
    attributesToQuery,
    reader,
    treasury,
    expectedIssuers,
    expectedAttributes,
    expectedVerifiedAt
  );
  await assertGetAttributesBulkThroughContract(
    account,
    attributesToQuery,
    reader,
    defi,
    expectedIssuers,
    expectedAttributes,
    expectedVerifiedAt
  );
  await assertGetAttributesBulkStatic(
    account,
    attributesToQuery,
    reader,
    expectedIssuers,
    expectedAttributes,
    expectedVerifiedAt
  );
};

export const assertGetAttributesBulkStatic = async (
  account: SignerWithAddress,
  attributesToQuery: string[],
  reader: Contract,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[]
) => {
  // Safety Check
  expect(expectedIssuers.length).to.equal(expectedAttributes.length);
  expect(expectedIssuers.length).to.equal(expectedVerifiedAt.length);

  const queryFee = await reader.queryFeeBulk(
    account.address,
    attributesToQuery
  );
  const matchingAttributes: string[] = [];
  const matchingIssuers: string[] = [];
  const matchingEpochs: any[] = [];

  attributesToQuery.forEach((attrType) => {
    let attributeFound = false;

    for (let i = 0; i < expectedAttributes.length; i++) {
      if (attrType in expectedAttributes[i]) {
        matchingAttributes.push(expectedAttributes[i][attrType]);
        matchingIssuers.push(expectedIssuers[i].address);
        matchingEpochs.push(expectedVerifiedAt[i]);
        attributeFound = true;
        break;
      }
    }

    if (!attributeFound) {
      matchingAttributes.push(ethers.constants.HashZero);
      matchingIssuers.push(ethers.constants.AddressZero);
      matchingEpochs.push(ethers.constants.Zero);
    }
  });

  // Verify return value with callStatic
  const staticResp = await reader.callStatic.getAttributesBulk(
    account.address,
    attributesToQuery,
    { value: queryFee }
  );

  expect(staticResp.length).equals(attributesToQuery.length);
  for (let j = 0; j < staticResp.length; j++) {
    const attrResp = staticResp[j];
    expect(attrResp.value).equals(matchingAttributes[j]);
    expect(attrResp.issuer).equals(matchingIssuers[j]);
    expect(attrResp.epoch).equals(matchingEpochs[j]);
  }
};

export const assertGetAttributesBulkEvents = async (
  account: SignerWithAddress,
  attributesToQuery: string[],
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

  // Safety Check
  expect(expectedIssuers.length).to.equal(expectedAttributes.length);
  expect(expectedIssuers.length).to.equal(expectedVerifiedAt.length);

  const queryFee = await reader.queryFeeBulk(
    account.address,
    attributesToQuery
  );
  const matchingAttributeTypes: string[] = [];
  const matchingIssuers: string[] = [];

  let counterResponse = 0;

  attributesToQuery.forEach((attrType) => {
    for (let i = 0; i < expectedAttributes.length; i++) {
      if (attrType in expectedAttributes[i]) {
        counterResponse += 1;
        matchingAttributeTypes.push(attrType);
        matchingIssuers.push(expectedIssuers[i].address);
        break;
      }
    }
  });

  const tx = await reader
    .connect(treasury)
    .getAttributesBulk(account.address, attributesToQuery, {
      value: queryFee,
    });

  const receipt = await tx.wait();
  let totalFeeIssuer = parseEther("0");

  if (queryFee.eq(0)) {
    expect(receipt.events.length).to.equal(1);
    expect(receipt.events[0].event).to.equal("QueryBulkEvent");
    expect(receipt.events[0].args[0]).to.equal(account.address);
    expect(receipt.events[0].args[1]).to.equal(treasury.address);
    expect(receipt.events[0].args[2]).to.eql(attributesToQuery);
  } else {
    expect(receipt.events.length).to.equal(counterResponse + 2);

    for (let i = 0; i < counterResponse; i++) {
      const singleAttrFee = await reader.queryFee(
        account.address,
        matchingAttributeTypes[i]
      );
      const feeIssuer = singleAttrFee.mul(ISSUER_SPLIT).div(100);
      totalFeeIssuer = totalFeeIssuer.add(feeIssuer);

      const event = receipt.events[i];
      expect(event.event).to.equal("QueryFeeReceipt");
      expect(event.args[0]).to.equal(matchingIssuers[i]);
      expect(event.args[1]).to.equal(feeIssuer);
    }

    expect(receipt.events[counterResponse].event).to.equal("QueryFeeReceipt");
    expect(receipt.events[counterResponse].args[0]).to.equal(treasury.address);
    expect(receipt.events[counterResponse].args[1]).to.equal(
      queryFee.sub(totalFeeIssuer)
    );

    expect(receipt.events[counterResponse + 1].event).to.equal(
      "QueryBulkEvent"
    );
    expect(receipt.events[counterResponse + 1].args[0]).to.equal(
      account.address
    );
    expect(receipt.events[counterResponse + 1].args[1]).to.equal(
      treasury.address
    );
    expect(receipt.events[counterResponse + 1].args[2]).to.eql(
      attributesToQuery
    );
  }

  expect(await ethers.provider.getBalance(reader.address)).to.equal(
    initialBalance.add(queryFee)
  );
};

export const assertGetAttributesBulkThroughContract = async (
  account: SignerWithAddress,
  attributesToQuery: string[],
  reader: Contract,
  defi: Contract,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[]
) => {
  // Safety Check
  expect(expectedIssuers.length).to.equal(expectedAttributes.length);
  expect(expectedIssuers.length).to.equal(expectedVerifiedAt.length);

  const queryFee = await reader.queryFeeBulk(
    account.address,
    attributesToQuery
  );
  const matchingAttributes: string[] = [];
  const matchingIssuers: string[] = [];
  const matchingEpochs: any[] = [];

  attributesToQuery.forEach((attrType) => {
    let attributeFound = false;

    for (let i = 0; i < expectedAttributes.length; i++) {
      if (attrType in expectedAttributes[i]) {
        matchingAttributes.push(expectedAttributes[i][attrType]);
        matchingIssuers.push(expectedIssuers[i].address);
        matchingEpochs.push(expectedVerifiedAt[i]);
        attributeFound = true;
        break;
      }
    }

    if (!attributeFound) {
      matchingAttributes.push(ethers.constants.HashZero);
      matchingIssuers.push(ethers.constants.AddressZero);
      matchingEpochs.push(ethers.constants.Zero);
    }
  });

  const initialBalance = await ethers.provider.getBalance(reader.address);

  const tx = await defi.depositBulk(account.address, attributesToQuery, {
    value: queryFee,
  });

  await expect(tx)
    .to.emit(defi, "GetAttributesBulkEvent")
    .withArgs(matchingAttributes, matchingEpochs, matchingIssuers);

  expect(await ethers.provider.getBalance(reader.address)).to.equal(
    initialBalance.add(queryFee)
  );
};
