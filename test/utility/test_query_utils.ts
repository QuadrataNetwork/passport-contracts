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

  describe('AMLIsEqual()', function() {
    it.only("asserts correct AMLIsEqual value", async () => {
      expect(await testQueryUtilsInstance.functions.AmlIsEqual(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 8
      )).eql([true]);

      expect(await testQueryUtilsInstance.functions.AmlIsEqual(
        ethers.utils.hexZeroPad(parseInt('8') as unknown as BytesLike, 32), 2
      )).eql([false]);
    });
  });
});
