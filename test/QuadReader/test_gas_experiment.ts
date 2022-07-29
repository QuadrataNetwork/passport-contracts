import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { assertMint } from "../utils/verify";
import { formatBytes32String, id, parseUnits } from "ethers/lib/utils";

const { GOVERNANCE_ROLE } = require("../../utils/constant.ts");

const {
    deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const { deployGovernance } = require("../../utils/deployment.ts");


describe("QuadReader", async () => {
    let passport: Contract;
    let governance: Contract;
    let reader: Contract;
    let usdc: Contract;
    let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
        admin: SignerWithAddress,
        treasury: SignerWithAddress,
        minterA: SignerWithAddress,
        issuerA: SignerWithAddress,
        issuerB: SignerWithAddress,
        issuerATreasury: SignerWithAddress,
        issuerBTreasury: SignerWithAddress;
    const baseURI = "https://quadrata.io";
    let did: string;
    let aml: string;
    let country: string;
    let isBusiness: string;
    let issuedAt: number;

    beforeEach(async () => {
        did = formatBytes32String("did:quad:123456789abcdefghi");
        aml = id("LOW");
        country = id("FRANCE");
        isBusiness = id("FALSE");
        issuedAt = Math.floor(new Date().getTime() / 1000);

        [deployer, admin, issuerA, issuerB, treasury, issuerATreasury, issuerBTreasury, minterA] =
            await ethers.getSigners();
        [governance, passport, reader, usdc] = await deployPassportEcosystem(
            admin,
            [issuerA, issuerB],
            treasury,
            [issuerATreasury, issuerBTreasury],
            baseURI
        );
        await usdc.transfer(minterA.address, parseUnits("1000", 6));

        await assertMint(
            minterA,
            issuerA,
            issuerATreasury,
            passport,
            did,
            aml,
            country,
            isBusiness,
            issuedAt,
            1,
            {}
        );
    });

    describe("Gas Comparisons", async () => {

        it("call get attributes 1 issuer", async () => {
            const payment = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
            await usdc.approve(reader.address, payment);
            await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
        });

        it("call get attributes 2 issuer", async () => {
            await assertMint(
                minterA,
                issuerB,
                issuerBTreasury,
                passport,
                did,
                aml,
                country,
                isBusiness,
                issuedAt,
                1,
                {newIssuerMint: true}
            );

            const payment = await reader.calculatePaymentToken(id("COUNTRY"), usdc.address, minterA.address);
            await usdc.approve(reader.address, payment);
            await reader.getAttributes(minterA.address, 1, id("COUNTRY"), usdc.address);
        });
    });
});
