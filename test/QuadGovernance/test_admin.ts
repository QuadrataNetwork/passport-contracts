import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { constants, Contract, Wallet } from "ethers";
import { id, parseEther, parseUnits } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  DEFAULT_ADMIN_ROLE,
  GOVERNANCE_ROLE,
  MINT_PRICE,
  TOKEN_ID,
  PRICE_PER_ATTRIBUTES,
  PRICE_PER_ATTRIBUTES_ETH,
  PRICE_SET_ATTRIBUTE,
  ISSUER_SPLIT,
  ATTRIBUTE_IS_BUSINESS,
  PRICE_PER_BUSINESS_ATTRIBUTES,
  ISSUER_STATUS,
  PRICE_PER_BUSINESS_ATTRIBUTES_ETH
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const { deployGovernance } = require("../../utils/deployment.ts");

describe("QuadGovernance", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract;
  let oracle: Contract;
  let usdc: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer1: SignerWithAddress,
    issuer2: SignerWithAddress,
    issuer3: SignerWithAddress,
    newIssuer: SignerWithAddress,
    issuerTreasury1: SignerWithAddress,
    issuerTreasury2: SignerWithAddress,
    issuerTreasury3: SignerWithAddress,
    newIssuerTreasury: SignerWithAddress;
  const baseURI = "https://quadrata.io";

  beforeEach(async () => {
    [deployer, admin, issuer1, issuer2, issuer3, newIssuer, treasury, issuerTreasury1, issuerTreasury2, issuerTreasury3, newIssuerTreasury] =
      await ethers.getSigners();
    [governance, passport, reader, usdc, , oracle] = await deployPassportEcosystem(
      admin,
      [issuer1, issuer2, issuer3],
      treasury,
      [issuerTreasury1, issuerTreasury2, issuerTreasury3],
      baseURI
    );
  });

  describe("initialize", async () => {
    it("success", async () => {
      expect(await governance.eligibleTokenId(TOKEN_ID)).to.equal(true);

      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_DID)).to.equal(false);

      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(true);
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_COUNTRY)).to.equal(false);

      expect(await governance.eligibleAttributes(ATTRIBUTE_IS_BUSINESS)).to.equal(true);
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_IS_BUSINESS)).to.equal(false);

      expect(await governance.eligibleAttributes(ATTRIBUTE_AML)).to.equal(false);
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_AML)).to.equal(true);

      expect(await governance.mintPricePerAttribute(ATTRIBUTE_AML)).to.equal(parseEther("0.01"));
      expect(await governance.mintPricePerAttribute(ATTRIBUTE_COUNTRY)).to.equal(parseEther("0.01"));
      expect(await governance.mintPricePerAttribute(ATTRIBUTE_IS_BUSINESS)).to.equal(parseEther("0"));
      expect(await governance.mintPricePerAttribute(ATTRIBUTE_DID)).to.equal(parseEther("0"));

      expect(await governance.revSplitIssuer()).to.equal(50);

      expect(await governance.hasRole(GOVERNANCE_ROLE, admin.address)).to.equal(true);

      expect(await governance.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(true);
    });
  });

  describe("updateGovernanceInPassport", async () => {
    it("success", async () => {
      expect(await passport.governance()).to.equal(governance.address);
      const newGovernance = await deployGovernance(admin);
      await governance.connect(admin).updateGovernanceInPassport(newGovernance.address)
      await newGovernance.connect(admin).setPassportContractAddress(passport.address)

      await expect(
        await newGovernance.connect(admin).acceptGovernanceInPassport()
      )
        .to.emit(passport, "GovernanceUpdated")
        .withArgs(governance.address, newGovernance.address);

      expect(await passport.governance()).to.equal(newGovernance.address);
    });

    it("fail (not admin)", async () => {
      await expect(
        governance
          .connect(deployer)
          .updateGovernanceInPassport(deployer.address)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (address zero)", async () => {
      await expect(
        governance
          .connect(admin)
          .updateGovernanceInPassport(ethers.constants.AddressZero)
      ).to.be.revertedWith("GOVERNANCE_ADDRESS_ZERO");
    });

    it("fail (passport not set)", async () => {
      const oGov = await deployGovernance(admin);
      await expect(
        oGov.connect(admin).updateGovernanceInPassport(deployer.address)
      ).to.be.revertedWith("PASSPORT_NOT_SET");
    });
  });

  describe("setTreasury", async () => {
    it("succeed", async () => {
      expect(await governance.treasury()).to.equal(treasury.address);
      await expect(governance.connect(admin).setTreasury(deployer.address))
        .to.emit(governance, "TreasuryUpdated")
        .withArgs(treasury.address, deployer.address);
      expect(await governance.treasury()).to.equal(deployer.address);
    });

    it("fail (not admin)", async () => {
      await expect(governance.setTreasury(deployer.address)).to.be.revertedWith(
        "INVALID_ADMIN"
      );
    });

    it("fail (address zero)", async () => {
      await expect(
        governance.connect(admin).setTreasury(ethers.constants.AddressZero)
      ).to.be.revertedWith("TREASURY_ADDRESS_ZERO");
    });

    it("fail (treasury already set)", async () => {
      await expect(
        governance.connect(admin).setTreasury(treasury.address)
      ).to.be.revertedWith("TREASURY_ADDRESS_ALREADY_SET");
    });
  });

  describe("setPassportContractAddress", async () => {
    it("succeed", async () => {
      expect(await governance.passport()).to.equal(passport.address);
      await expect(
        governance.connect(admin).setPassportContractAddress(deployer.address)
      )
        .to.emit(governance, "PassportAddressUpdated")
        .withArgs(passport.address, deployer.address);
      expect(await governance.passport()).to.equal(deployer.address);
    });

    it("fail (not admin)", async () => {
      await expect(
        governance.setPassportContractAddress(deployer.address)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (address zero)", async () => {
      await expect(
        governance
          .connect(admin)
          .setPassportContractAddress(ethers.constants.AddressZero)
      ).to.be.revertedWith("PASSPORT_ADDRESS_ZERO");
    });

    it("fail (passport already set)", async () => {
      await expect(
        governance.connect(admin).setPassportContractAddress(passport.address)
      ).to.be.revertedWith("PASSPORT_ADDRESS_ALREADY_SET");
    });
  });


  describe("deleteIssuer / getIssuerStatus", async () => {
    it("succeed - delete 3rd issuer", async () => {
      expect(await governance.getIssuersLength()).to.equal(3);
      expect((await governance.issuers(0))[0]).to.equal(issuer1.address);
      expect((await governance.issuers(1))[0]).to.equal(issuer2.address);
      expect((await governance.issuers(2))[0]).to.equal(issuer3.address);

      await governance.connect(admin).deleteIssuer(issuer3.address);
      expect(await governance.getIssuerStatus(issuer3.address)).equals(ISSUER_STATUS.DEACTIVATED);

      expect(await governance.getIssuersLength()).to.equal(2);

      expect((await governance.issuers(0))[0]).to.equal(issuer1.address);
      expect((await governance.issuers(1))[0]).to.equal(issuer2.address);

    });

    it("succeed - delete 2nd issuer", async () => {
      expect(await governance.getIssuersLength()).to.equal(3);
      expect((await governance.issuers(0))[0]).to.equal(issuer1.address);
      expect((await governance.issuers(1))[0]).to.equal(issuer2.address);
      expect((await governance.issuers(2))[0]).to.equal(issuer3.address);

      await governance.connect(admin).deleteIssuer(issuer2.address);
      expect(await governance.getIssuerStatus(issuer2.address)).equals(ISSUER_STATUS.DEACTIVATED);

      expect(await governance.getIssuersLength()).to.equal(2);

      expect((await governance.issuers(0))[0]).to.equal(issuer1.address);
      expect((await governance.issuers(1))[0]).to.equal(issuer3.address);

    });

    it("succeed - delete 1st issuer", async () => {
      expect(await governance.getIssuersLength()).to.equal(3);
      expect((await governance.issuers(0))[0]).to.equal(issuer1.address);
      expect((await governance.issuers(1))[0]).to.equal(issuer2.address);
      expect((await governance.issuers(2))[0]).to.equal(issuer3.address);

      await governance.connect(admin).deleteIssuer(issuer1.address);
      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.DEACTIVATED);

      expect(await governance.getIssuersLength()).to.equal(2);

      expect((await governance.issuers(1))[0]).to.equal(issuer2.address);
      expect((await governance.issuers(0))[0]).to.equal(issuer3.address);

    });

    it("succeed - delete all issuers", async () => {
      expect(await governance.getIssuersLength()).to.equal(3);
      expect((await governance.issuers(0))[0]).to.equal(issuer1.address);
      expect((await governance.issuers(1))[0]).to.equal(issuer2.address);
      expect((await governance.issuers(2))[0]).to.equal(issuer3.address);

      await governance.connect(admin).deleteIssuer(issuer1.address);
      await governance.connect(admin).deleteIssuer(issuer2.address);
      await governance.connect(admin).deleteIssuer(issuer3.address);
      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.DEACTIVATED);
      expect(await governance.getIssuerStatus(issuer2.address)).equals(ISSUER_STATUS.DEACTIVATED);
      expect(await governance.getIssuerStatus(issuer3.address)).equals(ISSUER_STATUS.DEACTIVATED);
      expect(await governance.getIssuerStatus(Wallet.createRandom().address)).equals(ISSUER_STATUS.DEACTIVATED); // random address

      expect(await governance.getIssuersLength()).to.equal(0);

      await expect(governance.issuers(0)).to.be.reverted;

    });

    it("fail - not admin", async () => {
      expect(await governance.getIssuersLength()).to.equal(3);
      await expect(governance.deleteIssuer(issuer1.address)).to.be.revertedWith("INVALID_ADMIN");
      expect(await governance.getIssuersLength()).to.equal(3);
    });

    it("fail - address zero", async () => {
      expect(await governance.getIssuersLength()).to.equal(3);
      await expect(governance.connect(admin).deleteIssuer(ethers.constants.AddressZero)).to.be.revertedWith("ISSUER_ADDRESS_ZERO");
      expect(await governance.getIssuersLength()).to.equal(3);
    });
  });

  describe("setMintPrice", async () => {
    it("succeed", async () => {
      expect(await governance.mintPrice()).to.equal(MINT_PRICE);
      const newMintPrice = parseEther("1");
      await expect(governance.connect(admin).setMintPrice(newMintPrice))
        .to.emit(governance, "PassportMintPriceUpdated")
        .withArgs(MINT_PRICE, newMintPrice);
      expect(await governance.mintPrice()).to.equal(newMintPrice);
    });

    it("succeed (price zero)", async () => {
      const newMintPrice = parseEther("0");
      await expect(governance.connect(admin).setMintPrice(newMintPrice))
        .to.emit(governance, "PassportMintPriceUpdated")
        .withArgs(MINT_PRICE, 0);
      expect(await governance.mintPrice()).to.equal(newMintPrice);
    });

    it("fail (not admin)", async () => {
      await expect(governance.setMintPrice(parseEther("1"))).to.be.revertedWith(
        "INVALID_ADMIN"
      );
    });

    it("fail (minting price already set)", async () => {
      await expect(
        governance.connect(admin).setMintPrice(MINT_PRICE)
      ).to.be.revertedWith("MINT_PRICE_ALREADY_SET");
    });
  });

  describe("setEligibleTokenId", async () => {
    it("succeed", async () => {
      const newTokenID = 2;
      expect(await governance.eligibleTokenId(TOKEN_ID)).to.equal(true);
      expect(await governance.eligibleTokenId(newTokenID)).to.equal(false);
      await expect(
        governance.connect(admin).setEligibleTokenId(newTokenID, true)
      )
        .to.emit(governance, "EligibleTokenUpdated")
        .withArgs(newTokenID, true);
      expect(await governance.eligibleTokenId(TOKEN_ID)).to.equal(true);
      expect(await governance.eligibleTokenId(newTokenID)).to.equal(true);
      await expect(
        governance.connect(admin).setEligibleTokenId(newTokenID, false)
      )
        .to.emit(governance, "EligibleTokenUpdated")
        .withArgs(newTokenID, false);
    });

    it("fail (not admin)", async () => {
      await expect(governance.setEligibleTokenId(2, true)).to.be.revertedWith(
        "INVALID_ADMIN"
      );
    });

    it("fail (token status already set)", async () => {
      await expect(
        governance.connect(admin).setEligibleTokenId(TOKEN_ID, true)
      ).to.be.revertedWith("TOKEN_ELIGIBILITY_ALREADY_SET");
    });
  });

  describe("setEligibleAttribute", async () => {
    it("succeed (true)", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      expect(await governance.eligibleAttributes(newAttribute)).to.equal(false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      await expect(
        governance.connect(admin).setEligibleAttribute(newAttribute, true)
      ).to.emit(governance, "EligibleAttributeUpdated").withArgs(newAttribute, true);

      expect(await governance.eligibleAttributes(newAttribute)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
    });

    it("fail (revert from duplicate element)", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      expect(await governance.eligibleAttributes(newAttribute)).to.equal(false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      await expect(
        governance.connect(admin).setEligibleAttribute(newAttribute, true)
      ).to.emit(governance, "EligibleAttributeUpdated").withArgs(newAttribute, true);
      await expect(
        governance.connect(admin).setEligibleAttribute(newAttribute, true)
      ).to.be.revertedWith("ATTRIBUTE_ELIGIBILITY_SET")

      expect(await governance.eligibleAttributes(newAttribute)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
    });

    it("fail (revert from duplicate element)", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      expect(await governance.eligibleAttributes(newAttribute)).to.equal(false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      await expect(
        governance.connect(admin).setEligibleAttribute(newAttribute, false)
      ).to.be.revertedWith("ATTRIBUTE_ELIGIBILITY_SET")

      expect(await governance.eligibleAttributes(newAttribute)).to.equal(false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
    });

    it("succeed (turn false)", async () => {
      expect(await governance.getEligibleAttributesLength()).to.equal(3);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(true);
      expect(await governance.eligibleAttributesArray(0)).to.equal(ATTRIBUTE_DID);
      expect(await governance.eligibleAttributesArray(1)).to.equal(ATTRIBUTE_COUNTRY);
      await expect(
        governance.connect(admin).setEligibleAttribute(ATTRIBUTE_COUNTRY, false)
      ).to.emit(governance, "EligibleAttributeUpdated").withArgs(ATTRIBUTE_COUNTRY, false);

      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(false);
      expect(await governance.eligibleAttributesArray(0)).to.equal(ATTRIBUTE_DID);
      expect(await governance.eligibleAttributesArray(1)).to.not.equal(ATTRIBUTE_COUNTRY);
      expect(await governance.getEligibleAttributesLength()).to.equal(2);
    });

    it("succeed (turn false  - first element)", async () => {
      expect(await governance.getEligibleAttributesLength()).to.equal(3);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        true
      );
      expect(await governance.eligibleAttributesArray(0)).to.equal(ATTRIBUTE_DID);
      expect(await governance.eligibleAttributesArray(1)).to.equal(
        ATTRIBUTE_COUNTRY
      );
      await expect(
        governance.connect(admin).setEligibleAttribute(ATTRIBUTE_DID, false)
      )
        .to.emit(governance, "EligibleAttributeUpdated")
        .withArgs(ATTRIBUTE_DID, false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(
        false
      );
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        true
      );
      expect(await governance.eligibleAttributesArray(0)).to.equal(
        ATTRIBUTE_IS_BUSINESS
      );
      expect(await governance.getEligibleAttributesLength()).to.equal(2);
    });

    it("succeed (getEligibleAttributesLength)", async () => {
      expect(await governance.getEligibleAttributesLength()).to.equal(3);
      const newAttribute = ethers.utils.id("CREDIT");
      expect(
        await governance.connect(admin).setEligibleAttribute(newAttribute, true)
      );
      expect(await governance.getEligibleAttributesLength()).to.equal(4);
    });

    it("fail (not admin)", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      await expect(
        governance.setEligibleAttribute(newAttribute, true)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (attribute status already set)", async () => {
      await expect(
        governance.connect(admin).setEligibleAttribute(ATTRIBUTE_DID, true)
      ).to.be.revertedWith("ATTRIBUTE_ELIGIBILITY_SET");
    });
  });

  describe("setEligibleAttributeByDID", async () => {
    it("succeed", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      expect(await governance.eligibleAttributesByDID(newAttribute)).to.equal(false);
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_AML)).to.equal(true);

      expect(
        await governance
          .connect(admin)
          .setEligibleAttributeByDID(newAttribute, true)
      );
      expect(await governance.eligibleAttributesByDID(newAttribute)).to.equal(
        true
      );
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_AML)).to.equal(
        true
      );
    });

    it("fail (not admin)", async () => {
      const newAttribute = ethers.utils.id("CREDIT");
      await expect(
        governance.setEligibleAttributeByDID(newAttribute, true)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (attribute status already set)", async () => {
      await expect(
        governance.connect(admin).setEligibleAttributeByDID(ATTRIBUTE_AML, true)
      ).to.be.revertedWith("ATTRIBUTE_ELIGIBILITY_SET");
    });
  });

  describe("setAttributePrice", async () => {
    it("succeed", async () => {
      expect(await governance.pricePerAttribute(ATTRIBUTE_DID)).to.equal(
        parseUnits(PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID].toString(), "6")
      );
      const newPrice = parseEther("1");
      await expect(
        governance.connect(admin).setAttributePrice(ATTRIBUTE_DID, newPrice)
      )
        .to.emit(governance, "AttributePriceUpdated")
        .withArgs(
          ATTRIBUTE_DID,
          parseUnits(PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID].toString(), 6),
          newPrice
        );
      expect(await governance.pricePerAttribute(ATTRIBUTE_DID)).to.equal(
        newPrice
      );
    });

    it("succeed (price 0)", async () => {
      expect(await governance.pricePerAttribute(ATTRIBUTE_DID)).to.equal(
        parseUnits(PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID].toString(), 6)
      );
      const newPrice = parseEther("0");
      await expect(
        governance.connect(admin).setAttributePrice(ATTRIBUTE_DID, newPrice)
      )
        .to.emit(governance, "AttributePriceUpdated")
        .withArgs(
          ATTRIBUTE_DID,
          parseUnits(PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID].toString(), 6),
          newPrice
        );
      expect(await governance.pricePerAttribute(ATTRIBUTE_DID)).to.equal(
        newPrice
      );
    });

    it("fail (not admin)", async () => {
      const newPrice = parseEther("0");
      await expect(
        governance.setAttributePrice(ATTRIBUTE_DID, newPrice)
      ).to.be.revertedWith("INVALID_ADMIN");

      await expect(
        governance.setBusinessAttributePrice(ATTRIBUTE_DID, newPrice)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (price already set)", async () => {
      await expect(
        governance
          .connect(admin)
          .setAttributePrice(
            ATTRIBUTE_DID,
            parseUnits(PRICE_PER_ATTRIBUTES[ATTRIBUTE_DID].toString(), 6)
          )
      ).to.be.revertedWith("ATTRIBUTE_PRICE_ALREADY_SET");


    });
  });

  describe("setAttributePriceFixed", async () => {
    it("succeed", async () => {
      expect(await governance.pricePerAttributeFixed(ATTRIBUTE_DID)).to.equal(
        PRICE_PER_ATTRIBUTES_ETH[ATTRIBUTE_DID]
      );
      const newPrice = parseEther("1");
      await expect(
        governance.connect(admin).setAttributePriceFixed(ATTRIBUTE_DID, newPrice)
      ).to.emit(governance, "AttributePriceUpdatedFixed").withArgs(
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
        governance.connect(admin).setAttributePriceFixed(ATTRIBUTE_DID, newPrice)
      ).to.emit(governance, "AttributePriceUpdatedFixed").withArgs(
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
  describe("setBusinessAttributePrice", async () => {
    it("succeed", async () => {
      const newBusinessPrice = parseEther("3.14");
      await expect(
        governance.connect(admin).setBusinessAttributePrice(ATTRIBUTE_DID, newBusinessPrice)
      )
        .to.emit(governance, "BusinessAttributePriceUpdated")
        .withArgs(
          ATTRIBUTE_DID,
          parseUnits(PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID].toString(), 6),
          newBusinessPrice
        );
      expect(await governance.pricePerBusinessAttribute(ATTRIBUTE_DID)).to.equal(
        newBusinessPrice
      );
    });

    it("succeed (price 0)", async () => {
      const newPrice = parseEther("0");

      await expect(
        governance.connect(admin).setBusinessAttributePrice(ATTRIBUTE_DID, newPrice)
      )
        .to.emit(governance, "BusinessAttributePriceUpdated")
        .withArgs(
          ATTRIBUTE_DID,
          parseUnits(PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID].toString(), 6),
          newPrice
        );
      expect(await governance.pricePerBusinessAttribute(ATTRIBUTE_DID)).to.equal(
        newPrice
      );
    });

    it("fail (not admin)", async () => {
      const newPrice = parseEther("0");

      await expect(
        governance.setBusinessAttributePrice(ATTRIBUTE_DID, newPrice)
      ).to.be.revertedWith("INVALID_ADMIN");
    });


    it("fail (price already set)", async () => {
      await expect(
        governance
          .connect(admin)
          .setBusinessAttributePrice(
            ATTRIBUTE_DID,
            parseUnits(PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID].toString(), 6)
          )
      ).to.be.revertedWith("ATTRIBUTE_PRICE_ALREADY_SET");
    })
  });

  describe("setBusinessAttributePriceFixed", async () => {
    it("succeed", async () => {
      const newBusinessPrice = parseEther("3.14");
      await expect(
        governance.connect(admin).setBusinessAttributePriceFixed(ATTRIBUTE_DID, newBusinessPrice)
      )
        .to.emit(governance, "BusinessAttributePriceUpdatedFixed")
        .withArgs(
          ATTRIBUTE_DID,
          PRICE_PER_BUSINESS_ATTRIBUTES_ETH[ATTRIBUTE_DID],
          newBusinessPrice
        );
      expect(await governance.pricePerBusinessAttributeFixed(ATTRIBUTE_DID)).to.equal(
        newBusinessPrice
      );
    });

    it("succeed (price 0)", async () => {
      const newPrice = parseEther("0");

      await expect(
        governance.connect(admin).setBusinessAttributePriceFixed(ATTRIBUTE_DID, newPrice)
      )
        .to.emit(governance, "BusinessAttributePriceUpdatedFixed")
        .withArgs(
          ATTRIBUTE_DID,
          PRICE_PER_BUSINESS_ATTRIBUTES_ETH[ATTRIBUTE_DID],
          newPrice
        );
      expect(await governance.pricePerBusinessAttributeFixed(ATTRIBUTE_DID)).to.equal(
        newPrice
      );
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
    })
  });
  describe("setAttributeMintPrice", async () => {
    it("succeed", async () => {
      expect(await governance.mintPricePerAttribute(ATTRIBUTE_AML)).to.equal(
        PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML]
      );
      const newPrice = parseEther("1");
      await expect(
        governance.connect(admin).setAttributeMintPrice(ATTRIBUTE_AML, newPrice)
      )
        .to.emit(governance, "AttributeMintPriceUpdated")
        .withArgs(ATTRIBUTE_AML, PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML], newPrice);
      expect(await governance.mintPricePerAttribute(ATTRIBUTE_AML)).to.equal(
        newPrice
      );
    });

    it("succeed (price 0)", async () => {
      const newPrice = parseEther("0");
      await expect(
        governance.connect(admin).setAttributeMintPrice(ATTRIBUTE_AML, newPrice)
      )
        .to.emit(governance, "AttributeMintPriceUpdated")
        .withArgs(ATTRIBUTE_AML, PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML], newPrice);
      expect(await governance.mintPricePerAttribute(ATTRIBUTE_AML)).to.equal(
        newPrice
      );
    });

    it("fail (not admin)", async () => {
      await expect(
        governance.setAttributeMintPrice(ATTRIBUTE_DID, 0)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (mint attribute price already set)", async () => {
      expect(await governance.mintPricePerAttribute(ATTRIBUTE_AML)).to.equal(
        PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML]
      );
      await expect(
        governance
          .connect(admin)
          .setAttributeMintPrice(
            ATTRIBUTE_AML,
            PRICE_SET_ATTRIBUTE[ATTRIBUTE_AML]
          )
      ).to.be.revertedWith("ATTRIBUTE_MINT_PRICE_ALREADY_SET");
    });
  });

  describe("setOracle", async () => {
    let newOracle: Contract;
    beforeEach(async () => {
      const UniswapAnchoredView = await ethers.getContractFactory(
        "UniswapAnchoredView"
      );
      newOracle = await UniswapAnchoredView.deploy();
      await newOracle.deployed();
    });
    it("succeed", async () => {
      expect(await governance.oracle()).to.equal(oracle.address);
      await expect(governance.connect(admin).setOracle(newOracle.address))
        .to.emit(governance, "OracleUpdated")
        .withArgs(oracle.address, newOracle.address);
    });

    it("fail (not a valid oracle)", async () => {
      await expect(governance.connect(admin).setOracle(deployer.address)).to.be
        .reverted;
    });

    it("fail (not admin)", async () => {
      await expect(governance.setOracle(newOracle.address)).to.be.revertedWith(
        "INVALID_ADMIN"
      );
    });

    it("fail (oracle already set)", async () => {
      await expect(
        governance.connect(admin).setOracle(oracle.address)
      ).to.be.revertedWith("ORACLE_ADDRESS_ALREADY_SET");
    });

    it("fail (address zero)", async () => {
      await expect(
        governance.connect(admin).setOracle(ethers.constants.AddressZero)
      ).to.be.revertedWith("ORACLE_ADDRESS_ZERO");
    });
  });

  describe("setIssuerStatus / getIssuerStatus", async () => {

    it("succeed - turns an active issuer into a decativated issuer", async () => {
      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.ACTIVE);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(true);

      await expect(governance.connect(admin).setIssuerStatus(issuer1.address, ISSUER_STATUS.DEACTIVATED))
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer1.address, ISSUER_STATUS.ACTIVE, ISSUER_STATUS.DEACTIVATED);


      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.DEACTIVATED);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(false);
    })

    it("succeed - turns a decativated issuer into an active issuer", async () => {
      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.ACTIVE);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(true);

      await expect(governance.connect(admin).setIssuerStatus(issuer1.address, ISSUER_STATUS.DEACTIVATED))
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer1.address, ISSUER_STATUS.ACTIVE, ISSUER_STATUS.DEACTIVATED);


      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.DEACTIVATED);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(false);

      await expect(governance.connect(admin).setIssuerStatus(issuer1.address, ISSUER_STATUS.ACTIVE))
        .to.emit(governance, "IssuerStatusChanged")
        .withArgs(issuer1.address, ISSUER_STATUS.DEACTIVATED, ISSUER_STATUS.ACTIVE);

      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.ACTIVE);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(true);

    })

    it("fail - cannot set active issuer to random status", async () => {
      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.ACTIVE);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(true);

      await expect(governance.connect(admin).setIssuerStatus(issuer1.address, 2)).to.be.reverted;

      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.ACTIVE);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(true);
    })

    it("fail - cannot set deactivated issuer to random status", async () => {
      await governance.connect(admin).setIssuerStatus(issuer1.address, ISSUER_STATUS.DEACTIVATED);

      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.DEACTIVATED);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(false);

      await expect(governance.connect(admin).setIssuerStatus(issuer1.address, 2)).to.be.reverted;

      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.DEACTIVATED);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(false);
    })

    it("fail - must be admin", async () => {
      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.ACTIVE);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(true);

      await expect(governance.connect(issuer1).setIssuerStatus(issuer1.address, 0))
        .to.be.revertedWith("INVALID_ADMIN");

      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.ACTIVE);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(true);
    })

    it("fail - must be valid value", async () => {
      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.ACTIVE);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(true);

      await expect(governance.connect(admin).setIssuerStatus(constants.AddressZero, 0))
        .to.be.revertedWith("ISSUER_ADDRESS_ZERO");

      expect(await governance.getIssuerStatus(issuer1.address)).equals(ISSUER_STATUS.ACTIVE);
      expect(await governance.hasRole(id("ISSUER_ROLE"), issuer1.address)).equals(true);
    });
  });

  describe("setIssuer", async () => {
    it("succeed", async () => {
      expect(await governance.issuersTreasury(newIssuer.address)).to.equal(
        ethers.constants.AddressZero
      );
      await expect(
        governance.connect(admin).setIssuer(newIssuer.address, newIssuerTreasury.address)
      )
        .to.emit(governance, "IssuerAdded")
        .withArgs(newIssuer.address, newIssuerTreasury.address);
      expect(await governance.issuersTreasury(newIssuer.address)).to.equal(
        newIssuerTreasury.address
      );
    });

    it("success (setIssuer maybe called multiple times without creating dupes)", async () => {
      expect(await governance.issuersTreasury(issuer1.address)).to.equal(issuerTreasury1.address);
      expect(await governance.getIssuersLength()).to.equal(3);
      await governance.connect(admin).setIssuer(issuer1.address, admin.address);

      expect(await governance.issuersTreasury(issuer1.address)).to.equal(admin.address);
      expect(await governance.getIssuersLength()).to.equal(3);
    });

    it("fail (issuer address (0))", async () => {
      await expect(
        governance
          .connect(admin)
          .setIssuer(ethers.constants.AddressZero, admin.address)
      ).to.revertedWith("ISSUER_ADDRESS_ZERO");
    });

    it("fail (treasury address (0))", async () => {
      await expect(
        governance
          .connect(admin)
          .setIssuer(newIssuer.address, ethers.constants.AddressZero)
      ).to.revertedWith("TREASURY_ISSUER_ADDRESS_ZERO");
    });

    it("fail (not admin)", async () => {
      await expect(
        governance.setIssuer(issuer1.address, admin.address)
      ).to.revertedWith("INVALID_ADMIN");
    });
  });

  describe("setRevSplitIssuer", async () => {
    it("succeed", async () => {
      expect(await governance.revSplitIssuer()).to.equal(ISSUER_SPLIT);
      const newRevSplit = 25;
      await expect(governance.connect(admin).setRevSplitIssuer(newRevSplit))
        .to.emit(governance, "RevenueSplitIssuerUpdated")
        .withArgs(ISSUER_SPLIT, newRevSplit);

      expect(await governance.revSplitIssuer()).to.equal(newRevSplit);
    });

    it("succeed (price 0)", async () => {
      const newRevSplit = 0;
      await expect(governance.connect(admin).setRevSplitIssuer(newRevSplit))
        .to.emit(governance, "RevenueSplitIssuerUpdated")
        .withArgs(ISSUER_SPLIT, newRevSplit);

      expect(await governance.revSplitIssuer()).to.equal(newRevSplit);
    });

    it("fail (not admin)", async () => {
      const newRevSplit = 0;
      await expect(
        governance.setRevSplitIssuer(newRevSplit)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (rev split already set)", async () => {
      await expect(
        governance.connect(admin).setRevSplitIssuer(ISSUER_SPLIT)
      ).to.be.revertedWith("REV_SPLIT_ALREADY_SET");
    });

    it("fail (rev split > 100)", async () => {
      await expect(
        governance.connect(admin).setRevSplitIssuer(101)
      ).to.be.revertedWith("SPLIT_MUST_BE_LESS_THAN_EQUAL_TO_100");
    });
  });

  describe("allowTokenPayment", async () => {
    let newToken: Contract;
    beforeEach(async () => {
      const ERC20 = await ethers.getContractFactory("USDC");
      newToken = await ERC20.deploy();
      await newToken.deployed();
    });

    it("succeed", async () => {
      expect(await governance.eligibleTokenPayments(usdc.address)).to.equal(
        true
      );
      expect(await governance.eligibleTokenPayments(newToken.address)).to.equal(
        false
      );
      await expect(
        governance.connect(admin).allowTokenPayment(newToken.address, true)
      ).to.emit(governance, "AllowTokenPayment").withArgs(newToken.address, true);

      expect(await governance.eligibleTokenPayments(usdc.address)).to.equal(
        true
      );

      await expect(
        governance.connect(admin).allowTokenPayment(newToken.address, false)
      ).to.emit(governance, "AllowTokenPayment").withArgs(newToken.address, false);

      expect(await governance.eligibleTokenPayments(newToken.address)).to.equal(
        false
      );
    });

    it("fail (not admin)", async () => {
      await expect(
        governance.allowTokenPayment(newToken.address, true)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail (token payment status already set)", async () => {
      await expect(
        governance.connect(admin).allowTokenPayment(usdc.address, true)
      ).to.be.revertedWith("TOKEN_PAYMENT_STATUS_SET");
    });

    it("fail (address zero)", async () => {
      await expect(
        governance
          .connect(admin)
          .allowTokenPayment(ethers.constants.AddressZero, true)
      ).to.be.revertedWith("TOKEN_PAYMENT_ADDRESS_ZERO");
    });

    it("fail (not ERC20)", async () => {
      await expect(
        governance.connect(admin).allowTokenPayment(deployer.address, true)
      ).to.be.reverted;
    });
  });

  describe("upgrade", async () => {
    it("succeed", async () => {
      const QuadGovernanceV2 = await ethers.getContractFactory(
        "QuadGovernanceV2"
      );
      await governance
        .connect(admin)
        .grantRole(GOVERNANCE_ROLE, deployer.address);
      const governanceV2 = await upgrades.upgradeProxy(
        governance.address,
        QuadGovernanceV2,
        { unsafeAllow: ['constructor'] }
        );
      expect(await governanceV2.getPriceETHV2()).to.equal(1337);
      expect(await governanceV2.oracle()).to.equal(oracle.address);
      expect(governanceV2.address).to.equal(governance.address);
    });

    it("fail (not admin)", async () => {
      const QuadGovernanceV2 = await ethers.getContractFactory(
        "QuadGovernanceV2"
      );
      await expect(
        upgrades.upgradeProxy(governance.address, QuadGovernanceV2, { unsafeAllow: ['constructor'] })
      ).to.revertedWith("INVALID_ADMIN");
    });
  });
});
