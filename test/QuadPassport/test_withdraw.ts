import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { formatBytes32String, id } from "ethers/lib/utils";

const {
  MINT_PRICE,
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_COUNTRY,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");

describe("QuadPassport.withdraw", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuer2: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerTreasury2: SignerWithAddress;

  let issuedAt: number, verifiedAt: number;
  const attributes: any = {
    [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
    [ATTRIBUTE_AML]: formatBytes32String("1"),
    [ATTRIBUTE_COUNTRY]: id("FRANCE"),
    [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
  };

  beforeEach(async () => {
    [
      deployer,
      admin,
      minterA,
      minterB,
      issuer,
      issuer2,
      treasury,
      issuerTreasury,
      issuerTreasury2,
    ] = await ethers.getSigners();
    [governance, passport] = await deployPassportEcosystem(
      admin,
      [issuer, issuer2],
      treasury,
      [issuerTreasury, issuerTreasury2]
    );

    issuedAt = Math.floor(new Date().getTime() / 1000) - 100;
    verifiedAt = Math.floor(new Date().getTime() / 1000) - 100;

    await setAttributes(
      minterA,
      issuer,
      passport,
      attributes,
      verifiedAt,
      issuedAt,
      MINT_PRICE
    );
  });

  describe("QuadPassport.withdraw", async () => {
    it("success", async () => {
      const initialBalancePassport = await ethers.provider.getBalance(
        passport.address
      );

      const initialBalanceIssuer = await ethers.provider.getBalance(
        issuerTreasury.address
      );

      await passport
        .connect(admin)
        .withdraw(issuerTreasury.address, MINT_PRICE);

      const newBalancePassport = await ethers.provider.getBalance(
        passport.address
      );

      const newBalanceIssuer = await ethers.provider.getBalance(
        issuerTreasury.address
      );

      expect(newBalancePassport).to.equal(
        initialBalancePassport.sub(MINT_PRICE)
      );
      expect(newBalanceIssuer).to.equal(initialBalanceIssuer.add(MINT_PRICE));
    });

    it("success - after updated issuerTreasury", async () => {
      await governance
        .connect(admin)
        .addIssuer(issuer.address, issuerTreasury2.address);

      const initialBalancePassport = await ethers.provider.getBalance(
        passport.address
      );

      const initialBalanceIssuer = await ethers.provider.getBalance(
        issuerTreasury2.address
      );

      await passport
        .connect(admin)
        .withdraw(issuerTreasury2.address, MINT_PRICE);

      const newBalancePassport = await ethers.provider.getBalance(
        passport.address
      );

      const newBalanceIssuer = await ethers.provider.getBalance(
        issuerTreasury2.address
      );

      expect(newBalancePassport).to.equal(
        initialBalancePassport.sub(MINT_PRICE)
      );
      expect(newBalanceIssuer).to.equal(initialBalanceIssuer.add(MINT_PRICE));
    });

    it("fail - not governance", async () => {
      await expect(
        passport.connect(issuer).withdraw(issuerTreasury2.address, MINT_PRICE)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail - not a issuer treasury", async () => {
      await expect(
        passport.connect(admin).withdraw(issuer.address, MINT_PRICE)
      ).to.be.revertedWith("WITHDRAWAL_ADDRESS_INVALID");
    });

    it("fail - withdraw to address(0)", async () => {
      await expect(
        passport
          .connect(admin)
          .withdraw(ethers.constants.AddressZero, MINT_PRICE)
      ).to.revertedWith("WITHDRAW_ADDRESS_ZERO");
    });

    it("fail - withdraw balance 0", async () => {
      await passport
        .connect(admin)
        .withdraw(issuerTreasury2.address, MINT_PRICE);
      const newBalancePassport = await ethers.provider.getBalance(
        passport.address
      );

      expect(newBalancePassport).to.equal(0);
      await expect(
        passport.connect(admin).withdraw(issuerTreasury.address, MINT_PRICE)
      ).to.revertedWith("INSUFFICIENT_BALANCE");
    });

    it("fail - withdraw higher amount than balance", async () => {
      await expect(
        passport
          .connect(admin)
          .withdraw(issuerTreasury.address, MINT_PRICE.add(1))
      ).to.revertedWith("INSUFFICIENT_BALANCE");
    });
  });
});
