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
  PRICE_PER_BUSINESS_ATTRIBUTES_ETH,
  GOVERNANCE_ROLE,
  DEFAULT_ADMIN_ROLE,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { deployGovernance } = require("../../utils/deployment.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");
const { setAttributesIssuer } = require("../helpers/set_attributes_issuer.ts");

describe("QuadReader.queryFeeBulk", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let defi: Contract; // eslint-disable-line no-unused-vars
  let businessPassport: Contract; // eslint-disable-line no-unused-vars
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
    [ATTRIBUTE_DID]: formatBytes32String("did:quad:helloworld"),
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
    [governance, passport, reader, defi, businessPassport] =
      await deployPassportEcosystem(admin, [issuer, issuer2], treasury, [
        issuerTreasury,
        issuerTreasury2,
      ]);

    issuedAt = Math.floor(new Date().getTime() / 1000) - 5000;
    verifiedAt = Math.floor(new Date().getTime() / 1000) - 5000;

    await setAttributes(
      minterA,
      issuer,
      passport,
      attributes,
      verifiedAt,
      issuedAt,
      MINT_PRICE
    );

    const attributesCopy = Object.assign({}, attributes);
    attributesCopy[ATTRIBUTE_IS_BUSINESS] = id("TRUE");
    attributesCopy[ATTRIBUTE_DID] = formatBytes32String("quad:did:business");
    await setAttributesIssuer(
      businessPassport,
      issuer,
      passport,
      attributesCopy,
      verifiedAt,
      issuedAt
    );
  });

  describe("queryFeeBulk", async () => {
    it("success (EOA)", async () => {
      let totalFee = ethers.utils.parseEther("0");
      Object.keys(attributes).forEach((attrType) => {
        totalFee = totalFee.add(PRICE_PER_ATTRIBUTES_ETH[attrType]);
      });

      expect(
        await reader.queryFeeBulk(minterA.address, Object.keys(attributes))
      ).to.equal(totalFee);
    });

    it("success (Business SC)", async () => {
      let totalFee = ethers.utils.parseEther("0");
      Object.keys(attributes).forEach(async (attrType) => {
        totalFee = totalFee.add(PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attrType]);
      });

      expect(
        await reader.queryFeeBulk(
          businessPassport.address,
          Object.keys(attributes)
        )
      ).to.equal(totalFee);
    });

    it("fail - governance incorrectly set", async () => {
      const newGovernance = await deployGovernance();
      await newGovernance.grantRole(GOVERNANCE_ROLE, admin.address);
      await newGovernance.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
      await newGovernance.revokeRole(GOVERNANCE_ROLE, deployer.address);
      await newGovernance.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);

      await governance
        .connect(admin)
        .updateGovernanceInPassport(newGovernance.address);

      await newGovernance
        .connect(admin)
        .setPassportContractAddress(passport.address);
      await newGovernance.connect(admin).acceptGovernanceInPassport();

      await expect(
        reader.queryFeeBulk(minterA.address, Object.keys(attributes))
      ).to.revertedWith("INVALID_READER");
    });

    it("fail - invalid attributes", async () => {
      await governance
        .connect(admin)
        .setEligibleAttribute(ATTRIBUTE_COUNTRY, false);

      expect(await governance.eligibleAttributes(ATTRIBUTE_COUNTRY)).to.equal(
        false
      );
      await expect(
        reader.queryFeeBulk(minterA.address, Object.keys(attributes))
      ).to.revertedWith("ATTRIBUTE_NOT_ELIGIBLE");
    });
  });
});
