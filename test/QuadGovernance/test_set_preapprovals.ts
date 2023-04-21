import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

describe("QuadGovernance.setPreapprovals()", function () {

    let passport: Contract;
    let governance: Contract;
    let reader: Contract;
    let deployer: SignerWithAddress,
        admin: SignerWithAddress,
        treasury: SignerWithAddress,
        issuer1: SignerWithAddress,
        issuerTreasury1: SignerWithAddress,
        user1: SignerWithAddress,
        user2: SignerWithAddress,
        user3: SignerWithAddress;

    beforeEach(async () => {
        [deployer, admin, user1, user2, user3, treasury, issuer1, issuerTreasury1] = await ethers.getSigners();

        [governance, passport, reader] = await deployPassportEcosystem(
            admin,
            [issuer1],
            treasury,
            [issuerTreasury1],
            {
                skipPreapproval: true,
            }
        );

    });

    it("success - set preapprovals", async () => {
        await governance.connect(admin).setPreapprovals([user1.address, user2.address], [true, true]);
        expect(await governance.preapproval(user1.address)).to.equal(true);
        expect(await governance.preapproval(user2.address)).to.equal(true);
        expect(await governance.preapproval(user3.address)).to.equal(false);
    });

    it("success - set preapprovals - remove preapproval", async () => {
        await governance.connect(admin).setPreapprovals([user1.address, user2.address], [true, true]);
        expect(await governance.preapproval(user1.address)).to.equal(true);
        expect(await governance.preapproval(user2.address)).to.equal(true);
        expect(await governance.preapproval(user3.address)).to.equal(false);

        await governance.connect(admin).setPreapprovals([user1.address, user2.address], [false, false]);
        expect(await governance.preapproval(user1.address)).to.equal(false);
        expect(await governance.preapproval(user2.address)).to.equal(false);
        expect(await governance.preapproval(user3.address)).to.equal(false);
    });

    it("fail - set preapprovals - not admin", async () => {
        await expect(governance.connect(user1).setPreapprovals([user1.address, user2.address], [true, true])).to.be.revertedWith("INVALID_ADMIN");
    });

    it("fail - set preapprovals - different length", async () => {
        await expect(governance.connect(admin).setPreapprovals([user1.address, user2.address], [true])).to.be.revertedWith("ARRAY_LENGTH_MISMATCH");
    });

    it("fail - set preapprovals - already preapproved", async () => {
        await governance.connect(admin).setPreapprovals([user1.address, user2.address], [true, true]);
        await expect(governance.connect(admin).setPreapprovals([user1.address, user2.address], [true, true])).to.be.revertedWith("PREAPPROVED_STATUS_ALREADY_SET");
    });
});