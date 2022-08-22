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
  PRICE_PER_ATTRIBUTES_ETH,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");

describe("QuadReader.withdraw", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
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

  const queryFee = PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_COUNTRY];

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
    [governance, passport, reader] = await deployPassportEcosystem(
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

    await reader.getAttributes(minterA.address, ATTRIBUTE_COUNTRY, {
      value: queryFee,
    });
  });

  describe("QuadReader.withdraw", async () => {
    it("success", async () => {
      const initialBalanceReader = await ethers.provider.getBalance(
        reader.address
      );

      const initialBalanceIssuer = await ethers.provider.getBalance(
        issuerTreasury.address
      );

      await expect(
        reader.connect(admin).withdraw(issuerTreasury.address, queryFee)
      )
        .to.emit(reader, "WithdrawEvent")
        .withArgs(issuer.address, issuerTreasury.address, queryFee);

      const newBalanceReader = await ethers.provider.getBalance(reader.address);

      const newBalanceIssuer = await ethers.provider.getBalance(
        issuerTreasury.address
      );

      expect(newBalanceReader).to.equal(initialBalanceReader.sub(queryFee));
      expect(newBalanceIssuer).to.equal(initialBalanceIssuer.add(queryFee));
    });

    it("success - after updated issuerTreasury", async () => {
      await governance
        .connect(admin)
        .addIssuer(issuer.address, issuerTreasury2.address);

      const initialBalanceReader = await ethers.provider.getBalance(
        reader.address
      );

      const initialBalanceIssuer = await ethers.provider.getBalance(
        issuerTreasury2.address
      );

      await reader.connect(admin).withdraw(issuerTreasury2.address, queryFee);

      const newBalanceReader = await ethers.provider.getBalance(reader.address);

      const newBalanceIssuer = await ethers.provider.getBalance(
        issuerTreasury2.address
      );

      expect(newBalanceReader).to.equal(initialBalanceReader.sub(queryFee));
      expect(newBalanceIssuer).to.equal(initialBalanceIssuer.add(queryFee));
    });

    it("success - to protocol treasury", async () => {
      const initialBalanceReader = await ethers.provider.getBalance(
        reader.address
      );

      const initialBalanceTreasury = await ethers.provider.getBalance(
        treasury.address
      );

      await expect(reader.connect(admin).withdraw(treasury.address, queryFee))
        .to.emit(reader, "WithdrawEvent")
        .withArgs(reader.address, treasury.address, queryFee);

      const newBalanceReader = await ethers.provider.getBalance(reader.address);

      const newBalanceTreasury = await ethers.provider.getBalance(
        treasury.address
      );

      expect(newBalanceReader).to.equal(initialBalanceReader.sub(queryFee));
      expect(newBalanceTreasury).to.equal(initialBalanceTreasury.add(queryFee));
    });

    it("fail - not governance", async () => {
      await expect(
        reader.connect(issuer).withdraw(issuerTreasury2.address, queryFee)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail - not a issuer treasury", async () => {
      await expect(
        reader.connect(admin).withdraw(issuer.address, queryFee)
      ).to.be.revertedWith("WITHDRAWAL_ADDRESS_INVALID");
    });

    it("fail - withdraw to address(0)", async () => {
      await expect(
        reader.connect(admin).withdraw(ethers.constants.AddressZero, queryFee)
      ).to.revertedWith("WITHDRAW_ADDRESS_ZERO");
    });

    it("fail - withdraw balance 0", async () => {
      await reader.connect(admin).withdraw(issuerTreasury2.address, queryFee);
      const newBalanceReader = await ethers.provider.getBalance(reader.address);

      expect(newBalanceReader).to.equal(0);
      await expect(
        reader.connect(admin).withdraw(issuerTreasury.address, queryFee)
      ).to.revertedWith("INSUFFICIENT_BALANCE");
    });

    it("fail - withdraw higher amount than balance", async () => {
      await expect(
        reader.connect(admin).withdraw(issuerTreasury.address, queryFee.add(1))
      ).to.revertedWith("INSUFFICIENT_BALANCE");
    });
  });
});
