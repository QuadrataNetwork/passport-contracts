import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { formatBytes32String, id, hexZeroPad } from "ethers/lib/utils";
const { Signer, DataHexString } = require("ethers");

const {
  MINT_PRICE,
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_COUNTRY,
  READER_ROLE,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

// const { signSetAttributes, signAccount } = require("../helpers/signature.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");
const { setAttributesIssuer } = require("../helpers/set_attributes_issuer.ts");

const {
  assertGetAttributes,
} = require("../helpers/assert/assert_get_attributes.ts");

const {
  assertGetAttributesLegacy,
} = require("../helpers/assert/assert_get_attributes_legacy.ts");

const {
  assertGetAttributesBulk,
} = require("../helpers/assert/assert_get_attributes_bulk.ts");

const {
  assertGetAttributesBulkLegacy,
} = require("../helpers/assert/assert_get_attributes_bulk_legacy.ts");

describe("QuadPassport.migrate", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let oldGov: Contract; // eslint-disable-line no-unused-vars
  let oldPassport: Contract; // eslint-disable-line no-unused-vars
  let oldReader: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let defi: Contract; // eslint-disable-line no-unused-vars
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
    [ATTRIBUTE_AML]: hexZeroPad("0x01", 32),
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
    [governance, passport, reader, defi] = await deployPassportEcosystem(
      admin,
      [issuer, issuer2],
      treasury,
      [issuerTreasury, issuerTreasury2]
    );

    issuedAt = Math.floor(new Date().getTime() / 1000) - 100;
    verifiedAt = Math.floor(new Date().getTime() / 1000) - 100;

    [oldGov, oldPassport, oldReader] = await deployAll(
      admin,
      [issuer],
      treasury,
      [issuerTreasury]
    );

    await oldGov.connect(admin).grantRole(READER_ROLE, passport.address);
    const sigIssuer = await signMint(
      issuer,
      minterA,
      1,
      attributes[ATTRIBUTE_DID],
      attributes[ATTRIBUTE_AML],
      attributes[ATTRIBUTE_COUNTRY],
      attributes[ATTRIBUTE_IS_BUSINESS],
      verifiedAt
    );
    const sigAccount = await signMessage(minterA, minterA.address);
    await oldPassport.mintPassport(
      [
        minterA.address,
        1,
        attributes[ATTRIBUTE_DID],
        attributes[ATTRIBUTE_AML],
        attributes[ATTRIBUTE_COUNTRY],
        attributes[ATTRIBUTE_IS_BUSINESS],
        verifiedAt,
      ],
      sigIssuer,
      sigAccount,
      { value: MINT_PRICE }
    );
  });

  describe("QuadPassport.migrate (success)", async () => {
    it("1 passport - getAttributes", async () => {
      await passport
        .connect(admin)
        .migrate([minterA.address], issuer.address, oldPassport.address);

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("1 passport - getAttributesLegacy", async () => {
      await passport
        .connect(admin)
        .migrate([minterA.address], issuer.address, oldPassport.address);

      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesLegacy(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("1 passport - getAttributesBulk", async () => {
      await passport
        .connect(admin)
        .migrate([minterA.address], issuer.address, oldPassport.address);

      await assertGetAttributesBulk(
        minterA,
        [ATTRIBUTE_COUNTRY],
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesBulk(
        minterA,
        [ATTRIBUTE_AML],
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesBulk(
        minterA,
        [ATTRIBUTE_DID],
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesBulk(
        minterA,
        [ATTRIBUTE_IS_BUSINESS],
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("1 passport - getAttributesBulkLegacy", async () => {
      await passport
        .connect(admin)
        .migrate([minterA.address], issuer.address, oldPassport.address);

      await assertGetAttributesBulkLegacy(
        minterA,
        [ATTRIBUTE_COUNTRY],
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesBulkLegacy(
        minterA,
        [ATTRIBUTE_AML],
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesBulkLegacy(
        minterA,
        [ATTRIBUTE_DID],
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributesBulkLegacy(
        minterA,
        [ATTRIBUTE_IS_BUSINESS],
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("2 passports", async () => {
      const attributes2: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:helloworlds"),
        [ATTRIBUTE_AML]: formatBytes32String("2"),
        [ATTRIBUTE_COUNTRY]: id("USA"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      const sigIssuer = await signMint(
        issuer,
        minterB,
        1,
        attributes2[ATTRIBUTE_DID],
        attributes2[ATTRIBUTE_AML],
        attributes2[ATTRIBUTE_COUNTRY],
        attributes2[ATTRIBUTE_IS_BUSINESS],
        verifiedAt + 2
      );
      const sigAccount = await signMessage(minterB, minterB.address);
      await oldPassport.mintPassport(
        [
          minterB.address,
          1,
          attributes2[ATTRIBUTE_DID],
          attributes2[ATTRIBUTE_AML],
          attributes2[ATTRIBUTE_COUNTRY],
          attributes2[ATTRIBUTE_IS_BUSINESS],
          verifiedAt + 2,
        ],
        sigIssuer,
        sigAccount,
        { value: MINT_PRICE }
      );
      await passport
        .connect(admin)
        .migrate(
          [minterA.address, minterB.address],
          issuer.address,
          oldPassport.address
        );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      await assertGetAttributes(
        minterB,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes2],
        [verifiedAt + 2]
      );
      await assertGetAttributes(
        minterB,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes2],
        [verifiedAt + 2]
      );
      await assertGetAttributes(
        minterB,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes2],
        [verifiedAt + 2]
      );
      await assertGetAttributes(
        minterB,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes2],
        [verifiedAt + 2]
      );
    });

    it("successfully overwrite 1 passport (setAttributes)", async () => {
      await passport
        .connect(admin)
        .migrate([minterA.address], issuer.address, oldPassport.address);
      const attributesToUpdate = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: hexZeroPad("0x05", 32),
        [ATTRIBUTE_COUNTRY]: id("CA"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributesToUpdate,
        verifiedAt + 10,
        issuedAt,
        MINT_PRICE,
        1
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesToUpdate],
        [verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesToUpdate],
        [verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesToUpdate],
        [verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("successfully add a 2nd issuers (setAttributes)", async () => {
      await passport
        .connect(admin)
        .migrate([minterA.address], issuer.address, oldPassport.address);

      const attributesToUpdate = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: hexZeroPad("0x05", 32),
        [ATTRIBUTE_COUNTRY]: id("CA"),
      };
      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributesToUpdate,
        verifiedAt + 10,
        issuedAt,
        MINT_PRICE,
        1
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("successfully add a 2nd issuers with different tokenId (setAttributes)", async () => {
      await passport
        .connect(admin)
        .migrate([minterA.address], issuer.address, oldPassport.address);

      await governance.connect(admin).setEligibleTokenId(2, true, "");

      const attributesToUpdate = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: hexZeroPad("0x05", 32),
        [ATTRIBUTE_COUNTRY]: id("CA"),
      };
      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributesToUpdate,
        verifiedAt + 10,
        issuedAt,
        MINT_PRICE,
        2
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      expect(await passport.balanceOf(minterA.address, 1)).equals(1);
      expect(await passport.balanceOf(minterA.address, 2)).equals(1);
    });

    it("successfully overwrite 1 passport (setAttributesIssuer)", async () => {
      await passport
        .connect(admin)
        .migrate([minterA.address], issuer.address, oldPassport.address);
      const attributesToUpdate = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: hexZeroPad("0x05", 32),
        [ATTRIBUTE_COUNTRY]: id("CA"),
      };
      await setAttributesIssuer(
        minterA,
        issuer,
        passport,
        attributesToUpdate,
        verifiedAt + 10,
        issuedAt,
        1
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesToUpdate],
        [verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesToUpdate],
        [verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer],
        [attributesToUpdate],
        [verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("successfully add a 2nd issuers (setAttributesIssuer)", async () => {
      await passport
        .connect(admin)
        .migrate([minterA.address], issuer.address, oldPassport.address);

      const attributesToUpdate = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: hexZeroPad("0x05", 32),
        [ATTRIBUTE_COUNTRY]: id("CA"),
      };
      await setAttributesIssuer(
        minterA,
        issuer2,
        passport,
        attributesToUpdate,
        verifiedAt + 10,
        issuedAt,
        1
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );
    });

    it("successfully add a 2nd issuers with different tokenId (setAttributesIssuer)", async () => {
      await passport
        .connect(admin)
        .migrate([minterA.address], issuer.address, oldPassport.address);

      await governance.connect(admin).setEligibleTokenId(2, true, "");

      const attributesToUpdate = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: hexZeroPad("0x05", 32),
        [ATTRIBUTE_COUNTRY]: id("CA"),
      };
      await setAttributesIssuer(
        minterA,
        issuer2,
        passport,
        attributesToUpdate,
        verifiedAt + 10,
        issuedAt,
        2
      );

      await assertGetAttributes(
        minterA,
        ATTRIBUTE_COUNTRY,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_AML,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_DID,
        reader,
        defi,
        treasury,
        [issuer, issuer2],
        [attributes, attributesToUpdate],
        [verifiedAt, verifiedAt + 10]
      );
      await assertGetAttributes(
        minterA,
        ATTRIBUTE_IS_BUSINESS,
        reader,
        defi,
        treasury,
        [issuer],
        [attributes],
        [verifiedAt]
      );

      expect(await passport.balanceOf(minterA.address, 1)).equals(1);
      expect(await passport.balanceOf(minterA.address, 2)).equals(1);
    });
  });
});

export const deployAll = async (
  admin: SignerWithAddress,
  issuers: SignerWithAddress[],
  treasury: SignerWithAddress,
  issuerTreasuries: SignerWithAddress[]
) => {
  // Deploy Governance
  const governance = await deployGovernanceOld(admin);
  for (let i = 0; i < issuers.length; i++) {
    await governance
      .connect(admin)
      .setIssuer(issuers[i].address, issuerTreasuries[i].address);
  }

  // Deploy Passport
  const passport = await deployPassportOld(governance);
  await governance.connect(admin).setPassportContractAddress(passport.address);

  // Deploy Reader
  const reader = await deployReaderOld(governance, passport);

  // Deploy QuadGovernance
  await governance.connect(admin).setTreasury(treasury.address);
  await governance.connect(admin).grantRole(id("READER_ROLE"), reader.address);

  return [governance, passport, reader];
};

const deployPassportOld = async (governance: Contract): Promise<Contract> => {
  const QuadPassportOld = await ethers.getContractFactory("QuadPassportOld");
  const passport = await upgrades.deployProxy(
    QuadPassportOld,
    [governance.address, "https://quadrata.com"],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor"] }
  );
  await passport.deployed();
  return passport;
};

const deployGovernanceOld = async (
  admin: SignerWithAddress
): Promise<Contract> => {
  const QuadGovernanceOld = await ethers.getContractFactory(
    "QuadGovernanceOld"
  );
  const governance = await upgrades.deployProxy(
    QuadGovernanceOld,
    [admin.address],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor"] }
  );
  await governance.deployed();
  return governance;
};

const deployReaderOld = async (
  governance: Contract,
  passport: Contract
): Promise<Contract> => {
  const QuadReaderOld = await ethers.getContractFactory("QuadReaderOld");
  const reader = await upgrades.deployProxy(
    QuadReaderOld,
    [governance.address, passport.address],
    { initializer: "initialize", kind: "uups", unsafeAllow: ["constructor"] }
  );
  await reader.deployed();
  return reader;
};

const signMessage = async (
  signer: typeof Signer,
  message: typeof DataHexString
): Promise<typeof DataHexString> => {
  const hash = ethers.utils.keccak256(message);
  const sig = await signer.signMessage(ethers.utils.arrayify(hash));
  return sig;
};

const signMint = async (
  issuer: typeof Signer,
  minter: typeof Signer,
  tokenId: number,
  quadDID: typeof DataHexString,
  aml: typeof DataHexString,
  country: typeof DataHexString,
  isBusiness: typeof DataHexString,
  issuedAt: number
): Promise<typeof DataHexString> => {
  const hash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      [
        "address",
        "uint256",
        "bytes32",
        "bytes32",
        "bytes32",
        "bytes32",
        "uint256",
      ],
      [minter.address, tokenId, quadDID, aml, country, isBusiness, issuedAt]
    )
  );
  const sig = await issuer.signMessage(ethers.utils.arrayify(hash));

  return sig;
};
