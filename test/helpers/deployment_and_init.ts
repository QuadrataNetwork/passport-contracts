import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { id } from "ethers/lib/utils";
import { ethers } from "hardhat";

const {
  deployPassport,
  deployGovernance,
  deployReader,
} = require("../../utils/deployment.ts");

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_AML,
  ATTRIBUTE_IS_BUSINESS,
  PRICE_PER_ATTRIBUTES_ETH,
  PRICE_PER_BUSINESS_ATTRIBUTES_ETH,
} = require("../../utils/constant.ts");

export const deployPassportEcosystem = async (
  admin: SignerWithAddress,
  issuers: SignerWithAddress[],
  treasury: SignerWithAddress,
  issuerTreasuries: SignerWithAddress[]
): Promise<[Promise<Contract>, Promise<Contract>, Promise<Contract>, any]> => {
  // Deploy Governance
  const governance = await deployGovernance(admin);
  for (let i = 0; i < issuers.length; i++) {
    await governance
      .connect(admin)
      .addIssuer(issuers[i].address, issuerTreasuries[i].address);
  }

  // Deploy Passport
  const passport = await deployPassport(governance);
  await governance.connect(admin).setPassportContractAddress(passport.address);

  // Set Eligible Token
  await governance.connect(admin).setEligibleTokenId(1, true);

  // Set Eligible Attributes
  await governance.connect(admin).setEligibleAttribute(ATTRIBUTE_DID, true);
  await governance.connect(admin).setEligibleAttribute(ATTRIBUTE_COUNTRY, true);
  await governance
    .connect(admin)
    .setEligibleAttribute(ATTRIBUTE_IS_BUSINESS, true);
  await governance
    .connect(admin)
    .setEligibleAttributeByDID(ATTRIBUTE_AML, true);

  // Set Rev Split
  await governance.connect(admin).setRevSplitIssuer(50);

  // Set Query Price
  const attributeTypes = [ATTRIBUTE_DID, ATTRIBUTE_AML, ATTRIBUTE_COUNTRY];

  for (const attr of attributeTypes) {
    await governance
      .connect(admin)
      .setAttributePriceFixed(attr, PRICE_PER_ATTRIBUTES_ETH[attr]);

    await governance
      .connect(admin)
      .setBusinessAttributePriceFixed(
        attr,
        PRICE_PER_BUSINESS_ATTRIBUTES_ETH[attr]
      );
  }

  // Deploy Reader
  const reader = await deployReader(governance, passport);

  // Deploy QuadGovernance
  await governance.connect(admin).setTreasury(treasury.address);
  await governance.connect(admin).grantRole(id("READER_ROLE"), reader.address);

  // Deploy DeFi
  const DeFi = await ethers.getContractFactory("DeFi");
  const defi = await DeFi.deploy(passport.address, reader.address);
  await defi.deployed();

  return [governance, passport, reader, defi];
};
