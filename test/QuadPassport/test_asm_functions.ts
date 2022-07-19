import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { signMessage, signMint } from "../utils/signature";
import { formatBytes32String, hexZeroPad, id, parseEther } from "ethers/lib/utils";

const { GOVERNANCE_ROLE } = require("../../utils/constant.ts");

const {
    deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const { deployGovernance } = require("../../utils/deployment.ts");


describe("QuadPassport", async () => {
    let passport: Contract;
    let governance: Contract;
    let reader: Contract;
    let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
        admin: SignerWithAddress,
        treasury: SignerWithAddress,
        issuer: SignerWithAddress,
        minterA: SignerWithAddress,
        minterB: SignerWithAddress,
        issuerTreasury: SignerWithAddress;
    const baseURI = "https://quadrata.io";
    let did: string;
    let aml: string;
    let country: string;
    let isBusiness: string;
    let issuedAt: number;

    describe("setGovernance", async () => {
        beforeEach(async () => {

            did = formatBytes32String("did:quad:123456789abcdefghi");
            aml = hexZeroPad("0x01", 32);
            country = id("FRANCE");
            isBusiness = id("FALSE");
            issuedAt = Math.floor(new Date().getTime() / 1000);

            [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury] =
                await ethers.getSigners();

            [governance, passport, reader] = await deployPassportEcosystem(
                admin,
                [issuer],
                treasury,
                [issuerTreasury],
                baseURI
            );
        });

        it("succeed", async () => {
            const sig = await signMint(
                issuer,
                minterA,
                1,
                did,
                aml,
                country,
                isBusiness,
                issuedAt
              );
              const sigAccount = await signMessage(minterA, minterA.address);

              await expect(
                passport
                  .connect(minterA)
                  .mintPassport([minterA.address, 1, did, aml, country, isBusiness, issuedAt], sig, sigAccount, {
                    value: parseEther("0.006"),
                  })
              ).to.be.revertedWith("SIGNATURE_ALREADY_USED");        });
    });
});
