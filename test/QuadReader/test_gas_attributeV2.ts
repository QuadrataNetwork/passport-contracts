import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { formatBytes32String, id, keccak256 } from "ethers/lib/utils";
import { expect } from "chai";

const {
    MINT_PRICE,
    ATTRIBUTE_DID,
    ATTRIBUTE_AML,
    ATTRIBUTE_IS_BUSINESS,
    ATTRIBUTE_COUNTRY,
} = require("../../utils/constant.ts");

const {
    deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");

const { setAttributes } = require("../helpers/set_attributes.ts");



describe("QuadPassport", async () => {
    let passport: Contract;
    let governance: Contract; // eslint-disable-line no-unused-vars
    let reader: Contract; // eslint-disable-line no-unused-vars
    let defi: Contract;
    let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
        admin: SignerWithAddress,
        treasury: SignerWithAddress,
        minterA: SignerWithAddress,
        minterB: SignerWithAddress, // eslint-disable-line no-unused-vars
        issuer: SignerWithAddress,
        issuerB: SignerWithAddress, // eslint-disable-line no-unused-vars
        issuerC: SignerWithAddress, // eslint-disable-line no-unused-vars
        issuerTreasury: SignerWithAddress,
        issuerBTreasury: SignerWithAddress, // eslint-disable-line no-unused-vars
        issuerCTreasury: SignerWithAddress; // eslint-disable-line no-unused-vars

    let issuedAt: number, verifiedAt: number;

    const attributes: Object = {
        [ATTRIBUTE_DID]: formatBytes32String("quad:did:helllo"),
        [ATTRIBUTE_AML]: formatBytes32String("1"),
        [ATTRIBUTE_COUNTRY]: id("FRANCE"),
    };

    beforeEach(async () => {
        [
            deployer,
            admin,
            minterA,
            minterB,
            issuer,
            treasury,
            issuerTreasury,
            issuerB,
            issuerBTreasury,
            issuerC,
            issuerCTreasury,
        ] = await ethers.getSigners();
        [governance, passport, reader, defi] = await deployPassportEcosystem(
            admin,
            [issuer],
            treasury,
            [issuerTreasury]
        );

        issuedAt = Math.floor(new Date().getTime() / 1000) - 5000;
        verifiedAt = Math.floor(new Date().getTime() / 1000) - 5000;

        await setAttributes(
            minterA,
            issuer,
            passport,
            attributes,
            verifiedAt,
            issuedAt,
            MINT_PRICE
        );
    });

    it("should return the correct attributes", async () => {
        const attKey = keccak256(ethers.utils.defaultAbiCoder.encode(["address", "bytes32", "address"], [minterA.address, ATTRIBUTE_DID, issuer.address]));
        var attributes = await reader.getAttributeByIssuer(minterA.address, ATTRIBUTE_DID, issuer.address);
    });
});