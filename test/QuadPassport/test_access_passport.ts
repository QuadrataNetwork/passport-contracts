import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { id, parseUnits, formatBytes32String, zeroPad, hexZeroPad } from "ethers/lib/utils";

const {
    TOKEN_ID,
    MINT_PRICE,
} = require("../../utils/constant.ts");

const {
    deployPassportEcosystem,
} = require("../utils/deployment_and_init.ts");

const { signMint, signMessage } = require("../utils/signature.ts");

describe("READER_ROLE Privileges", async () => {
    let passport: Contract;
    let governance: Contract; // eslint-disable-line no-unused-vars
    let reader: Contract;
    let usdc: Contract;
    let defi: Contract;
    let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
        admin: SignerWithAddress,
        treasury: SignerWithAddress,
        minterA: SignerWithAddress,
        minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
        issuer: SignerWithAddress,
        issuerB: SignerWithAddress,
        issuerTreasury: SignerWithAddress,
        issuerBTreasury: SignerWithAddress,
        dataChecker: SignerWithAddress; // used as READER_ROLE to check AML and DID after burn
    let baseURI: string;
    let did: string;
    let aml: string;
    let isBusiness: string;
    let country: string;
    let issuedAt: number;

    beforeEach(async () => {
        baseURI = "https://quadrata.io";
        did = formatBytes32String("did:quad:123456789abcdefghi");
        aml = id("LOW");
        country = id("FRANCE");
        isBusiness = id("FALSE");
        issuedAt = Math.floor(new Date().getTime() / 1000);

        [deployer, admin, minterA, minterB, issuer, treasury, issuerTreasury, dataChecker, issuerB, issuerBTreasury] =
            await ethers.getSigners();
        [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
            admin,
            [issuer],
            treasury,
            [issuerTreasury],
            baseURI
        );

        const sigIssuer = await signMint(
            issuer,
            minterA,
            TOKEN_ID,
            did,
            aml,
            country,
            isBusiness,
            issuedAt
        );

        const sigMinter = await signMessage(
            minterA,
            minterA.address,
        );

        await passport
            .connect(minterA)
            .mintPassport([minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt], sigIssuer, sigMinter, {
                value: MINT_PRICE,
            });

        await governance.connect(admin).grantRole(id("READER_ROLE"), dataChecker.address);
        await governance.connect(admin).setIssuer(issuerB.address, issuerBTreasury.address)

        await usdc.transfer(minterA.address, parseUnits("1000", 6));
        await usdc.transfer(minterB.address, parseUnits("1000", 6));
    });

    describe("attributes", async () => {
        it("success - a READER_ROLE may query attributes", async () => {
            expect(await governance.connect(admin).hasRole(id("READER_ROLE"), dataChecker.address)).equals(true);

            const didResponse = await passport.connect(dataChecker).attributes(minterA.address, id("DID"), issuer.address);
            const countryResponse = await passport.connect(dataChecker).attributes(minterA.address, id("COUNTRY"), issuer.address);
            const isBusinessResponse = await passport.connect(dataChecker).attributes(minterA.address, id("IS_BUSINESS"), issuer.address);

            expect(didResponse.value).equals(did);
            expect(countryResponse.value).equals(country);
            expect(isBusinessResponse.value).equals(isBusiness);

        })

        it("fail - a READER_ROLE may gets null attributes if an issuer is deleted", async () => {
            expect(await governance.connect(admin).hasRole(id("READER_ROLE"), dataChecker.address)).equals(true);

            await expect(governance.connect(admin).deleteIssuer(issuer.address))
                .to.emit(governance, 'IssuerDeleted')
                .withArgs(issuer.address);

            const didResponse = await passport.connect(dataChecker).attributes(minterA.address, id("DID"), issuer.address);
            const countryResponse = await passport.connect(dataChecker).attributes(minterA.address, id("COUNTRY"), issuer.address);
            const isBusinessResponse = await passport.connect(dataChecker).attributes(minterA.address, id("IS_BUSINESS"), issuer.address);

            expect(didResponse.value).equals(hexZeroPad('0x00', 32));
            expect(countryResponse.value).equals(hexZeroPad('0x00', 32));
            expect(isBusinessResponse.value).equals(hexZeroPad('0x00', 32));

        });

        it("fail - a READER_ROLE gets null attributes if an issuer is disabled", async () => {
            expect(await governance.connect(admin).hasRole(id("READER_ROLE"), dataChecker.address)).equals(true);

            await expect(governance.connect(admin).setIssuerStatus(issuer.address, 1))
                .to.emit(governance, 'IssuerStatusChanged')
                .withArgs(issuer.address, 0, 1);

            const didResponse = await passport.connect(dataChecker).attributes(minterA.address, id("DID"), issuer.address);
            const countryResponse = await passport.connect(dataChecker).attributes(minterA.address, id("COUNTRY"), issuer.address);
            const isBusinessResponse = await passport.connect(dataChecker).attributes(minterA.address, id("IS_BUSINESS"), issuer.address);

            expect(didResponse.value).equals(hexZeroPad('0x00', 32));
            expect(countryResponse.value).equals(hexZeroPad('0x00', 32));
            expect(isBusinessResponse.value).equals(hexZeroPad('0x00', 32));

        });

        it("fail - a user without READER_ROLE may not query attributes", async () => {
            expect(await governance.connect(admin).hasRole(id("READER_ROLE"), dataChecker.address)).equals(true);
            await governance.connect(admin).revokeRole(id("READER_ROLE"), dataChecker.address);

            expect(await governance.connect(admin).hasRole(id("READER_ROLE"), dataChecker.address)).equals(false);

            await expect(passport.connect(dataChecker).attributes(minterA.address, id("DID"), issuer.address)).to.be.revertedWith("INVALID_READER");
            await expect(passport.connect(dataChecker).attributes(minterA.address, id("COUNTRY"), issuer.address)).to.be.revertedWith("INVALID_READER");
            await expect(passport.connect(dataChecker).attributes(minterA.address, id("IS_BUSINESS"), issuer.address)).to.be.revertedWith("INVALID_READER");

        });

        it("fail - cannot access DID level attributes", async () => {
            expect(await governance.connect(admin).hasRole(id("READER_ROLE"), dataChecker.address)).equals(true);
            expect((await passport.connect(dataChecker).attributes(minterA.address, id("AML"), issuer.address)).value).equals(hexZeroPad('0x00', 32));
        });
    });

    describe("attributesByDID", async () => {
        it("success - a READER_ROLE may query attributes", async () => {
            expect(await governance.connect(admin).hasRole(id("READER_ROLE"), dataChecker.address)).equals(true);

            const amlResponse = await passport.connect(dataChecker).attributesByDID(did, id("AML"), issuer.address);

            expect(amlResponse.value).equals(aml);

        })

        it("fail - a READER_ROLE may gets null attributes if an issuer is deleted", async () => {
            expect(await governance.connect(admin).hasRole(id("READER_ROLE"), dataChecker.address)).equals(true);

            await expect(governance.connect(admin).deleteIssuer(issuer.address))
                .to.emit(governance, 'IssuerDeleted')
                .withArgs(issuer.address);

                const amlResponse = await passport.connect(dataChecker).attributesByDID(did, id("AML"), issuer.address);

                expect(amlResponse.value).equals(hexZeroPad('0x00', 32));

        });

        it("fail - a READER_ROLE gets null attributes if an issuer is disabled", async () => {
            expect(await governance.connect(admin).hasRole(id("READER_ROLE"), dataChecker.address)).equals(true);

            await expect(governance.connect(admin).setIssuerStatus(issuer.address, 1))
                .to.emit(governance, 'IssuerStatusChanged')
                .withArgs(issuer.address, 0, 1);

                const amlResponse = await passport.connect(dataChecker).attributesByDID(did, id("AML"), issuer.address);

                expect(amlResponse.value).equals(hexZeroPad('0x00', 32));

        });

        it("fail - a user without READER_ROLE may not query attributes", async () => {
            await governance.connect(admin).revokeRole(id("READER_ROLE"), dataChecker.address);
            expect(await governance.connect(admin).hasRole(id("READER_ROLE"), dataChecker.address)).equals(false);

            await expect(passport.connect(dataChecker).attributesByDID(did, id("AML"), issuer.address)).to.be.revertedWith("INVALID_READER");

        });

        it("fail - cannot access DID level attributes", async () => {
            expect(await governance.connect(admin).hasRole(id("READER_ROLE"), dataChecker.address)).equals(true);

            const didResponse = await passport.connect(dataChecker).attributesByDID(did, id("DID"), issuer.address);
            const countryResponse = await passport.connect(dataChecker).attributesByDID(did, id("COUNTRY"), issuer.address);
            const isBusinessResponse = await passport.connect(dataChecker).attributesByDID(did, id("IS_BUSINESS"), issuer.address);

            expect(didResponse.value).equals(hexZeroPad('0x00', 32));
            expect(countryResponse.value).equals(hexZeroPad('0x00', 32));
            expect(isBusinessResponse.value).equals(hexZeroPad('0x00', 32));

        });
    });
});