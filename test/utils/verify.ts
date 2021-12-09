import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { parseUnits, parseEther } from "ethers/lib/utils";

const {
  MINT_PRICE,
  PRICE_PER_ATTRIBUTES,
  TOKEN_ID,
} = require("../../utils/constant.ts");
const { signMint } = require("./signature.ts");

export const assertMint = async (
  account: SignerWithAddress,
  issuer: SignerWithAddress,
  passport: Contract,
  did: string,
  aml: string,
  country: string,
  issuedAt: number
) => {
  const sig = await signMint(
    issuer,
    account,
    TOKEN_ID,
    did,
    aml,
    country,
    issuedAt
  );
  expect(await passport.balanceOf(account.address, TOKEN_ID)).to.equal(0);
  const initialBalance = await passport.provider.getBalance(passport.address);
  await passport
    .connect(account)
    .mintPassport(TOKEN_ID, did, aml, country, issuedAt, sig, {
      value: MINT_PRICE,
    });
  expect(await passport.balanceOf(account.address, TOKEN_ID)).to.equal(1);
  expect(await passport.provider.getBalance(passport.address)).to.equal(
    initialBalance.add(MINT_PRICE)
  );
};

export const assertGetAttribute = async (
  account: SignerWithAddress,
  paymentToken: Contract,
  defi: Contract,
  passport: Contract,
  attribute: string,
  expectedAttributeValue: string,
  expectedIssuedAt: number
) => {
  const priceAttribute = parseUnits(
    PRICE_PER_ATTRIBUTES[attribute].toString(),
    await paymentToken.decimals()
  );

  const initialBalance = await paymentToken.balanceOf(account.address);
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
      priceAttribute
    );
  } else {
    const response = await passport.getAttributeFree(
      account.address,
      TOKEN_ID,
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
    expect(await paymentToken.balanceOf(passport.address)).to.equal(0);
  }
};

export const assertGetAttributeETH = async (
  account: SignerWithAddress,
  defi: Contract,
  passport: Contract,
  attribute: string,
  expectedAttributeValue: string,
  expectedIssuedAt: number
) => {
  const provider = defi.provider;
  const priceAttribute = parseEther(
    (PRICE_PER_ATTRIBUTES[attribute] / 4000).toString()
  );
  if (priceAttribute.eq(0)) {
    const response = await passport.callStatic.getAttributeETH(
      account.address,
      TOKEN_ID,
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
