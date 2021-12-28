import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { parseUnits, parseEther } from "ethers/lib/utils";

const {
  MINT_PRICE,
  PRICE_PER_ATTRIBUTES,
  TOKEN_ID,
  PRICE_SET_ATTRIBUTE,
} = require("../../utils/constant.ts");
const { signMint } = require("./signature.ts");

const { signSetAttribute } = require("./signature.ts");

export const assertMint = async (
  account: SignerWithAddress,
  issuer: SignerWithAddress,
  issuerTreasury: SignerWithAddress,
  passport: Contract,
  did: string,
  aml: string,
  country: string,
  issuedAt: number,
  tokenId: number = TOKEN_ID
) => {
  const sig = await signMint(
    issuer,
    account,
    tokenId,
    did,
    aml,
    country,
    issuedAt
  );
  expect(await passport.balanceOf(account.address, tokenId)).to.equal(0);
  const initialBalance = await passport.provider.getBalance(passport.address);
  const initialBalanceIssuer = initialBalance.eq(0)
    ? initialBalance
    : await passport.callStatic.withdrawETH(issuerTreasury.address);
  await passport
    .connect(account)
    .mintPassport(tokenId, did, aml, country, issuedAt, sig, {
      value: MINT_PRICE,
    });
  expect(await passport.balanceOf(account.address, tokenId)).to.equal(1);
  expect(await passport.provider.getBalance(passport.address)).to.equal(
    initialBalance.add(MINT_PRICE)
  );
  expect(
    await passport.callStatic.withdrawETH(issuerTreasury.address)
  ).to.equal(MINT_PRICE.add(initialBalanceIssuer));
};

export const assertGetAttribute = async (
  account: SignerWithAddress,
  paymentToken: Contract,
  defi: Contract,
  passport: Contract,
  attribute: string,
  expectedAttributeValue: string,
  expectedIssuedAt: number,
  tokenId: number = TOKEN_ID
) => {
  const priceAttribute = parseUnits(
    PRICE_PER_ATTRIBUTES[attribute].toString(),
    await paymentToken.decimals()
  );

  const initialBalance = await paymentToken.balanceOf(account.address);
  const initialBalancePassport = await paymentToken.balanceOf(passport.address);
  if (priceAttribute.gt(0)) {
    await paymentToken.connect(account).approve(defi.address, priceAttribute);
    await expect(
      defi.connect(account).doSomething(attribute, paymentToken.address)
    )
      .to.emit(defi, "GetAttributeEvent")
      .withArgs(expectedAttributeValue, expectedIssuedAt);
    expect(await paymentToken.balanceOf(account.address)).to.equal(
      initialBalance.sub(priceAttribute)
    );
    expect(await paymentToken.balanceOf(passport.address)).to.equal(
      priceAttribute.add(initialBalancePassport)
    );
  } else {
    const response = await passport.getAttributeFree(
      account.address,
      tokenId,
      attribute
    );
    expect(response[0]).to.equal(expectedAttributeValue);
    expect(response[1]).to.equal(expectedIssuedAt);
    await expect(defi.connect(account).doSomethingFree(attribute))
      .to.emit(defi, "GetAttributeEvent")
      .withArgs(expectedAttributeValue, expectedIssuedAt);
    expect(await paymentToken.balanceOf(account.address)).to.equal(
      initialBalance
    );
    expect(await paymentToken.balanceOf(passport.address)).to.equal(
      initialBalancePassport
    );
  }
};

export const assertGetAttributeETH = async (
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
  if (priceAttribute.eq(0)) {
    const response = await passport.callStatic.getAttributeETH(
      account.address,
      tokenId,
      attribute
    );
    expect(response[0]).to.equal(expectedAttributeValue);
    expect(response[1]).to.equal(expectedIssuedAt);
  }

  // Test with potential actual transfer of Token
  const initialBalance = await provider.getBalance(account.address);
  const initialBalancePassport = await provider.getBalance(passport.address);
  await expect(
    defi.connect(account).doSomethingETH(attribute, { value: priceAttribute })
  )
    .to.emit(defi, "GetAttributeEvent")
    .withArgs(expectedAttributeValue, expectedIssuedAt);
  if (priceAttribute.eq(0)) {
    expect(await provider.getBalance(passport.address)).to.equal(
      initialBalancePassport
    );
  } else {
    expect(await provider.getBalance(account.address)).to.be.below(
      initialBalance.sub(priceAttribute)
    );
    expect(await provider.getBalance(passport.address)).to.equal(
      priceAttribute.add(initialBalancePassport)
    );
  }
};

export const assertSetAttribute = async (
  account: SignerWithAddress,
  issuer: SignerWithAddress,
  issuerTreasury: SignerWithAddress,
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

  const initialBalance = await passport.provider.getBalance(passport.address);
  const initialBalanceIssuer = initialBalance.eq(0)
    ? initialBalance
    : await passport.callStatic.withdrawETH(issuerTreasury.address);

  await passport
    .connect(account)
    .setAttribute(TOKEN_ID, attribute, attributeValue, issuedAt, sig, {
      value: PRICE_SET_ATTRIBUTE[attribute],
    });

  expect(await passport.provider.getBalance(passport.address)).to.equal(
    initialBalance.add(PRICE_SET_ATTRIBUTE[attribute])
  );
  expect(
    await passport.callStatic.withdrawETH(issuerTreasury.address)
  ).to.equal(PRICE_SET_ATTRIBUTE[attribute].add(initialBalanceIssuer));
};
