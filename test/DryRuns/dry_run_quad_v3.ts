import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { formatBytes32String, hexZeroPad, id } from "ethers/lib/utils";
import { upgrades } from "hardhat";
import { ATTRIBUTE_AML, ATTRIBUTE_COUNTRY, ATTRIBUTE_DID, ATTRIBUTE_IS_BUSINESS, MINT_PRICE, TOKEN_ID } from "../../utils/constant";
import { assertSetAttribute } from "../helpers/assert/assert_set_attributes";
import { setAttributes } from "../helpers/set_attributes";
import { deployGovernance, deployPassport, deployReader } from "../../utils/deployment";



describe("Dry Run Quad V3", () => {

    let passport: Contract;
    let governance: Contract;
    let reader: Contract;

    let users: SignerWithAddress[];

    let issuedAt: number;
    let verifiedAt: number;

    beforeEach(async () => {
        users = await ethers.getSigners();

        const QuadGovernance = await ethers.getContractFactory("QuadGovernanceTestnet");
        governance = await upgrades.deployProxy(QuadGovernance, [], {
          initializer: "initialize",
          kind: "uups",
          unsafeAllow: ["constructor"],
        });
        await governance.deployed();

        passport = await deployPassport(governance);
        reader = await deployReader(governance, passport);

        await passport.setQuadReader(reader.address);
        await governance.setPassportContractAddress(passport.address);

        // set issued at to current block timestamp
        issuedAt = await ethers.provider.getBlock("latest").then((block: any) => block.timestamp) - 1000;
        verifiedAt = issuedAt;
    });


    it("success - QuadReader, QuadPassport, QuadGovernance have correct refs to each other", async () => {
        expect(await reader.governance()).to.equal(governance.address);
        expect(await reader.passport()).to.equal(passport.address);
        expect(await passport.governance()).to.equal(governance.address);
        expect(await passport.reader()).to.equal(reader.address);
    });

    it("success - users[2] and users[3] issue attributes to users[0] and users[1]", async () => {
        const attributes: any = {
            [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
        };

        await governance.setEligibleAttribute(ATTRIBUTE_IS_BUSINESS, true);

        await governance.addIssuer(users[2].address, users[2].address);

        await governance.setIssuerAttributePermission(users[2].address, ATTRIBUTE_IS_BUSINESS, true);

        await governance.setEligibleTokenId(TOKEN_ID, true, "www.quadrata.com");

        await setAttributes(
            users[0],
            users[2],
            passport,
            attributes,
            verifiedAt,
            issuedAt,
            MINT_PRICE
        );

        const results = await reader.callStatic.getAttributes(users[0].address, ATTRIBUTE_IS_BUSINESS);


        expect(results[0].value).equals(id("FALSE"));
    });

    it("fail - users cannot call passport.attributes", async () => {
        const attributes: any = {
            [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
        };

        await governance.setEligibleAttribute(ATTRIBUTE_IS_BUSINESS, true);

        await governance.addIssuer(users[2].address, users[2].address);

        await governance.setIssuerAttributePermission(users[2].address, ATTRIBUTE_IS_BUSINESS, true);

        await governance.setEligibleTokenId(TOKEN_ID, true, "www.quadrata.com");

        await setAttributes(
            users[0],
            users[2],
            passport,
            attributes,
            verifiedAt,
            issuedAt,
            MINT_PRICE
        );

        await expect(passport.attributes(users[0].address, ATTRIBUTE_IS_BUSINESS)).to.be.revertedWith("INVALID_READER");
    });

    it("fail - users cannot call passport.attribute", async () => {
        const attributes: any = {
            [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
        };

        await governance.setEligibleAttribute(ATTRIBUTE_IS_BUSINESS, true);

        await governance.addIssuer(users[2].address, users[2].address);

        await governance.setIssuerAttributePermission(users[2].address, ATTRIBUTE_IS_BUSINESS, true);

        await governance.setEligibleTokenId(TOKEN_ID, true, "www.quadrata.com");

        await setAttributes(
            users[0],
            users[2],
            passport,
            attributes,
            verifiedAt,
            issuedAt,
            MINT_PRICE
        );

        await expect(passport.attribute(users[0].address, ATTRIBUTE_IS_BUSINESS)).to.be.revertedWith("INVALID_READER");
    });


    it("success - users[2] and users[3] issue 3 attributes to users[0])", async () => {
        const attributes: any = {
            [ATTRIBUTE_IS_BUSINESS]: id("FALSE"),
            [ATTRIBUTE_COUNTRY]: id("UK"),
            [ATTRIBUTE_AML]: hexZeroPad("0x03", 32),
            [ATTRIBUTE_DID]: formatBytes32String("hello:world:candy:land")
        };

        await governance.setEligibleAttribute(ATTRIBUTE_IS_BUSINESS, true);
        await governance.setEligibleAttribute(ATTRIBUTE_COUNTRY, true);
        await governance.setEligibleAttribute(ATTRIBUTE_DID, true);
        await governance.setEligibleAttributeByDID(ATTRIBUTE_AML, true);

        await governance.addIssuer(users[2].address, users[2].address);
        await governance.addIssuer(users[3].address, users[3].address);

        await governance.setIssuerAttributePermission(users[2].address, ATTRIBUTE_IS_BUSINESS, true);
        await governance.setIssuerAttributePermission(users[2].address, ATTRIBUTE_COUNTRY, true);
        await governance.setIssuerAttributePermission(users[2].address, ATTRIBUTE_DID, true);
        await governance.setIssuerAttributePermission(users[2].address, ATTRIBUTE_AML, true);

        await governance.setIssuerAttributePermission(users[3].address, ATTRIBUTE_DID, true);
        await governance.setIssuerAttributePermission(users[3].address, ATTRIBUTE_AML, true);
        await governance.setIssuerAttributePermission(users[3].address, ATTRIBUTE_COUNTRY, true);
        await governance.setIssuerAttributePermission(users[3].address, ATTRIBUTE_IS_BUSINESS, true);


        await governance.setEligibleTokenId(TOKEN_ID, true, "www.quadrata.com");

        await setAttributes(
            users[0],
            users[2],
            passport,
            attributes,
            verifiedAt,
            issuedAt,
            MINT_PRICE
        );

        await setAttributes(
            users[0],
            users[3],
            passport,
            attributes,
            verifiedAt,
            issuedAt,
            MINT_PRICE
        );

        const results = await reader.callStatic.getAttributesBulk(users[0].address, [
            ATTRIBUTE_IS_BUSINESS,
            ATTRIBUTE_COUNTRY,
            ATTRIBUTE_AML,
            ATTRIBUTE_DID
        ]);

        expect(results[0].value).equals(id("FALSE"));
        expect(results[1].value).equals(id("UK"));
        expect(results[2].value).equals(hexZeroPad("0x03", 32));
        expect(results[3].value).equals(formatBytes32String("hello:world:candy:land"));

        const results2 = await reader.callStatic.getAttributes(users[0].address, ATTRIBUTE_IS_BUSINESS);
        expect(results2[0].value).equals(id("FALSE"));
        expect(results2[1].value).equals(id("FALSE"));

        const results3 = await reader.callStatic.getAttribute(users[0].address, ATTRIBUTE_COUNTRY);
        expect(results3.value).equals(id("UK"));

        const results4 = await reader.callStatic.getAttributesLegacy(users[0].address, ATTRIBUTE_IS_BUSINESS);
        expect(results4[0][0]).equals(id("FALSE"));
        expect(results4[0][1]).equals(id("FALSE"));

        const results5 = await reader.callStatic.getAttributesBulkLegacy(users[0].address, [
            ATTRIBUTE_IS_BUSINESS,
            ATTRIBUTE_COUNTRY,
            ATTRIBUTE_AML,
            ATTRIBUTE_DID
        ]);

        expect(results5[0][0]).equals(id("FALSE"));
        expect(results5[0][1]).equals(id("UK"));
        expect(results5[0][2]).equals(hexZeroPad("0x03", 32));
        expect(results5[0][3]).equals(formatBytes32String("hello:world:candy:land"));
    });
});