import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { parseEther } from "ethers/lib/utils";

const {
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_DID,
  DEFAULT_ADMIN_ROLE,
  GOVERNANCE_ROLE,
} = require("../../utils/constant.ts");

const {
  deployPassportAndGovernance,
} = require("../utils/deployment_and_init.ts");

const { deployGovernance } = require("../../utils/deployment.ts");

describe("QuadGovernance", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer: SignerWithAddress;
  const baseURI = "https://quadrata.io";

  beforeEach(async () => {
    [deployer, admin, issuer, treasury] = await ethers.getSigners();
    [governance, passport] = await deployPassportAndGovernance(
      admin,
      issuer,
      treasury,
      baseURI
    );
  });

  describe("initialize", async () => {
    it("success", async () => {
      expect(await governance.eligibleTokenId(1)).to.equal(true);
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
        .to.emit(governance, "TreasuryUpdateEvent")
        .withArgs(treasury.address, deployer.address);
      expect(await governance.treasury()).to.equal(deployer.address);
    });

    it("fail (not admin)", async () => {

    });

    it("fail (address zero)", async () => {

    });

    it("fail (treasury already set)", async () => {

    });
  });

  describe("setPassportContractAddress", async () => {
    it("succeed", async () => {
    });

    it("fail (not admin)", async () => {

    });

    it("fail (address zero)", async () => {

    });

    it("fail (passport already set)", async () => {

    });
  });

  describe("setPassportVersion", async () => {
    it("succeed", async () => {
    });

    it("fail (not admin)", async () => {

    });

    it("fail (version non-incremental)", async () => {

    });
  });

  describe("setMintPrice", async () => {
    it("succeed", async () => {
    });

    it("succeed (price zero)", async () => {
    });

    it("fail (not admin)", async () => {

    });

    it("fail (minting price already set)", async () => {

    });
  });

  describe("setEligibleTokenId", async () => {
    it("succeed", async () => {
    });

    it("fail (not admin)", async () => {

    });

    it("fail (token status already set)", async () => {

    });
  });

  describe("setEligibleAttribute", async () => {
    it("succeed", async () => {
    });

    it("succeed (getSupportedAttributeLength)", async () => {
    });


    it("fail (not admin)", async () => {

    });

    it("fail (attribute status already set)", async () => {

    });
  });

  describe("setEligibleAttributeByDID", async () => {
    it("succeed", async () => {
    });

    it("fail (not admin)", async () => {

    });

    it("fail (attribute status already set)", async () => {

    });
  });

  describe("setAttributePrice", async () => {
    it("succeed", async () => {
    });

    it("succeed (price 0)", async () => {
    });

    it("fail (not admin)", async () => {

    });

    it("fail (price  already set)", async () => {

    });
  });

  describe("setAttributeMintPrice", async () => {
    it("succeed", async () => {
    });

    it("succeed (price 0)", async () => {
    });

    it("fail (not admin)", async () => {

    });

    it("fail (mint attribute price already set)", async () => {

    });
  });

  describe("setOracle", async () => {
    it("succeed", async () => {
    });

    it("fail (not admin)", async () => {

    });

    it("fail (oracle already set)", async () => {

    });

    it("fail (address zero)", async () => {

    });
  });

  describe("setRevSplitIssuer", async () => {
    it("succeed", async () => {
    });

    it("succeed (price 0)", async () => {
    });

    it("fail (not admin)", async () => {

    });

    it("fail (rev split already set)", async () => {

    });
  });

  describe("allowTokenPayment", async () => {
    it("succeed", async () => {
    });

    it("fail (not admin)", async () => {

    });

    it("fail (token payment status already set)", async () => {

    });

    it("fail (address zero)", async () => {

    });

    it("fail (not ERC20)", async () => {

    });
  });
});
