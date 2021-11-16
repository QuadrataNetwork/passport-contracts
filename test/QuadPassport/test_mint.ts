import { expect } from "chai";
import { ethers } from "hardhat";

describe("QuadPassport", function () {
    let passport;

    beforeEach(async function () {
        const QuadPassport = await ethers.getContractFactory("QuadPassport");
        passport = await QuadPassport.deploy()
    })
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
