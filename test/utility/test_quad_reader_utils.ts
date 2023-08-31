import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";
import { BytesLike } from "@ethersproject/bytes";

describe.skip("QuadReaderUtils()", function () {
  let TestQueryUtils;
  let signers;
  let testQuadReaderUtilsInstance: Contract;

  beforeEach(async () => {
    signers = await ethers.getSigners();

    const QuadReaderUtils = await ethers.getContractFactory("QuadReaderUtils");
    const quadReaderUtilsInstance = await QuadReaderUtils.deploy();
    await quadReaderUtilsInstance.deployed();

    TestQueryUtils = await ethers.getContractFactory("TestQuadReaderUtils", {
      libraries: {
        QuadReaderUtils: quadReaderUtilsInstance.address,
      },
    });

    testQuadReaderUtilsInstance = await TestQueryUtils.deploy();
    await testQuadReaderUtilsInstance.deployed();
  });

  describe("isBusinessTrue()", function () {
    it("asserts correct isBusinessTrue value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.isBusinessTrue(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TRUE"))
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.isBusinessTrue(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("FALSE"))
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.isBusinessTrue(
          ethers.constants.HashZero
        )
      ).eql([false]);
    });
  });

  describe("isBusinessFalse()", function () {
    it("asserts correct isBusinessFalse value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.isBusinessFalse(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TRUE"))
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.isBusinessFalse(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("FALSE"))
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.isBusinessFalse(
          ethers.constants.HashZero
        )
      ).eql([true]);
    });
  });

  describe("countryIsEqual()", function () {
    it("asserts correct countryIsEqual value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.countryIsEqual(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("US")),
          "US"
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.countryIsEqual(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CA")),
          "US"
        )
      ).eql([false]);
    });
  });

  describe("amlIsEqual()", function () {
    it("asserts correct amlIsEqual value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.amlIsEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlIsEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          2
        )
      ).eql([false]);
    });
  });

  describe("amlGreaterThan()", function () {
    it("asserts correct amlGreaterThan value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.amlGreaterThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlGreaterThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          10
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlGreaterThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          2
        )
      ).eql([true]);
    });
  });

  describe("amlGreaterThanEqual()", function () {
    it("asserts correct amlGreaterThanEqual value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.amlGreaterThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlGreaterThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          10
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlGreaterThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          2
        )
      ).eql([true]);
    });
  });

  describe("amlLessThan()", function () {
    it("asserts correct amlLessThan value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.amlLessThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlLessThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          10
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlLessThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          2
        )
      ).eql([false]);
    });
  });

  describe("amlLessThanEqual()", function () {
    it("asserts correct amlLessThanEqual value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.amlLessThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlLessThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          10
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlLessThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          2
        )
      ).eql([false]);
    });
  });

  describe("amlBetweenInclusive()", function () {
    it("asserts correct amlBetweenInclusive value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.amlBetweenInclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8,
          10
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlBetweenInclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          6,
          8
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlBetweenInclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          4,
          10
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlBetweenInclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          9,
          10
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlBetweenInclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          1,
          4
        )
      ).eql([false]);
    });
  });

  describe("amlBetweenExclusive()", function () {
    it("asserts correct amlBetweenExclusive value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.amlBetweenExclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8,
          10
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlBetweenExclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          6,
          8
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlBetweenExclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          4,
          10
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlBetweenExclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          9,
          10
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.amlBetweenExclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          1,
          4
        )
      ).eql([false]);
    });
  });

  describe("credProtocolScoreIsEqual()", function () {
    it("asserts correct credProtocolScoreIsEqual value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreIsEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreIsEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          2
        )
      ).eql([false]);
    });
  });

  describe("credProtocolScoreGreaterThan()", function () {
    it("asserts correct credProtocolScoreGreaterThan value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreGreaterThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreGreaterThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          10
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreGreaterThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          2
        )
      ).eql([true]);
    });
  });

  describe("credProtocolScoreGreaterThanEqual()", function () {
    it("asserts correct credProtocolScoreGreaterThanEqual value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreGreaterThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreGreaterThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          10
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreGreaterThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          2
        )
      ).eql([true]);
    });
  });

  describe("credProtocolScoreLessThan()", function () {
    it("asserts correct credProtocolScoreLessThan value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreLessThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreLessThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          10
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreLessThan(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          2
        )
      ).eql([false]);
    });
  });

  describe("credProtocolScoreLessThanEqual()", function () {
    it("asserts correct credProtocolScoreLessThanEqual value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreLessThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreLessThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          10
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreLessThanEqual(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          2
        )
      ).eql([false]);
    });
  });

  describe("credProtocolScoreBetweenInclusive()", function () {
    it("asserts correct credProtocolScoreBetweenInclusive value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreBetweenInclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8,
          10
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreBetweenInclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          6,
          8
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreBetweenInclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          4,
          10
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreBetweenInclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          9,
          10
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreBetweenInclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          1,
          4
        )
      ).eql([false]);
    });
  });

  describe("credProtocolScoreBetweenExclusive()", function () {
    it("asserts correct credProtocolScoreBetweenExclusive value", async () => {
      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreBetweenExclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          8,
          10
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreBetweenExclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          6,
          8
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreBetweenExclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          4,
          10
        )
      ).eql([true]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreBetweenExclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          9,
          10
        )
      ).eql([false]);

      expect(
        await testQuadReaderUtilsInstance.functions.credProtocolScoreBetweenExclusive(
          ethers.utils.hexZeroPad(parseInt("8") as unknown as BytesLike, 32),
          1,
          4
        )
      ).eql([false]);
    });
  });
});
