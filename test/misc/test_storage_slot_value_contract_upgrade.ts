import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BytesLike } from '@ethersproject/bytes';


describe("StorageSlotOnContractUpgrade", async () => {
  describe("upgrade", async () => {
    it("succeed", async () => {
      const TestQuadOriginal = await ethers.getContractFactory("TestQuadOriginal")
      const originalContract = await upgrades.deployProxy(TestQuadOriginal, [], {
        initializer: "initialize",
        kind: "uups",
        unsafeAllow: ["constructor"],
      })
      await originalContract.deployed();
      expect(await originalContract.foo()).to.equal(1);
      expect(await ethers.provider.getStorageAt(originalContract.address, 101)).to.equal(ethers.utils.hexZeroPad(69 as unknown as BytesLike,32));
      expect(await ethers.provider.getStorageAt(originalContract.address, 102)).to.equal(ethers.utils.hexZeroPad(1337 as unknown as BytesLike,32));

      const TestQuadUpgrade = await ethers.getContractFactory(
        "TestQuadUpgraded"
      );
      const upgradeContract = await upgrades.upgradeProxy(
        originalContract.address,
        TestQuadUpgrade,
        { unsafeAllow: ["constructor"] }
      );
      expect(await upgradeContract.foo()).to.equal(2);
      expect(await ethers.provider.getStorageAt(originalContract.address, 101)).to.equal(ethers.utils.hexZeroPad(69 as unknown as BytesLike,32));
      expect(await ethers.provider.getStorageAt(originalContract.address, 102)).to.equal(ethers.utils.hexZeroPad(1337 as unknown as BytesLike,32));
    });
  });
});
