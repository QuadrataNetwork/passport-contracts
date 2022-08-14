import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import { parseEther } from "ethers/lib/utils";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const {
  ATTRIBUTE_DID,
  PRICE_PER_ATTRIBUTES_ETH,
  PRICE_PER_BUSINESS_ATTRIBUTES_ETH,
} = require("../../utils/constant.ts");

describe("QuadGovernance.setAttributePriceFixed + setBusinessAttributePriceFixed", async () => {
  let passport: Contract; // eslint-disable-line no-unused-vars
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer1: SignerWithAddress,
    issuerTreasury1: SignerWithAddress;

  beforeEach(async () => {
    [deployer, admin, issuer1, treasury, issuerTreasury1] =
      await ethers.getSigners();

    [governance, passport, reader] = await deployPassportEcosystem(
      admin,
      [issuer1],
      treasury,
      [issuerTreasury1]
    );
  });

  describe("setAttributePriceFixed", async () => {
    it("succeed", async () => {
      expect(await governance.pricePerAttributeFixed(ATTRIBUTE_DID)).to.equal(
        PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_DID]
      );
      const newPrice = parseEther("1");
      await expect(
        governance
          .connect(admin)
          .setAttributePriceFixed(ATTRIBUTE_DID, newPrice)
      )
        .to.emit(governance, "AttributePriceUpdatedFixed")
        .withArgs(
          ATTRIBUTE_DID,
          PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_DID],
          newPrice
        );
      expect(await governance.pricePerAttributeFixed(ATTRIBUTE_DID)).to.equal(
        newPrice
      );
    });

    it("succeed (price 0)", async () => {
      expect(await governance.pricePerAttributeFixed(ATTRIBUTE_DID)).to.equal(
        PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_DID]
      );
      const newPrice = parseEther("0");
      await expect(
        governance
          .connect(admin)
          .setAttributePriceFixed(ATTRIBUTE_DID, newPrice)
      )
        .to.emit(governance, "AttributePriceUpdatedFixed")
        .withArgs(
          ATTRIBUTE_DID,
          PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_DID],
          newPrice
        );
      expect(await governance.pricePerAttributeFixed(ATTRIBUTE_DID)).to.equal(
        newPrice
      );
    });

    it("fail (not admin)", async () => {
      const newPrice = parseEther("0");
      await expect(
        governance.setAttributePriceFixed(ATTRIBUTE_DID, newPrice)
      ).to.be.revertedWith("INVALID_ADMIN");

      await expect(
        governance.setBusinessAttributePriceFixed(ATTRIBUTE_DID, newPrice)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (price already set)", async () => {
      await expect(
        governance
          .connect(admin)
          .setAttributePriceFixed(
            ATTRIBUTE_DID,
            PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_DID]
          )
      ).to.be.revertedWith("ATTRIBUTE_PRICE_ALREADY_SET");
    });
  });
  describe("setBusinessAttributePriceFixed", async () => {
    it("succeed", async () => {
      const newBusinessPrice = parseEther("3.14");
      await expect(
        governance
          .connect(admin)
          .setBusinessAttributePriceFixed(ATTRIBUTE_DID, newBusinessPrice)
      )
        .to.emit(governance, "BusinessAttributePriceUpdatedFixed")
        .withArgs(
          ATTRIBUTE_DID,
          PRICE_PER_BUSINESS_ATTRIBUTES_ETH[ATTRIBUTE_DID],
          newBusinessPrice
        );
      expect(
        await governance.pricePerBusinessAttributeFixed(ATTRIBUTE_DID)
      ).to.equal(newBusinessPrice);
    });

    it("succeed (price 0)", async () => {
      const newPrice = parseEther("0");

      await expect(
        governance
          .connect(admin)
          .setBusinessAttributePriceFixed(ATTRIBUTE_DID, newPrice)
      )
        .to.emit(governance, "BusinessAttributePriceUpdatedFixed")
        .withArgs(
          ATTRIBUTE_DID,
          PRICE_PER_BUSINESS_ATTRIBUTES_ETH[ATTRIBUTE_DID],
          newPrice
        );
      expect(
        await governance.pricePerBusinessAttributeFixed(ATTRIBUTE_DID)
      ).to.equal(newPrice);
    });

    it("fail (not admin)", async () => {
      const newPrice = parseEther("0");

      await expect(
        governance.setBusinessAttributePriceFixed(ATTRIBUTE_DID, newPrice)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (price already set)", async () => {
      await expect(
        governance
          .connect(admin)
          .setBusinessAttributePriceFixed(
            ATTRIBUTE_DID,
            PRICE_PER_BUSINESS_ATTRIBUTES_ETH[ATTRIBUTE_DID]
          )
      ).to.be.revertedWith("ATTRIBUTE_PRICE_ALREADY_SET");
    });
  });
});
