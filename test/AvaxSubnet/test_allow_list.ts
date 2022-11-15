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
  READER_ROLE,
  TOKEN_ID,
  HARDHAT_CHAIN_ID,
} = require("../../utils/constant.ts");

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");
const { setAttributesIssuer } = require("../helpers/set_attributes_issuer.ts");
const { setAttributesBulk } = require("../helpers/set_attributes_bulk.ts");

const ROLES = {
  NONE: 0,
  ALLOWED: 1,
  ADMIN: 2,
};

const ALLOW_LIST_AML_THRESHOLD = 5;

describe("AllowList", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let defi: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuer: SignerWithAddress,
    issuer2: SignerWithAddress,
    issuerTreasury: SignerWithAddress,
    issuerTreasury2: SignerWithAddress,
    mockReader: SignerWithAddress;

  let issuedAt: number, verifiedAt: number;
  const attributes: any = {
    [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
    [ATTRIBUTE_AML]: formatBytes32String("1"),
    [ATTRIBUTE_COUNTRY]: id("FRANCE"),
    [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
  };

  let allowList: Contract;

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
      mockReader,
    ] = await ethers.getSigners();

    [governance, passport, reader, defi] = await deployPassportEcosystem(
      admin,
      [issuer, issuer2],
      treasury,
      [issuerTreasury, issuerTreasury2]
    );

    issuedAt = Math.floor(new Date().getTime() / 1000) - 100;
    verifiedAt = Math.floor(new Date().getTime() / 1000) - 100;

    await governance.connect(admin).grantRole(READER_ROLE, mockReader.address);

    const TX_ALLOW_LIST_ADDRESS = "0x0200000000000000000000000000000000000002";
    await governance
      .connect(admin)
      .setAllowListAMLThreshold(ALLOW_LIST_AML_THRESHOLD);

    allowList = await ethers.getContractAt(
      "IAllowList",
      TX_ALLOW_LIST_ADDRESS,
      admin
    );
  });

  describe("setAttributes (AllowList)", async () => {
    beforeEach(async () => {});

    it("precompile should see admin address has admin role", async function () {
      // test precompile first
      const adminRole = await allowList.readAllowList(admin.address);
      expect(adminRole).to.be.equal(ROLES.ADMIN);
    });

    it("setAttributes (AML below threshold)", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("3"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);
    });

    it("setAttributes (AML above threshold)", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("6"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);
    });

    it("setAttributes (Multiple issuers for exact same Attribute: AML 1 and then AML 6", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("1"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);

      const attributes2: any = {
        [ATTRIBUTE_AML]: formatBytes32String("6"),
      };
      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributes2,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
    });

    it("setAttributes (Multiple issuers for exact same Attribute: AML 6 and then AML 1", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("6"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes2: any = {
        [ATTRIBUTE_AML]: formatBytes32String("1"),
      };
      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributes2,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
    });

    it("setAttributes (single issuer override AML 6 and then AML 1", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("6"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes2: any = {
        [ATTRIBUTE_AML]: formatBytes32String("1"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes2,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);
    });

    it("setAttributes (single issuer override AML 1 and then AML 6", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("1"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);

      const attributes2: any = {
        [ATTRIBUTE_AML]: formatBytes32String("6"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes2,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
    });

    it("setAttributes (fee = 0)", async () => {
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        0
      );

      const role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);
    });

    it("setAttributes (no AML)", async () => {
      const attributes: any = {
        [ATTRIBUTE_IS_BUSINESS]: id("TRUE"),
      };
      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      const role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
    });
  });

  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>      setAttributesIssuer   <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //

  describe("QuadPassport.setAttributesIssuer", async () => {
    it("setAttributesIssuer (AML below threshold)", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("3"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributesIssuer(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );
      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);
    });

    it("setAttributesIssuer (AML above threshold)", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("6"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributesIssuer(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);
    });

    it("setAttributesIssuer - fail to revoke ADMIN Allowlist from QuadPassport contract address", async () => {
      let role = await allowList.readAllowList(passport.address);
      expect(role).to.be.equal(ROLES.ADMIN);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("6"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await expect(
        setAttributesIssuer(
          passport,
          issuer,
          passport,
          attributes,
          verifiedAt,
          issuedAt
        )
      ).to.be.revertedWith("CANNOT_REVOKE_ALLOWLIST_QP");

      role = await allowList.readAllowList(passport.address);
      expect(role).to.be.equal(ROLES.ADMIN);
    });
  });

  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>      setAttributesBulk   <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //

  describe("QuadPassport.setAttributesBulk", async () => {
    it("setAttributesBulk (AML below threshold)", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("3"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributesBulk(
        passport,
        minterA,
        [issuer],
        [attributes],
        [verifiedAt],
        [issuedAt],
        [MINT_PRICE],
        [TOKEN_ID],
        [HARDHAT_CHAIN_ID]
      );
      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);
    });

    it("setAttributesBulk (AML above threshold)", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("6"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributesBulk(
        passport,
        minterA,
        [issuer],
        [attributes],
        [verifiedAt],
        [issuedAt],
        [MINT_PRICE],
        [TOKEN_ID],
        [HARDHAT_CHAIN_ID]
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);
    });

    it("setAttributesBulk multiple (AML above threshold)", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("6"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      const attributes2: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("1"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributesBulk(
        passport,
        minterA,
        [issuer, issuer2],
        [attributes, attributes2],
        [verifiedAt, verifiedAt],
        [issuedAt, issuedAt],
        [MINT_PRICE, MINT_PRICE],
        [TOKEN_ID, TOKEN_ID],
        [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID]
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
    });

    it("setAttributesBulk multiple (AML below threshold)", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("3"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      const attributes2: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("4"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributesBulk(
        passport,
        minterA,
        [issuer, issuer2],
        [attributes, attributes2],
        [verifiedAt, verifiedAt],
        [issuedAt, issuedAt],
        [MINT_PRICE, MINT_PRICE],
        [TOKEN_ID, TOKEN_ID],
        [HARDHAT_CHAIN_ID, HARDHAT_CHAIN_ID]
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);
    });
  });

  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>      burnPassports   <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //

  describe("QuadPassport.burnPassports (AllowList)", async () => {
    it("burnPassports", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("3"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);

      await passport.connect(minterA).burnPassports();

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
    });
  });

  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>      burnPassportsIssuer   <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //

  describe("QuadPassport.burnPassportsIssuer (AllowList)", async () => {
    it("burnPassportsIssuer - single issuer", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("3"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);

      await passport.connect(issuer).burnPassportsIssuer(minterA.address);

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
    });

    it("burnPassportsIssuer - multiple issuer (remain allowlist)", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("3"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      const attributes2: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("5"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributes2,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);

      await passport.connect(issuer).burnPassportsIssuer(minterA.address);

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);
    });

    it("burnPassportsIssuer - multiple issuer (switch to allowlist)", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("6"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      const attributes2: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("5"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributes2,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      await passport.connect(issuer).burnPassportsIssuer(minterA.address);

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.ALLOWED);
    });

    it("burnPassportsIssuer - multiple issuer (remain revoke to allowlist)", async () => {
      let role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      const attributes: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("6"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer,
        passport,
        attributes,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      const attributes2: any = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:foobar"),
        [ATTRIBUTE_AML]: formatBytes32String("7"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };

      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributes2,
        verifiedAt,
        issuedAt,
        MINT_PRICE
      );

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);

      await passport.connect(issuer).burnPassportsIssuer(minterA.address);

      role = await allowList.readAllowList(minterA.address);
      expect(role).to.be.equal(ROLES.NONE);
    });
  });

  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>      setAllowListAMLThreshold   <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //
  // ******************************************************************************* //

  describe("QuadGovernance.setAllowListAMLThreshold", async () => {
    it("setAllowListAMLThreshold - success", async () => {
      let threshold = await governance.getAllowListAMLThreshold();
      expect(threshold).to.equal(ALLOW_LIST_AML_THRESHOLD);

      await governance.connect(admin).setAllowListAMLThreshold(6);
      threshold = await governance.getAllowListAMLThreshold();
      expect(threshold).to.equal(6);
    });

    it("setAllowListAMLThreshold - error (not admin)", async () => {
      await expect(
        governance.connect(minterA).setAllowListAMLThreshold(6)
      ).to.be.revertedWith("INVALID_ADMIN");
    });

    it("setAllowListAMLThreshold - too low", async () => {
      await expect(
        governance.connect(admin).setAllowListAMLThreshold(0)
      ).to.be.revertedWith("THRESHOLD_TOO_LOW");
    });

    it("setAllowListAMLThreshold - too high", async () => {
      await expect(
        governance.connect(admin).setAllowListAMLThreshold(0)
      ).to.be.revertedWith("THRESHOLD_TOO_HIGH");
    });
  });
});