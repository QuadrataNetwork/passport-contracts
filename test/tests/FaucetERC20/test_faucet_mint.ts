import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  deployFaucetERC20
} = require("../../../utils/deployment.ts");

describe("FaucetErc20", async() => {
  let erc20: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;

  beforeEach(async() =>{
    erc20 = await deployFaucetERC20('FaucetDollar', 'FUSD', 6);
    [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury] =
      await ethers.getSigners();
  })

  describe("faucetMint", async() => {
    it("allows anyone to mint", async() => {
      // Mint tokens for deployer, minter A and B.
      await erc20.connect(deployer).faucetMint();
      await erc20.connect(minterA).faucetMint();
      await erc20.connect(minterB).faucetMint();

      // Check that minting worked
      expect(await erc20.balanceOf(deployer.address)).to.equal(10*1e6)
      expect(await erc20.balanceOf(minterA.address)).to.equal(10*1e6)
      expect(await erc20.balanceOf(minterB.address)).to.equal(10*1e6)

      // Check tom ake sure we didnt mint to random addresses that never call function
      expect(await erc20.balanceOf(admin.address)).to.equal(0)
      expect(await erc20.balanceOf(treasury.address)).to.equal(0)
    });
  });
});
