import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber, Contract } from "ethers";
import { parseUnits, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

const {
  MINT_PRICE,
  PRICE_PER_ATTRIBUTES,
  TOKEN_ID,
  PRICE_SET_ATTRIBUTE,
  ISSUER_SPLIT,
  ATTRIBUTE_DID,
} = require("../../utils/constant.ts");
const { signMint, signMessage } = require("./signature.ts");

const { signSetAttribute } = require("./signature.ts");

export const assertMint = async (
  account: SignerWithAddress,
  issuer: SignerWithAddress,
  issuerTreasury: SignerWithAddress,
  passport: Contract,
  did: string,
  aml: string,
  country: string,
  isBusiness: string,
  issuedAt: number,
  tokenId: number = TOKEN_ID,
  opts: any
) => {
  const sig = await signMint(
    issuer,
    account,
    tokenId,
    did,
    aml,
    country,
    isBusiness,
    issuedAt
  );
  const sigAccount = await signMessage(
    account,
    account.address
  );
  expect(await passport.balanceOf(account.address, tokenId)).to.equal(opts?.newIssuerMint ? 1 : 0);
  const initalPassportBalance = await ethers.provider.getBalance(passport.address);
  var initialIssuerBalance = ethers.BigNumber.from(0);
  // Cannot assume the eth within passport contract belongs to the current issuer
  try {
    initialIssuerBalance = await passport.connect(issuer).callStatic.withdraw(issuerTreasury.address);
  } catch { }

  await passport
    .connect(account)
    .mintPassport([account.address, tokenId, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
      value: MINT_PRICE,
    });

  expect(await passport.balanceOf(account.address, tokenId)).to.equal(1);
  expect(await passport.provider.getBalance(passport.address)).to.equal(
    initalPassportBalance.add(MINT_PRICE)
  );

  expect(
    await passport.connect(issuer).callStatic.withdraw(issuerTreasury.address)
  ).to.equal(MINT_PRICE.add(initialIssuerBalance));

};

export const assertGetAttributeFree = async (
  issuers: string[],
  account: SignerWithAddress,
  defi: Contract,
  passport: Contract,
  reader: Contract,
  attribute: string,
  expectedAttributeValue: number,
  expectedIssuedAt: number,
  tokenId: number = TOKEN_ID,
  opts: any
) => {
  const priceAttribute = await reader.calculatePayment(attribute, account.address)

  expect(priceAttribute).to.equal(parseEther("0"));

  const initialBalancePassport = await passport.provider.getBalance(
    passport.address
  );
  const response = await reader.getAttributesFreeIncludingOnly(
    account.address,
    tokenId,
    attribute,
    issuers
  );
  const attributesResponse = response[0];
  const epochsResponse = response[1];
  const issuersResponse = response[2];

  expect(attributesResponse[0]).to.equal(expectedAttributeValue);
  expect(epochsResponse[0]).to.equal(expectedIssuedAt);

  if (opts?.mockBusiness) {
    await expect(opts?.mockBusiness.connect(opts?.signer || account).doSomethingAsBusiness(attribute))
      .to.emit(defi, "GetAttributeEvent")
      .withArgs(attributesResponse[0], epochsResponse[0]);
  } else {
    await expect(defi.connect(opts?.signer || account).doSomethingFree(attribute))
      .to.emit(defi, "GetAttributeEvent")
      .withArgs(attributesResponse[0], epochsResponse[0]);

  }

  expect(await passport.provider.getBalance(passport.address)).to.equal(
    initialBalancePassport
  );
};

export const assertGetAttribute = async (
  account: SignerWithAddress,
  treasury: SignerWithAddress,
  issuer: SignerWithAddress,
  issuerTreasury: SignerWithAddress,
  paymentToken: Contract,
  defi: Contract,
  passport: Contract,
  reader: Contract,
  attribute: string,
  expectedAttributeValue: string,
  expectedIssuedAt: number,
  tokenId: number = TOKEN_ID,
  opts: any
) => {
  try {
    await passport.withdrawToken(treasury.address, paymentToken.address);
    await passport.withdrawToken(issuerTreasury.address, paymentToken.address);
  } catch (err) { }
  const priceAttribute = await reader.calculatePaymentToken(attribute, paymentToken.address, account.address)
  const priceAttributeFixed = await reader.calculatePayment(attribute, account.address)
  expect(priceAttribute).to.not.equal(parseEther("0"));

  // Retrieve initialBalances
  const initialBalance = await paymentToken.balanceOf(opts?.signer?.address || account.address);
  const initialBalancePassport = await paymentToken.balanceOf(passport.address);
  const initialBalanceIssuer = await paymentToken.balanceOf(issuer.address);
  const initialBalanceIssuerTreasury = await paymentToken.balanceOf(
    issuerTreasury.address
  );
  const initialBalanceProtocolTreasury = await paymentToken.balanceOf(
    treasury.address
  );

  // GetAttribute function
  await paymentToken.connect(opts?.signer || account).approve(defi.address, priceAttribute);
  expect(await paymentToken.allowance((opts?.signer || account).address, defi.address)).to.equal(priceAttribute);

  if (opts?.mockBusiness) {
    await paymentToken.connect(opts?.signer).transfer(account.address, priceAttribute)
    await expect(opts?.mockBusiness.connect(opts?.signer || account).doSomethingAsBusiness(attribute, { value: priceAttributeFixed }))
      .to.emit(defi, "GetAttributeEvent")
      .withArgs(expectedAttributeValue, expectedIssuedAt);
  } else {

    await expect(
      defi.connect(opts?.signer || account).doSomething(attribute, paymentToken.address)
    )

      .to.emit(defi, "GetAttributeEvent")
      .withArgs(expectedAttributeValue, expectedIssuedAt);

    // Check Balance
    expect(await paymentToken.balanceOf(opts?.signer?.address || account.address)).to.equal(
      initialBalance.sub(priceAttribute)
    );

    expect(await paymentToken.balanceOf(passport.address)).to.equal(
      priceAttribute.add(initialBalancePassport)
    );

    expect(await paymentToken.balanceOf(issuer.address)).to.equal(
      initialBalanceIssuer
    );

    expect(await paymentToken.balanceOf(issuerTreasury.address)).to.equal(
      initialBalanceIssuerTreasury
    );

    expect(await paymentToken.balanceOf(treasury.address)).to.equal(
      initialBalanceProtocolTreasury
    );

    await expect(
      passport.withdrawToken(issuer.address, paymentToken.address)
    ).to.revertedWith("NOT_ENOUGH_BALANCE");
    await expect(
      passport.withdrawToken(opts?.signer?.address || account.address, paymentToken.address)
    ).to.revertedWith("NOT_ENOUGH_BALANCE");

    expect(
      await passport.callStatic.withdrawToken(
        issuerTreasury.address,
        paymentToken.address
      )
    ).to.equal(priceAttribute.mul(ISSUER_SPLIT).div(100).div(opts?.validIssuerCount || 1));

    expect(
      await passport.callStatic.withdrawToken(
        treasury.address,
        paymentToken.address
      )
    ).to.equal(priceAttribute.mul(ISSUER_SPLIT).div(100));
  }


};


export const assertGetAttributeFixed = async (
  account: SignerWithAddress,
  defi: Contract,
  passport: Contract,
  attribute: string,
  expectedAttributeValue: string,
  expectedIssuedAt: number,
  tokenId: number = TOKEN_ID
) => {
  const provider = defi.provider;
  const priceAttribute = parseEther(
    (PRICE_PER_ATTRIBUTES[attribute] / 4000).toString()
  );
  expect(priceAttribute).to.not.equal(parseEther("0"));

  // Test with potential actual transfer of Token
  const initialBalance = await provider.getBalance(account.address);
  const initialBalancePassport = await provider.getBalance(passport.address);
  await expect(
    defi.connect(account).doSomethingETH(attribute, { value: priceAttribute })
  )
    .to.emit(defi, "GetAttributeEvent")
    .withArgs(expectedAttributeValue, expectedIssuedAt);
  expect(await provider.getBalance(account.address)).to.be.below(
    initialBalance.sub(priceAttribute)
  );
  expect(await provider.getBalance(passport.address)).to.equal(
    priceAttribute.add(initialBalancePassport)
  );
};

export const assertGetAttributeFixedWrapper = async (
  account: SignerWithAddress,
  defi: Contract,
  passport: Contract,
  attribute: string,
  expectedAttributeValue: any[],
  expectedIssuedAt: BigNumber[],
  tokenId: number = TOKEN_ID
) => {
  const { priceAttribute, provider, initialBalance, initialBalancePassport } = await getInitialValuesETH(defi, attribute, account, passport);
  await expect(
    defi.connect(account).doSomethingETHWrapper(attribute, { value: priceAttribute })
  ).to.emit(defi, "GetAttributeEvents").withArgs(expectedAttributeValue, expectedIssuedAt);

  await checkFinalValuesETH(provider, account, initialBalance, priceAttribute, passport, initialBalancePassport);

}

export const assertGetAttributeFixedExcluding = async (
  account: SignerWithAddress,
  excludedIssuers: string[],
  defi: Contract,
  passport: Contract,
  attribute: string,
  expectedAttributeValue: any[],
  expectedIssuedAt: BigNumber[],
  tokenId: number = TOKEN_ID
) => {

  const { priceAttribute, provider, initialBalance, initialBalancePassport } = await getInitialValuesETH(defi, attribute, account, passport);
  await expect(
    defi.connect(account).doSomethingETHExcluding(attribute, excludedIssuers, { value: priceAttribute })
  ).to.emit(defi, "GetAttributeEvents").withArgs(expectedAttributeValue, expectedIssuedAt);
  await checkFinalValuesETH(provider, account, initialBalance, priceAttribute, passport, initialBalancePassport);
};

export const assertGetAttributeFixedIncluding = async (
  account: SignerWithAddress,
  includedIssuers: string[],
  defi: Contract,
  passport: Contract,
  reader: Contract,
  attribute: string,
  expectedAttributeValue: any[],
  expectedIssuedAt: BigNumber[],
  tokenId: number = TOKEN_ID
) => {

  const provider = defi.provider;
  const priceAttribute = await reader.calculatePayment(attribute, account.address)

  expect(priceAttribute).to.not.equal(parseEther("0"));

  // Test with potential actual transfer of Token
  const initialBalance = await provider.getBalance(account.address);
  const initialBalancePassport = await provider.getBalance(passport.address);
  await expect(
    defi.connect(account).doSomethingETHIncluding(attribute, includedIssuers, { value: priceAttribute })
  )
    .to.emit(defi, "GetAttributeEvents")
    .withArgs(expectedAttributeValue, expectedIssuedAt);
  expect(await provider.getBalance(account.address)).to.be.below(
    initialBalance.sub(priceAttribute)
  );
  expect(await provider.getBalance(passport.address)).to.equal(
    priceAttribute.add(initialBalancePassport)
  );
};

export const assertSetAttribute = async (
  account: SignerWithAddress,
  issuer: SignerWithAddress,
  issuerTreasury: SignerWithAddress,
  passport: Contract,
  attribute: string,
  attributeValue: string,
  issuedAt: number,
  opts: any
) => {
  const sig = await signSetAttribute(
    issuer,
    account,
    TOKEN_ID,
    attribute,
    attributeValue,
    issuedAt
  );

  const initialBalance = await passport.provider.getBalance(passport.address);
  const initialBalanceIssuer = initialBalance.eq(0)
    ? initialBalance
    : await passport.callStatic.withdraw(issuerTreasury.address);

  await passport
    .connect(opts?.signer || account)
    .setAttribute(account.address, TOKEN_ID, attribute, attributeValue, issuedAt, sig, {
      value: PRICE_SET_ATTRIBUTE[attribute],
    });

  expect(await passport.provider.getBalance(passport.address)).to.equal(
    initialBalance.add(PRICE_SET_ATTRIBUTE[attribute])
  );
  expect(
    await passport.callStatic.withdraw(issuerTreasury.address)
  ).to.equal(PRICE_SET_ATTRIBUTE[attribute].add(initialBalanceIssuer));
};

export const assertGetAttributeFreeWrapper = async (
  account: SignerWithAddress,
  defi: Contract,
  passport: Contract,
  reader: Contract,
  attribute: string,
  expectedAttributeValues: string[],
  expectedIssuedAt: BigNumber[],
  tokenId: number = TOKEN_ID,
  opts: any
) => {
  const initialBalancePassport = await getInitialValuesFree(reader, attribute, account, passport);
  const response = await reader.callStatic.getAttributesFree(
    account.address,
    tokenId,
    attribute,
  );
  const { attributesResponse, epochsResponse } = assertReturnValuesFree(response, expectedAttributeValues, expectedIssuedAt);
  await expect(defi.connect(opts?.signer || account).doSomethingFreeWrapper(attribute))
    .to.emit(defi, "GetAttributeEvents")
      .withArgs(attributesResponse, epochsResponse);

  await checkFinalValuesFree(passport, initialBalancePassport);
}

export const assertGetAttributeFreeExcluding = async (
  excludedIssuers: string[],
  account: SignerWithAddress,
  defi: Contract,
  passport: Contract,
  reader: Contract,
  attribute: string,
  expectedAttributeValues: string[],
  expectedIssuedAt: BigNumber[],
  tokenId: number = TOKEN_ID,
  opts: any
) => {
  const initialBalancePassport = await getInitialValuesFree(reader, attribute, account, passport);

  const response = await reader.getAttributesFreeExcluding(
    account.address,
    tokenId,
    attribute,
    excludedIssuers
  );
  const { attributesResponse, epochsResponse } = assertReturnValuesFree(response, expectedAttributeValues, expectedIssuedAt);

  if (opts?.mockBusiness) {
    await expect(opts?.mockBusiness.connect(opts?.signer || account).doSomethingAsBusiness(attribute))
      .to.emit(defi, "GetAttributeEvent")
      .withArgs(attributesResponse[0], epochsResponse[0]);
  } else {
    await expect(defi.connect(opts?.signer || account).doSomethingFreeExcluding(attribute, excludedIssuers))
      .to.emit(defi, "GetAttributeEvents")
      .withArgs(attributesResponse, epochsResponse);

  }

  await checkFinalValuesFree(passport, initialBalancePassport);
};

export const assertGetAttributeFreeIncluding = async (
  issuers: string[],
  account: SignerWithAddress,
  defi: Contract,
  passport: Contract,
  reader: Contract,
  attribute: string,
  expectedAttributeValues: any[],
  expectedIssuedAt: BigNumber[],
  tokenId: number = TOKEN_ID,
  opts: any
) => {
  const { attributesResponse, epochsResponse, initialBalancePassport } = await getAttributeFree(reader, attribute, account, passport, tokenId, issuers, expectedAttributeValues, expectedIssuedAt);

  if (opts?.mockBusiness) {
    await expect(opts?.mockBusiness.connect(opts?.signer || account).doSomethingAsBusiness(attribute))
      .to.emit(defi, "GetAttributeEvent")
      .withArgs(attributesResponse[0], epochsResponse[0]);
  } else {
    await expect(defi.connect(opts?.signer || account).doSomethingFreeIncluding(attribute, issuers))
      .to.emit(defi, "GetAttributeEvents")
      .withArgs(attributesResponse, epochsResponse);

  }

  expect(await passport.provider.getBalance(passport.address)).to.equal(
    initialBalancePassport
  );
};

export const assertGetAttributeWrapper  = async (
  account: SignerWithAddress,
  treasury: SignerWithAddress,
  paymentToken: Contract,
  defi: Contract,
  governance: Contract,
  passport: Contract,
  reader: Contract,
  attribute: string,
  expectedAttributeValue: string[],
  expectedIssuedAt: BigNumber[],
  expectedIssuers: string[],
  tokenId: number = TOKEN_ID,
  opts: any
) => {
  var { priceAttribute, priceAttributeFixed, initialBalance, initialBalancePassport, i, initialBalanceIssuers, expectedTreasuries, initialBalanceIssuerTreasuries, initialBalanceProtocolTreasury } = await getInitialValuesToken(passport, treasury, paymentToken, expectedIssuers, governance, reader, attribute, account, opts, defi);
  await expect(
    defi.connect(opts?.signer || account).doSomethingWrapper(attribute, paymentToken.address)
  ).to.emit(defi, "GetAttributeEvents").withArgs(expectedAttributeValue, expectedIssuedAt);

  await checkBalances(paymentToken, opts, account, initialBalance, priceAttribute, passport, initialBalancePassport, i, expectedIssuers, initialBalanceIssuers, expectedTreasuries, initialBalanceIssuerTreasuries, treasury, initialBalanceProtocolTreasury);
  await withdrawIssuerTreasuries(opts, i, expectedTreasuries, passport, paymentToken, expectedIssuers, account);
  await withdrawProtocolTreasury(opts, passport, treasury, paymentToken, priceAttribute);
}

export const assertGetAttributeExcluding = async (
  account: SignerWithAddress,
  treasury: SignerWithAddress,
  excludedIssuers: string[],
  paymentToken: Contract,
  defi: Contract,
  governance: Contract,
  passport: Contract,
  reader: Contract,
  attribute: string,
  expectedAttributeValue: string[],
  expectedIssuedAt: BigNumber[],
  expectedIssuers: string[],
  tokenId: number = TOKEN_ID,
  opts: any
) => {

  var { priceAttribute, priceAttributeFixed, initialBalance, initialBalancePassport, i, initialBalanceIssuers, expectedTreasuries, initialBalanceIssuerTreasuries, initialBalanceProtocolTreasury } = await getInitialValuesToken(passport, treasury, paymentToken, expectedIssuers, governance, reader, attribute, account, opts, defi);

  if (opts?.mockBusiness) {
    await paymentToken.connect(opts?.signer).transfer(account.address, priceAttribute)
    await expect(opts?.mockBusiness.connect(opts?.signer || account).doSomethingAsBusiness(attribute, { value: priceAttributeFixed }))
      .to.emit(defi, "GetAttributeEvent")
      .withArgs(expectedAttributeValue, expectedIssuedAt);
  } else {
    await expect(
      defi.connect(opts?.signer || account).doSomethingExcluding(attribute, paymentToken.address, excludedIssuers)
    ).to.emit(defi, "GetAttributeEvents").withArgs(expectedAttributeValue, expectedIssuedAt);

    await checkBalances(paymentToken, opts, account, initialBalance, priceAttribute, passport, initialBalancePassport, i, expectedIssuers, initialBalanceIssuers, expectedTreasuries, initialBalanceIssuerTreasuries, treasury, initialBalanceProtocolTreasury);
    await withdrawIssuerTreasuries(opts, i, expectedTreasuries, passport, paymentToken, expectedIssuers, account);
    await withdrawProtocolTreasury(opts, passport, treasury, paymentToken, priceAttribute);
  }

};

export const assertGetAttributeIncluding = async (
  account: SignerWithAddress,
  treasury: SignerWithAddress,
  includedIssuers: string[],
  paymentToken: Contract,
  defi: Contract,
  governance: Contract,
  passport: Contract,
  reader: Contract,
  attribute: string,
  expectedAttributeValue: string[],
  expectedIssuedAt: BigNumber[],
  expectedIssuers: string[],
  tokenId: number = TOKEN_ID,
  opts: any
) => {

  try { await passport.withdrawToken(treasury.address, paymentToken.address) } catch { }

  const expectedTreasuries = []
  for (var i = 0; i < expectedIssuers.length; i++) {
    const issuer = expectedIssuers[i];
    const treasury = await governance.issuersTreasury(issuer);
    expectedTreasuries.push(treasury);
    try { await passport.connect(issuer).withdrawToken(treasury, paymentToken.address) } catch {};
  }

  const priceAttribute = await reader.calculatePaymentToken(attribute, paymentToken.address, account.address)
  const priceAttributeFixed = await reader.calculatePayment(attribute, account.address)
  if(!opts?.assertFree)
    expect(priceAttribute).to.not.equal(parseEther("0"));

  // Retrieve initialBalances
  const initialBalance = await paymentToken.balanceOf(opts?.signer?.address || account.address);
  const initialBalancePassport = await paymentToken.balanceOf(passport.address);

  const initialBalanceIssuers = [];
  for (var i = 0; i < expectedIssuers.length; i++) {
    const issuer = expectedIssuers[i];
    initialBalanceIssuers.push(await paymentToken.balanceOf(issuer));
  }

  const initialBalanceIssuerTreasuries = [];
  for(var i = 0;i < expectedTreasuries.length; i++) {
    const treasury = expectedTreasuries[i];
    initialBalanceIssuerTreasuries.push(await paymentToken.balanceOf(treasury));
  }

  const initialBalanceProtocolTreasury = await paymentToken.balanceOf(
    treasury.address
  );

  // GetAttribute function
  await paymentToken.connect(opts?.signer || account).approve(defi.address, priceAttribute);
  expect(await paymentToken.allowance((opts?.signer || account).address, defi.address)).to.equal(priceAttribute);

  if (opts?.mockBusiness) {
    await paymentToken.connect(opts?.signer).transfer(account.address, priceAttribute)
    await expect(opts?.mockBusiness.connect(opts?.signer || account).doSomethingAsBusiness(attribute, { value: priceAttributeFixed }))
      .to.emit(defi, "GetAttributeEvent")
      .withArgs(expectedAttributeValue, expectedIssuedAt);
  } else {

    await expect(
      defi.connect(opts?.signer || account).doSomethingIncluding(attribute, paymentToken.address, includedIssuers, priceAttribute)
    )

      .to.emit(defi, "GetAttributeEvents")
      .withArgs(expectedAttributeValue, expectedIssuedAt);

    await checkBalances(paymentToken, opts, account, initialBalance, priceAttribute, passport, initialBalancePassport, i, expectedIssuers, initialBalanceIssuers, expectedTreasuries, initialBalanceIssuerTreasuries, treasury, initialBalanceProtocolTreasury);
    await withdrawIssuerTreasuries(opts, i, expectedTreasuries, passport, paymentToken, expectedIssuers, account);
    await withdrawProtocolTreasury(opts, passport, treasury, paymentToken, priceAttribute);
  }

};

async function getInitialValuesToken(passport: Contract, treasury: SignerWithAddress, paymentToken: Contract, expectedIssuers: string[], governance: Contract, reader: Contract, attribute: string, account: SignerWithAddress, opts: any, defi: Contract) {
  try { await passport.withdrawToken(treasury.address, paymentToken.address); } catch { }

  const expectedTreasuries = [];
  for (var i = 0; i < expectedIssuers.length; i++) {
    const issuer = expectedIssuers[i];
    const treasury = await governance.issuersTreasury(issuer);
    expectedTreasuries.push(treasury);
    try { await passport.connect(issuer).withdrawToken(treasury, paymentToken.address); } catch { };
  }

  const priceAttribute = await reader.calculatePaymentToken(attribute, paymentToken.address, account.address);
  const priceAttributeFixed = await reader.calculatePayment(attribute, account.address);
  if (!opts?.assertFree)
    expect(priceAttribute).to.not.equal(parseEther("0"));

  // Retrieve initialBalances
  const initialBalance = await paymentToken.balanceOf(opts?.signer?.address || account.address);
  const initialBalancePassport = await paymentToken.balanceOf(passport.address);

  const initialBalanceIssuers = [];
  for (var i = 0; i < expectedIssuers.length; i++) {
    const issuer = expectedIssuers[i];
    initialBalanceIssuers.push(await paymentToken.balanceOf(issuer));
  }

  const initialBalanceIssuerTreasuries = [];
  for (var i = 0; i < expectedTreasuries.length; i++) {
    const treasury = expectedTreasuries[i];
    initialBalanceIssuerTreasuries.push(await paymentToken.balanceOf(treasury));
  }

  const initialBalanceProtocolTreasury = await paymentToken.balanceOf(
    treasury.address
  );

  // GetAttribute function
  await paymentToken.connect(opts?.signer || account).approve(defi.address, priceAttribute);
  expect(await paymentToken.allowance((opts?.signer || account).address, defi.address)).to.equal(priceAttribute);
  return { priceAttribute, priceAttributeFixed, initialBalance, initialBalancePassport, i, initialBalanceIssuers, expectedTreasuries, initialBalanceIssuerTreasuries, initialBalanceProtocolTreasury };
}

async function checkFinalValuesFree(passport: Contract, initialBalancePassport: BigNumber) {
  expect(await passport.provider.getBalance(passport.address)).to.equal(
    initialBalancePassport
  );
}

function assertReturnValuesFree(response: any, expectedAttributeValues: string[], expectedIssuedAt: BigNumber[]) {
  const attributesResponse = response[0];
  const epochsResponse = response[1];
  const issuersResponse = response[2];

  expect(attributesResponse).to.eql(expectedAttributeValues);
  expect(epochsResponse).to.eql(expectedIssuedAt);
  return { attributesResponse, epochsResponse };
}

async function getInitialValuesFree(reader: Contract, attribute: string, account: SignerWithAddress, passport: Contract) {
  const priceAttribute = await reader.calculatePayment(attribute, account.address);

  expect(priceAttribute).to.equal(parseEther("0"));

  const initialBalancePassport = await passport.provider.getBalance(
    passport.address
  );
  return initialBalancePassport;
}

async function checkFinalValuesETH(provider: any, account: SignerWithAddress, initialBalance: BigNumber, priceAttribute: BigNumber, passport: Contract, initialBalancePassport: BigNumber) {
  expect(await provider.getBalance(account.address)).to.be.below(
    initialBalance.sub(priceAttribute)
  );
  expect(await provider.getBalance(passport.address)).to.equal(
    priceAttribute.add(initialBalancePassport)
  );
}

async function getInitialValuesETH(defi: Contract, attribute: string, account: SignerWithAddress, passport: Contract) {
  const provider = defi.provider;

  const reader = await ethers.getContractAt('QuadReader', defi.reader());
  const priceAttribute = await reader.calculatePayment(attribute, account.address);

  // Test with potential actual transfer of Token
  const initialBalance = await provider.getBalance(account.address);
  const initialBalancePassport = await provider.getBalance(passport.address);
  return { priceAttribute, provider, initialBalance, initialBalancePassport };
}

async function getAttributeFree(reader: Contract, attribute: string, account: SignerWithAddress, passport: Contract, tokenId: number, issuers: string[], expectedAttributeValues: any[], expectedIssuedAt: BigNumber[]) {
  const priceAttribute = await reader.calculatePayment(attribute, account.address);

  expect(priceAttribute).to.equal(parseEther("0"));

  const initialBalancePassport = await passport.provider.getBalance(
    passport.address
  );
  const response = await reader.getAttributesFreeIncludingOnly(
    account.address,
    tokenId,
    attribute,
    issuers
  );
  const attributesResponse = response[0];
  const epochsResponse = response[1];

  expect(attributesResponse).to.eql(expectedAttributeValues);
  expect(epochsResponse).to.eql(expectedIssuedAt);
  return { attributesResponse, epochsResponse, initialBalancePassport };
}

async function withdrawProtocolTreasury(opts: any, passport: Contract, treasury: SignerWithAddress, paymentToken: Contract, priceAttribute: any) {
  if (!opts?.assertFree) {
    expect(
      await passport.callStatic.withdrawToken(
        treasury.address,
        paymentToken.address
      )
    ).to.equal(priceAttribute.mul(ISSUER_SPLIT).div(100));
  }
}

async function withdrawIssuerTreasuries(opts: any, i: number, expectedTreasuries: any[], passport: Contract, paymentToken: Contract, expectedIssuers: string[], account: SignerWithAddress) {
  if (!opts?.assertFree) {
    for (var i = 0; i < expectedTreasuries.length; i++) {
      const treasury = expectedTreasuries[i];
      await passport.withdrawToken(treasury, paymentToken.address);
    }
  }

  // should fail now that they are empty
  for (var i = 0; i < expectedIssuers.length; i++) {
    const issuer = expectedIssuers[i];
    await expect(
      passport.withdrawToken(issuer, paymentToken.address)
    ).to.revertedWith("NOT_ENOUGH_BALANCE");
  }

  await expect(
    passport.withdrawToken(opts?.signer?.address || account.address, paymentToken.address)
  ).to.revertedWith("NOT_ENOUGH_BALANCE");
}

async function checkBalances(paymentToken: Contract, opts: any, account: SignerWithAddress, initialBalance: any, priceAttribute: any, passport: Contract, initialBalancePassport: any, i: number, expectedIssuers: string[], initialBalanceIssuers: any[], expectedTreasuries: any[], initialBalanceIssuerTreasuries: any[], treasury: SignerWithAddress, initialBalanceProtocolTreasury: any) {
  expect(await paymentToken.balanceOf(opts?.signer?.address || account.address)).to.equal(
    initialBalance.sub(priceAttribute)
  );

  if(expectedIssuers.length > 0)
    expect(await paymentToken.balanceOf(passport.address)).to.equal(
      priceAttribute.add(initialBalancePassport)
    );

  for (var i = 0; i < expectedIssuers.length; i++) {
    expect(await paymentToken.balanceOf(expectedIssuers[i])).to.equal(initialBalanceIssuers[i]);
  }

  for (var i = 0; i < expectedTreasuries.length; i++) {
    expect(await paymentToken.balanceOf(expectedTreasuries[i])).to.equal(
      initialBalanceIssuerTreasuries[i]
    );
  }

  expect(await paymentToken.balanceOf(treasury.address)).to.equal(
    initialBalanceProtocolTreasury
  );

  // check balances and ensure issuers recieved correct payment amount
  if (!opts?.assertFree) {
    for (var i = 0; i < expectedTreasuries.length; i++) {
      const treasury = expectedTreasuries[i];
      expect(
        await passport.callStatic.withdrawToken(
          treasury,
          paymentToken.address
        )
      ).to.equal(((priceAttribute.mul(ISSUER_SPLIT).div(100)).div(expectedIssuers.length)));
    }
  }
}