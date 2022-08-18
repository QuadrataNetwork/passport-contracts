import { ethers } from "hardhat";
import { Contract } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { parseEther } from "ethers/lib/utils";

const {
  ISSUER_SPLIT,
  PRICE_PER_BUSINESS_ATTRIBUTES_ETH,
  PRICE_PER_ATTRIBUTES_ETH,
} = require("../../../utils/constant.ts");

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
  // await assertGetAttributesBulkEvents(
  //   account,
  //   attributesToQuery,
  //   reader,
  //   treasury,
  //   expectedIssuers,
  //   expectedAttributes,
  //   expectedVerifiedAt,
  //   isBusiness
  // );
  // await assertGetAttributesBulkThroughContract(
  //   account,
  //   attributesToQuery,
  //   reader,
  //   defi,
  //   expectedIssuers,
  //   expectedAttributes,
  //   expectedVerifiedAt,
  //   isBusiness
  // );
  await assertGetAttributesBulkStatic(
    account,
    attributesToQuery,
    reader,
    expectedIssuers,
    expectedAttributes,
    expectedVerifiedAt,
    isBusiness
  );
};

export const assertGetAttributesBulkStatic = async (
  account: SignerWithAddress,
  attributesToQuery: string[],
  reader: Contract,
  expectedIssuers: SignerWithAddress[],
  expectedAttributes: any[],
  expectedVerifiedAt: number[],
  isBusiness: boolean = false
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

// export const assertGetAttributesBulkEvents = async (
//   account: SignerWithAddress,
//   attributesToQuery: string[],
//   reader: Contract,
//   treasury: SignerWithAddress,
//   expectedIssuers: SignerWithAddress[],
//   expectedAttributes: any[],
//   expectedVerifiedAt: number[],
//   isBusiness: boolean = false
// ) => {
//   // Safety Check
//   expect(expectedIssuers.length).to.equal(expectedIssuers.length);
//   expect(expectedIssuers.length).to.equal(expectedVerifiedAt.length);

//   const initialBalance = await ethers.provider.getBalance(reader.address);

//   const availableAttributesByTypes: any = {};

//   for (let i = 0; i < expectedAttributes.length; i++) {
//     Object.keys(expectedAttributes[i]).forEach((attrType) => {
//       if (availableAttributesByTypes[attrType]) {
//         availableAttributesByTypes[attrType].push(
//           expectedAttributes[i][attrType]
//         );
//       } else {
//         availableAttributesByTypes[attrType] = [
//           expectedAttributes[i][attrType],
//         ];
//       }
//     });
//   }

//   let queryFee: any;
//   if (isBusiness) {
//     queryFee = PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attributesToQuery];
//   } else {
//     queryFee = PRICE_PER_ATTRIBUTES_ETH[attributesToQuery];
//   }

//   const tx = await reader
//     .connect(treasury)
//     .getAttributesBulk(account.address, attributesToQuery, {
//       value: queryFee,
//     });

//   const receipt = await tx.wait();

//   if (queryFee.eq(0)) {
//     expect(receipt.events.length).to.equal(1);
//     expect(receipt.events[0].event).to.equal("QueryEvent");
//     expect(receipt.events[0].args[0]).to.equal(account.address);
//     expect(receipt.events[0].args[1]).to.equal(treasury.address);
//     expect(receipt.events[0].args[2]).to.equal(attributesToQuery);
//   } else {
//     let feeIssuer = parseEther("0");
//     const numberOfAttrs =
//       attributesToQuery in availableAttributesByTypes
//         ? availableAttributesByTypes[attributesToQuery].length
//         : 0;
//     if (numberOfAttrs !== 0) {
//       feeIssuer = queryFee.mul(ISSUER_SPLIT).div(100).div(numberOfAttrs);
//     }
//     expect(receipt.events.length).to.equal(numberOfAttrs + 2);
//     for (let i = 0; i < numberOfAttrs; i++) {
//       const event = receipt.events[i];
//       expect(event.event).to.equal("QueryFeeReceipt");
//       expect(event.args[0]).to.equal(expectedIssuers[i].address);
//       expect(event.args[1]).to.equal(feeIssuer);
//     }

//     expect(receipt.events[numberOfAttrs].event).to.equal("QueryFeeReceipt");
//     expect(receipt.events[numberOfAttrs].args[0]).to.equal(treasury.address);
//     expect(receipt.events[numberOfAttrs].args[1]).to.equal(
//       queryFee.sub(feeIssuer.mul(numberOfAttrs))
//     );

//     expect(receipt.events[numberOfAttrs + 1].event).to.equal("QueryEvent");
//     expect(receipt.events[numberOfAttrs + 1].args[0]).to.equal(account.address);
//     expect(receipt.events[numberOfAttrs + 1].args[1]).to.equal(
//       treasury.address
//     );
//     expect(receipt.events[numberOfAttrs + 1].args[2]).to.equal(
//       attributesToQuery
//     );
//   }

//   expect(await ethers.provider.getBalance(reader.address)).to.equal(
//     initialBalance.add(queryFee)
//   );
// };

// export const assertGetAttributesBulkThroughContract = async (
//   account: SignerWithAddress,
//   attributesToQuery: string[],
//   reader: Contract,
//   defi: Contract,
//   expectedIssuers: SignerWithAddress[],
//   expectedAttributes: any[],
//   expectedVerifiedAt: number[],
//   isBusiness: boolean = false
// ) => {
//   // Safety Check
//   expect(expectedIssuers.length).to.equal(expectedAttributes.length);
//   expect(expectedIssuers.length).to.equal(expectedVerifiedAt.length);

//   const availableAttributesByTypes: any = {};

//   for (let i = 0; i < expectedAttributes.length; i++) {
//     Object.keys(expectedAttributes[i]).forEach((attrType) => {
//       if (availableAttributesByTypes[attrType]) {
//         availableAttributesByTypes[attrType].push(
//           expectedAttributes[i][attrType]
//         );
//       } else {
//         availableAttributesByTypes[attrType] = [
//           expectedAttributes[i][attrType],
//         ];
//       }
//     });
//   }
//   const initialBalance = await ethers.provider.getBalance(reader.address);

//   let queryFee: any;
//   if (isBusiness) {
//     queryFee = PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attributesToQuery];
//   } else {
//     queryFee = PRICE_PER_ATTRIBUTES_ETH[attributesToQuery];
//   }

//   const tx = await defi.deposit(account.address, attributesToQuery, {
//     value: queryFee,
//   });

//   const matchingAttributes =
//     attributesToQuery in availableAttributesByTypes
//       ? availableAttributesByTypes[attributesToQuery]
//       : [];

//   await expect(tx)
//     .to.emit(defi, "GetAttributesEvent")
//     .withArgs(
//       matchingAttributes,
//       expectedVerifiedAt,
//       expectedIssuers.map((i) => i.address)
//     );

//   expect(await ethers.provider.getBalance(reader.address)).to.equal(
//     initialBalance.add(queryFee)
//   );
// };
