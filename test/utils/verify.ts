import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { parseUnits, parseEther } from "ethers/lib/utils";

const {
  MINT_PRICE,
  PRICE_PER_ATTRIBUTES,
  TOKEN_ID,
  PRICE_SET_ATTRIBUTE,
  ISSUER_SPLIT,
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
  isBusiness: string,
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
    isBusiness,
    issuedAt
  );
  expect(await passport.balanceOf(account.address, tokenId)).to.equal(0);
  const initialBalance = await passport.provider.getBalance(passport.address);
  const initialBalanceIssuer = initialBalance.eq(0)
    ? initialBalance
    : await passport.callStatic.withdrawETH(issuerTreasury.address);
  await passport
    .connect(account)
    .mintPassport(account.address, tokenId, did, aml, country, isBusiness, issuedAt, sig, {
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
  const priceAttribute = await reader.calculatePaymentETH(attribute, account.address)

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
    console.log((opts?.signer || account).address)
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
  const priceAttributeETH = await reader.calculatePaymentETH(attribute, account.address)
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
  console.log("Allowence")
  console.log(await paymentToken.allowance((opts?.signer || account).address, defi.address));
  console.log("approving...");
  console.log(priceAttribute.toString())

  if (opts?.mockBusiness) {
    await paymentToken.connect(opts?.signer).transfer(account.address, priceAttribute)
    await expect(opts?.mockBusiness.connect(opts?.signer || account).doSomethingAsBusiness(attribute, { value: priceAttributeETH }))
      .to.emit(defi, "GetAttributeEvent")
      .withArgs(expectedAttributeValue, expectedIssuedAt);
  } else {

    console.log("checkpoint 0");
    await expect(
      defi.connect(opts?.signer || account).doSomething(attribute, paymentToken.address)
    )

    .to.emit(defi, "GetAttributeEvent")
    .withArgs(expectedAttributeValue, expectedIssuedAt);

    console.log("checkpoint 1");
    // Check Balance
    expect(await paymentToken.balanceOf(opts?.signer?.address || account.address)).to.equal(
      initialBalance.sub(priceAttribute)
    );
    console.log("checkpoint 2");

    expect(await paymentToken.balanceOf(passport.address)).to.equal(
      priceAttribute.add(initialBalancePassport)
    );
    console.log("checkpoint 3");

    expect(await paymentToken.balanceOf(issuer.address)).to.equal(
      initialBalanceIssuer
    );
    console.log("checkpoint 4");

    expect(await paymentToken.balanceOf(issuerTreasury.address)).to.equal(
      initialBalanceIssuerTreasury
    );
    console.log("checkpoint 5");

    expect(await paymentToken.balanceOf(treasury.address)).to.equal(
      initialBalanceProtocolTreasury
    );

    console.log("checkpoint a");

    await expect(
      passport.withdrawToken(issuer.address, paymentToken.address)
    ).to.revertedWith("NOT_ENOUGH_BALANCE");
    await expect(
      passport.withdrawToken(opts?.signer?.address || account.address, paymentToken.address)
    ).to.revertedWith("NOT_ENOUGH_BALANCE");

    console.log("checkpoint b")

    expect(
      await passport.callStatic.withdrawToken(
        issuerTreasury.address,
        paymentToken.address
      )
    ).to.equal(priceAttribute.mul(ISSUER_SPLIT).div(100));

    console.log("checkpoint c")

    expect(
      await passport.callStatic.withdrawToken(
        treasury.address,
        paymentToken.address
      )
    ).to.equal(priceAttribute.mul(ISSUER_SPLIT).div(100));
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
    : await passport.callStatic.withdrawETH(issuerTreasury.address);

  await passport
    .connect(opts?.signer || account)
    .setAttribute(account.address, TOKEN_ID, attribute, attributeValue, issuedAt, sig, {
      value: PRICE_SET_ATTRIBUTE[attribute],
    });

  expect(await passport.provider.getBalance(passport.address)).to.equal(
    initialBalance.add(PRICE_SET_ATTRIBUTE[attribute])
  );
  expect(
    await passport.callStatic.withdrawETH(issuerTreasury.address)
  ).to.equal(PRICE_SET_ATTRIBUTE[attribute].add(initialBalanceIssuer));
};
