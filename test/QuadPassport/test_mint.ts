import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { TOKEN_ID } = require("../../utils/constant.ts");
const {
  deployPassportAndGovernance,
} = require("../utils/deployment_and_init.ts");
const { signMint } = require("../utils/signature.ts");

describe("QuadPassport", async () => {
  let passport: Contract;
  let governance: Contract;
  let deployer: SignerWithAddress,
    admin: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress,
    issuer: SignerWithAddress;
  const baseURI = "https://quadrata.io";
  let sig: any;
  let quadDID = ethers.utils.formatBytes32String(
    "did:example:123456789abcdefghi"
  );
  let aml = ethers.utils.formatBytes32String("LOW");
  let country = ethers.utils.formatBytes32String("FRANCE");
  let issuedAt = Math.floor(new Date().getTime() / 1000);
  let mintPrice = ethers.utils.parseEther("0.03");

  describe("mintPassport", async () => {
    beforeEach(async () => {
      [deployer, admin, minterA, minterB, issuer] = await ethers.getSigners();
      [governance, passport] = await deployPassportAndGovernance(
        admin,
        issuer,
        baseURI
      );
      sig = await signMint(
        issuer,
        minterA,
        TOKEN_ID,
        quadDID,
        aml,
        country,
        issuedAt
      );
    });

    it("successfully mint", async () => {
      await passport
        .connect(minterA)
        .mintPassport(TOKEN_ID, quadDID, aml, country, issuedAt, sig, {
          value: mintPrice,
        });
    });

    it("fail", async () => {
      console.log(deployer.address);
      console.log(minterB.address);
      expect(false).to.equal(true);
      quadDID = "hello";
      country = "hello";
      issuedAt = 5;
      mintPrice = ethers.utils.parseEther("0.02");

      aml = ethers.utils.formatBytes32String("MEDIUM");
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
