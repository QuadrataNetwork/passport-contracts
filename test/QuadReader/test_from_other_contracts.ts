import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  formatBytes32String,
  id,
  parseEther,
  hexZeroPad,
} from "ethers/lib/utils";

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

describe("QuadReader.getAttributes", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let testContract: Contract; // eslint-disable-line no-unused-vars
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
    [ATTRIBUTE_AML]: hexZeroPad("0x05", 32),
    [ATTRIBUTE_COUNTRY]: id("US"),
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
    [governance, passport, reader] = await deployPassportEcosystem(
      admin,
      [issuer, issuer2],
      treasury,
      [issuerTreasury, issuerTreasury2]
    );

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

    // Deploy DeFi
    const TestContract = await ethers.getContractFactory("TestQuadrata");
    testContract = await TestContract.deploy();
    await testContract.deployed();
    await testContract.setReader(reader.address);
    expect(await testContract.reader()).equals(reader.address);
  });

  describe("TestQuadrata - 1 issuer / 1 attributes", async () => {
    it("TestQuadrata.checkValues (AML)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_AML,
          attributes[ATTRIBUTE_AML],
          0,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
      await expect(
        testContract.checkValuesInt(minterA.address, ATTRIBUTE_AML, 5, 0, {
          value: parseEther("1"),
        })
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkValues (COUNTRY)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_COUNTRY,
          attributes[ATTRIBUTE_COUNTRY],
          0,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkValues (IS_BUSINESS)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_IS_BUSINESS,
          attributes[ATTRIBUTE_IS_BUSINESS],
          0,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkValues (DID)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_DID,
          attributes[ATTRIBUTE_DID],
          0,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkIssuer", async () => {
      await expect(
        testContract.checkIssuer(
          minterA.address,
          ATTRIBUTE_AML,
          issuer.address,
          0,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkBeforeEpoch", async () => {
      await expect(
        testContract.checkBeforeEpoch(
          minterA.address,
          ATTRIBUTE_AML,
          verifiedAt + 1,
          0,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkNumberAttributes", async () => {
      await expect(
        testContract.checkNumberAttributes(minterA.address, ATTRIBUTE_AML, 1, {
          value: parseEther("1"),
        })
      ).to.not.be.reverted;
    });
  });

  describe("TestQuadrata - 2 issuers / 2 attributes", async () => {
    let attributes2: any;
    beforeEach(async () => {
      attributes2 = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: hexZeroPad("0x0a", 32),
        [ATTRIBUTE_COUNTRY]: id("FR"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributes2,
        verifiedAt + 2,
        issuedAt + 2,
        MINT_PRICE
      );
    });
    it("TestQuadrata.checkValues (AML)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_AML,
          attributes[ATTRIBUTE_AML],
          0,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_AML,
          attributes2[ATTRIBUTE_AML],
          1,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
      await expect(
        testContract.checkValuesInt(minterA.address, ATTRIBUTE_AML, 5, 0, {
          value: parseEther("1"),
        })
      ).to.not.be.reverted;
      await expect(
        testContract.checkValuesInt(minterA.address, ATTRIBUTE_AML, 10, 1, {
          value: parseEther("1"),
        })
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkValues (COUNTRY)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_COUNTRY,
          attributes[ATTRIBUTE_COUNTRY],
          0,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_COUNTRY,
          attributes2[ATTRIBUTE_COUNTRY],
          1,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkValues (IS_BUSINESS)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_IS_BUSINESS,
          attributes[ATTRIBUTE_IS_BUSINESS],
          0,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_IS_BUSINESS,
          attributes2[ATTRIBUTE_IS_BUSINESS],
          1,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkValues (DID)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_DID,
          attributes[ATTRIBUTE_DID],
          0,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_DID,
          attributes[ATTRIBUTE_DID],
          1,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkIssuer", async () => {
      await expect(
        testContract.checkIssuer(
          minterA.address,
          ATTRIBUTE_AML,
          issuer.address,
          0,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;

      await expect(
        testContract.checkIssuer(
          minterA.address,
          ATTRIBUTE_AML,
          issuer2.address,
          1,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkBeforeEpoch", async () => {
      await expect(
        testContract.checkBeforeEpoch(
          minterA.address,
          ATTRIBUTE_AML,
          verifiedAt + 3,
          1,
          { value: parseEther("1") }
        )
      ).to.not.be.reverted;
    });

    it("TestQuadrata.checkNumberAttributes", async () => {
      await expect(
        testContract.checkNumberAttributes(minterA.address, ATTRIBUTE_AML, 2, {
          value: parseEther("1"),
        })
      ).to.not.be.reverted;
    });
  });

  describe("TestQuadrata - errors", async () => {
    let attributes2: any;
    beforeEach(async () => {
      attributes2 = {
        [ATTRIBUTE_DID]: attributes[ATTRIBUTE_DID],
        [ATTRIBUTE_AML]: hexZeroPad("0x0a", 32),
        [ATTRIBUTE_COUNTRY]: id("FR"),
        [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
      };
      await setAttributes(
        minterA,
        issuer2,
        passport,
        attributes2,
        verifiedAt + 2,
        issuedAt + 2,
        MINT_PRICE
      );
    });
    it("TestQuadrata.checkValues (AML)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_AML,
          attributes2[ATTRIBUTE_AML],
          0,
          { value: parseEther("1") }
        )
      ).to.be.revertedWith("MISMATCH_VALUE");

      await expect(
        testContract.checkValuesInt(minterA.address, ATTRIBUTE_AML, 10, 0, {
          value: parseEther("1"),
        })
      ).to.be.revertedWith("MISMATCH_VALUE");

      await expect(
        testContract.checkValuesInt(minterA.address, ATTRIBUTE_AML, 10, 3, {
          value: parseEther("1"),
        })
      ).to.be.revertedWith("NO_ATTRIBUTE_FOUND");
    });

    it("TestQuadrata.checkValues (COUNTRY)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_COUNTRY,
          attributes2[ATTRIBUTE_COUNTRY],
          0,
          { value: parseEther("1") }
        )
      ).to.be.revertedWith("MISMATCH_VALUE");
    });

    it("TestQuadrata.checkValues (IS_BUSINESS)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_IS_BUSINESS,
          id("HELLO"),
          0,
          { value: parseEther("1") }
        )
      ).to.be.revertedWith("MISMATCH_VALUE");
    });

    it("TestQuadrata.checkValues (DID)", async () => {
      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_DID,
          formatBytes32String("hello"),
          0,
          { value: parseEther("1") }
        )
      ).to.be.revertedWith("MISMATCH_VALUE");

      await expect(
        testContract.checkValues(
          minterA.address,
          ATTRIBUTE_DID,
          formatBytes32String("hello"),
          3,
          { value: parseEther("1") }
        )
      ).to.be.revertedWith("NO_ATTRIBUTE_FOUND");
    });

    it("TestQuadrata.checkIssuer", async () => {
      await expect(
        testContract.checkIssuer(
          minterA.address,
          ATTRIBUTE_AML,
          issuer2.address,
          0,
          { value: parseEther("1") }
        )
      ).to.be.revertedWith("MISMATCH_ISSUER");

      await expect(
        testContract.checkIssuer(
          minterA.address,
          ATTRIBUTE_AML,
          issuer.address,
          1,
          { value: parseEther("1") }
        )
      ).to.be.revertedWith("MISMATCH_ISSUER");

      await expect(
        testContract.checkIssuer(
          minterA.address,
          ATTRIBUTE_AML,
          issuer.address,
          2,
          { value: parseEther("1") }
        )
      ).to.be.revertedWith("NO_ATTRIBUTE_FOUND");
    });

    it("TestQuadrata.checkBeforeEpoch", async () => {
      await expect(
        testContract.checkBeforeEpoch(
          minterA.address,
          ATTRIBUTE_AML,
          verifiedAt,
          1,
          { value: parseEther("1") }
        )
      ).to.be.revertedWith("MISMATCH_EPOCH");

      await expect(
        testContract.checkBeforeEpoch(
          minterA.address,
          ATTRIBUTE_AML,
          verifiedAt,
          3,
          { value: parseEther("1") }
        )
      ).to.be.revertedWith("NO_ATTRIBUTE_FOUND");
    });

    it("TestQuadrata.checkNumberAttributes", async () => {
      await expect(
        testContract.checkNumberAttributes(minterA.address, ATTRIBUTE_AML, 3, {
          value: parseEther("1"),
        })
      ).to.be.revertedWith("INVALID_NUMBER_ATTRIBUTES");
    });
  });
});
