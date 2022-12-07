import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";
import { BytesLike } from '@ethersproject/bytes';


describe('QueryUtils()', function() {
  let TestQueryUtils;
  let signers;
  let testQueryUtilsInstance: Contract;

  beforeEach(async () => {
      signers = await ethers.getSigners();

      const QueryUtilsLib = await ethers.getContractFactory("QueryUtils");
      const queryUtilsLibInstance = await QueryUtilsLib.deploy();
      await queryUtilsLibInstance.deployed();

      TestQueryUtils = await ethers.getContractFactory("TestQueryUtils", {
          libraries: {
              QueryUtils: queryUtilsLibInstance.address
          }
      });

      testQueryUtilsInstance = await TestQueryUtils.deploy();
      await testQueryUtilsInstance.deployed();
  });

  describe('IsBusinessTrue()', function() {
    it("asserts correct IsBusinessTrue value", async () => {
      expect(await testQueryUtilsInstance.functions.IsBusinessTrue(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('TRUE'))
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.IsBusinessTrue(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('FALSE'))
      )).eql([false]);

      expect(await testQueryUtilsInstance.functions.IsBusinessTrue(
        ethers.constants.HashZero
      )).eql([false]);
    });
  });

  describe('IsBusinessFalse()', function() {
    it("asserts correct IsBusinessFalse value", async () => {
      expect(await testQueryUtilsInstance.functions.IsBusinessFalse(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('TRUE'))
      )).eql([false]);

      expect(await testQueryUtilsInstance.functions.IsBusinessFalse(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('FALSE'))
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.IsBusinessFalse(
        ethers.constants.HashZero
      )).eql([true]);
    });
  });

  describe('CountryIsEqual()', function() {
    it("asserts correct CountryIsEqual value", async () => {
      expect(await testQueryUtilsInstance.functions.CountryIsEqual(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('US')), 'US'
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.CountryIsEqual(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('CA')), 'US'
      )).eql([false]);
    });
  });

  describe('AmlIsEqual()', function() {
    it("asserts correct AmlIsEqual value", async () => {
      expect(await testQueryUtilsInstance.functions.AmlIsEqual(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 8
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.AmlIsEqual(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 2
      )).eql([false]);
    });
  });

  describe('AmlGreaterThan()', function() {
    it("asserts correct AmlGreaterThan value", async () => {
      expect(await testQueryUtilsInstance.functions.AmlGreaterThan(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 8
      )).eql([false]);

      expect(await testQueryUtilsInstance.functions.AmlGreaterThan(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 10
      )).eql([false]);

      expect(await testQueryUtilsInstance.functions.AmlGreaterThan(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 2
      )).eql([true]);
    });
  });

  describe('AmlGreaterThanEqual()', function() {
    it("asserts correct AmlGreaterThanEqual value", async () => {
      expect(await testQueryUtilsInstance.functions.AmlGreaterThanEqual(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 8
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.AmlGreaterThanEqual(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 10
      )).eql([false]);

      expect(await testQueryUtilsInstance.functions.AmlGreaterThanEqual(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 2
      )).eql([true]);
    });
  });

  describe('AmlLessThan()', function() {
    it("asserts correct AmlLessThan value", async () => {
      expect(await testQueryUtilsInstance.functions.AmlLessThan(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 8
      )).eql([false]);

      expect(await testQueryUtilsInstance.functions.AmlLessThan(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 10
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.AmlLessThan(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 2
      )).eql([false]);
    });
  });

  describe('AmlLessThanEqual()', function() {
    it("asserts correct AmlLessThanEqual value", async () => {
      expect(await testQueryUtilsInstance.functions.AmlLessThanEqual(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 8
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.AmlLessThanEqual(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 10
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.AmlLessThanEqual(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 2
      )).eql([false]);
    });
  });

  describe('AmlBetweenInclusive()', function() {
    it("asserts correct AmlBetweenInclusive value", async () => {
      expect(await testQueryUtilsInstance.functions.AmlBetweenInclusive(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 8, 10
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.AmlBetweenInclusive(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 6, 8
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.AmlBetweenInclusive(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 4, 10
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.AmlBetweenInclusive(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 9, 10
      )).eql([false]);

      expect(await testQueryUtilsInstance.functions.AmlBetweenInclusive(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 1, 4
      )).eql([false]);
    });
  });

  describe('AmlBetweenExclusive()', function() {
    it("asserts correct AmlBetweenExclusive value", async () => {
      expect(await testQueryUtilsInstance.functions.AmlBetweenExclusive(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 8, 10
      )).eql([false]);

      expect(await testQueryUtilsInstance.functions.AmlBetweenExclusive(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 6, 8
      )).eql([false]);

      expect(await testQueryUtilsInstance.functions.AmlBetweenExclusive(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 4, 10
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.AmlBetweenExclusive(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 9, 10
      )).eql([false]);

      expect(await testQueryUtilsInstance.functions.AmlBetweenExclusive(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 1, 4
      )).eql([false]);
    });
  });

  describe('TuCreditScoreIteratorLessThan()', function() {
    it("asserts correct TuCreditScoreIteratorLessThan value", async () => {
      const startHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('NeverFadeFaze'))
      const startHashPlus1 = ethers.utils.keccak256(startHash)
      const startHashPlus2 = ethers.utils.keccak256(startHashPlus1)

      const randomHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('AlwaysFadeFaze'))

      expect(await testQueryUtilsInstance.functions.TuCreditScoreIteratorLessThan(
        startHashPlus2, startHash, 3
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.TuCreditScoreIteratorLessThan(
        startHashPlus2, startHash, 2
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.TuCreditScoreIteratorLessThan(
        startHashPlus2, startHash, 1
      )).eql([false]);

      expect(await testQueryUtilsInstance.functions.TuCreditScoreIteratorLessThan(
        randomHash, startHash, 200
      )).eql([false]);
    });
  })

});
