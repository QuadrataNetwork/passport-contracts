import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

describe("QuadReader.initialize", async () => {
  let passport: Contract; // eslint-disable-line no-unused-vars
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;
  beforeEach(async () => {
    [deployer, admin, issuer, treasury, issuerTreasury] =
      await ethers.getSigners();
    [governance, passport, reader] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury]
    );
  });

  it("success", async () => {
    expect(await reader.governance()).equals(governance.address);
    expect(await reader.passport()).equals(passport.address);
  });

  it("fail - governance address(0)", async () => {
    const QuadReader = await ethers.getContractFactory("QuadReader");
    await expect(
      upgrades.deployProxy(
        QuadReader,
        [ethers.constants.AddressZero, passport.address],
        {
          initializer: "initialize",
          kind: "uups",
          unsafeAllow: ["constructor"],
        }
      )
    ).to.be.reverted;
  });

  it("fail - passport address(0)", async () => {
    const QuadReader = await ethers.getContractFactory("QuadReader");
    await expect(
      upgrades.deployProxy(
        QuadReader,
        [governance.address, ethers.constants.AddressZero],
        {
          initializer: "initialize",
          kind: "uups",
          unsafeAllow: ["constructor"],
        }
      )
    ).to.be.reverted;
  });

  it("fail - doesn't let re-initialize", async () => {
    await expect(
      reader.initialize(issuer.address, issuer.address)
    ).to.revertedWith("Initializable: contract is already initialized");
  });
});
