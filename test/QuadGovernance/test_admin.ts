import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
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
  PRICE_SET_ATTRIBUTE,
  ISSUER_SPLIT,
  ATTRIBUTE_IS_BUSINESS,
  PRICE_PER_BUSINESS_ATTRIBUTES
} = require("../../utils/constant.ts");

const {
  deployPassportAndGovernance,
} = require("../utils/deployment_and_init.ts");

const { deployGovernance } = require("../../utils/deployment.ts");

describe("QuadGovernance", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let oracle: Contract;
  let usdc: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;
  const baseURI = "https://quadrata.io";

  beforeEach(async () => {
    [deployer, admin, issuer, treasury, issuerTreasury] =
      await ethers.getSigners();
    [governance, passport, usdc, , oracle] = await deployPassportAndGovernance(
      admin,
      issuer,
      treasury,
      issuerTreasury,
      baseURI
    );
  });

  describe("initialize", async () => {
    it("success", async () => {
      expect(await governance.eligibleTokenId(TOKEN_ID)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_DID)).to.equal(
        false
      );
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        true
      );
      expect(
        await governance.eligibleAttributesByDID(ATTRIBUTE_COUNTRY)
      ).to.equal(false);
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_AML)).to.equal(
        true
      );
      expect(await governance.eligibleAttributes(ATTRIBUTE_AML)).to.equal(
        false
      );
      expect(await governance.mintPricePerAttribute(ATTRIBUTE_AML)).to.equal(
        parseEther("0.01")
      );
      expect(
        await governance.mintPricePerAttribute(ATTRIBUTE_COUNTRY)
      ).to.equal(parseEther("0.01"));
      expect(await governance.passportVersion()).to.equal(1);
      expect(await governance.revSplitIssuer()).to.equal(50);
      expect(await governance.hasRole(GOVERNANCE_ROLE, admin.address)).to.equal(
        true
      );
      expect(
        await governance.hasRole(DEFAULT_ADMIN_ROLE, admin.address)
      ).to.equal(true);
    });
  });

  describe("updateGovernanceInPassport", async () => {
    it("success", async () => {
      expect(await passport.governance()).to.equal(governance.address);
      await expect(
        governance.connect(admin).updateGovernanceInPassport(deployer.address)
      )
        .to.emit(passport, "GovernanceUpdated")
        .withArgs(governance.address, deployer.address);
      expect(await passport.governance()).to.equal(deployer.address);
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

  describe("setPassportVersion", async () => {
    it("succeed", async () => {
      expect(await governance.passportVersion()).to.equal(1);
      await expect(governance.connect(admin).setPassportVersion(2))
        .to.emit(governance, "PassportVersionUpdated")
        .withArgs(1, 2);
      expect(await governance.passportVersion()).to.equal(2);
    });

    it("fail (not admin)", async () => {
      await expect(governance.setPassportVersion(2)).to.be.revertedWith(
        "INVALID_ADMIN"
      );
    });

    it("fail (version non-incremental)", async () => {
      await expect(
        governance.connect(admin).setPassportVersion(0)
      ).to.be.revertedWith("PASSPORT_VERSION_INCREMENTAL");
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
      )
        .to.emit(governance, "EligibleAttributeUpdated")
        .withArgs(newAttribute, true);
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
      expect(await governance.getSupportedAttributesLength()).to.equal(2);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        true
      );
      expect(await governance.supportedAttributes(0)).to.equal(ATTRIBUTE_DID);
      expect(await governance.supportedAttributes(1)).to.equal(
        ATTRIBUTE_COUNTRY
      );
      await expect(
        governance.connect(admin).setEligibleAttribute(ATTRIBUTE_COUNTRY, false)
      )
        .to.emit(governance, "EligibleAttributeUpdated")
        .withArgs(ATTRIBUTE_COUNTRY, false);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        false
      );
      expect(await governance.supportedAttributes(0)).to.equal(ATTRIBUTE_DID);
      expect(await governance.getSupportedAttributesLength()).to.equal(1);
    });

    it("succeed (turn false  - first element)", async () => {
      expect(await governance.getSupportedAttributesLength()).to.equal(2);
      expect(await governance.eligibleAttributes(ATTRIBUTE_DID)).to.equal(true);
      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        true
      );
      expect(await governance.supportedAttributes(0)).to.equal(ATTRIBUTE_DID);
      expect(await governance.supportedAttributes(1)).to.equal(
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
      expect(await governance.supportedAttributes(0)).to.equal(
        ATTRIBUTE_COUNTRY
      );
      expect(await governance.getSupportedAttributesLength()).to.equal(1);
    });

    it("succeed (getSupportedAttributesLength)", async () => {
      expect(await governance.getSupportedAttributesLength()).to.equal(2);
      const newAttribute = ethers.utils.id("CREDIT");
      expect(
        await governance.connect(admin).setEligibleAttribute(newAttribute, true)
      );
      expect(await governance.getSupportedAttributesLength()).to.equal(3);
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
      expect(await governance.eligibleAttributesByDID(newAttribute)).to.equal(
        false
      );
      expect(await governance.eligibleAttributesByDID(ATTRIBUTE_AML)).to.equal(
        true
      );
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

      await expect(
        governance
          .connect(admin)
          .setBusinessAttributePrice(
            ATTRIBUTE_DID,
            parseUnits(PRICE_PER_BUSINESS_ATTRIBUTES[ATTRIBUTE_DID].toString(), 6)
          )
      ).to.be.revertedWith("ATTRIBUTE_PRICE_ALREADY_SET");
    });
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

  describe("addIssuer", async () => {
    it("succeed", async () => {
      expect(await governance.issuersTreasury(issuer.address)).to.equal(
        issuerTreasury.address
      );
      await expect(
        governance.connect(admin).addIssuer(issuer.address, admin.address)
      )
        .to.emit(governance, "IssuerAdded")
        .withArgs(issuer.address, admin.address);
      expect(await governance.issuersTreasury(issuer.address)).to.equal(
        admin.address
      );
    });

    it("fail (issuer address (0))", async () => {
      await expect(
        governance
          .connect(admin)
          .addIssuer(ethers.constants.AddressZero, admin.address)
      ).to.revertedWith("ISSUER_ADDRESS_ZERO");
    });

    it("fail (treasury address (0))", async () => {
      await expect(
        governance
          .connect(admin)
          .addIssuer(issuer.address, ethers.constants.AddressZero)
      ).to.revertedWith("TREASURY_ISSUER_ADDRESS_ZERO");
    });

    it("fail (not admin)", async () => {
      await expect(
        governance.addIssuer(issuer.address, admin.address)
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
      ).to.be.revertedWith("SPLIT_MUST_BE_LESS_THAN_100");
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
      )
        .to.emit(governance, "AllowTokenPayment")
        .withArgs(newToken.address, true);
      expect(await governance.eligibleTokenPayments(usdc.address)).to.equal(
        true
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
        QuadGovernanceV2
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
        upgrades.upgradeProxy(governance.address, QuadGovernanceV2)
      ).to.revertedWith("INVALID_ADMIN");
    });
  });
});
