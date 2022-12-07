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

});
