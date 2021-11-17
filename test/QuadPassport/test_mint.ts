import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { ISSUER_ROLE } = require("../utils/constant.ts");

const {
  deployPassport,
  deployGovernance,
} = require("../../utils/deployment.ts");
const { signMint, hash } = require("../utils/signature.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let governance: Contract;
  let deployer: SignerWithAddress,
    admin: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress,
    issuer: SignerWithAddress;
  const tokenId = 1;
  const baseURI = "https://quadrata.io";
  let sig: any;
  let quadDID: string = await hash("did:1:deadbeef");
  let country: any = await hash("FRANCE");
  let issuedAt = Math.floor(new Date().getTime() / 1000);

  describe("mintPassport", async () => {
    beforeEach(async () => {
      [deployer, admin, minterA, minterB, issuer] = await ethers.getSigners();
      governance = await deployGovernance(admin);
      console.log("HELLO 1");
      governance.connect(admin).grantRole(ISSUER_ROLE, issuer.address);
      console.log("HELLO 2");
      passport = await deployPassport(governance, admin, baseURI);
      console.log("HELLO 3");
      sig = await signMint(issuer, minterA, tokenId, quadDID, issuedAt);
      console.log("HELLO 4");
    });

    it("successfully mint", async () => {
      await passport
        .connect(minterA)
        .mintPassport(tokenId, quadDID, country, issuedAt, sig);
    });

    it("fail", async () => {
      console.log(deployer.address);
      console.log(minterB.address);
      expect(false).to.equal(true);
      quadDID = "hello";
      country = "hello";
      issuedAt = 5;
    });
  });
  // it("Should return the new greeting once it's changed", async function () {
  //   const Greeter = await ethers.getContractFactory("Greeter");
  //   const greeter = await Greeter.deploy("Hello, world!");
  //   await greeter.deployed();

  //   expect(await greeter.greet()).to.equal("Hello, world!");

  //   const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

  //   // wait until the transaction is mined
  //   await setGreetingTx.wait();

  //   expect(await greeter.greet()).to.equal("Hola, mundo!");
  // });
});
