import { expect } from "chai";
import { constants } from "ethers";
import { ethers } from "hardhat";
import { ATTRIBUTE_AML, ATTRIBUTE_COUNTRY, ATTRIBUTE_CRED_PROTOCOL_SCORE, ATTRIBUTE_DID, ATTRIBUTE_IS_BUSINESS } from "../../utils/constant";
import { recursiveRetry } from "../utils/retries";


(async () => {

    const quadGovernance = await ethers.getContractAt("QuadGovernance", "0x863db2c1A43441bbAB7f34740d0d62e21e678A4b");
    const eligibleAttributes: any = [ATTRIBUTE_AML];
    const eligibleAttributesLength = await recursiveRetry(quadGovernance.getEligibleAttributesLength);
    for (let i = 0; i < eligibleAttributesLength; i++) {
        const attribute = await recursiveRetry(quadGovernance.eligibleAttributesArray, i);
        eligibleAttributes.push(attribute);
    }
    expect(eligibleAttributes.length).to.be.equals(5) // includes AML, DID, COUNTRY, CRED_PROTOCOL_SCORE, IS_BUSINESS
    expect(ATTRIBUTE_AML in eligibleAttributes).to.be.true; // AML is eligible
    expect(ATTRIBUTE_COUNTRY in eligibleAttributes).to.be.true; // COUNTRY is eligible
    expect(ATTRIBUTE_DID in eligibleAttributes).to.be.true; // DID is eligible
    expect(ATTRIBUTE_CRED_PROTOCOL_SCORE in eligibleAttributes).to.be.true; // CRED_PROTOCOL_SCORE is eligible
    expect(ATTRIBUTE_IS_BUSINESS in eligibleAttributes).to.be.true; // IS_BUSINESS is eligible


    const quadPassport = await ethers.getContractAt("QuadPassport", "0xF4d4F629eDD73680767eb7b509C7C2D1fE551522");
    const quadReader = await ethers.getContractAt("QuadReader", "0x5C6b81212c0A654B6e247F8DEfeC9a95c63EF954");

    // read TransferSingle event from QuadPassport
    const filter = quadPassport.filters.TransferSingle(null, null, null, null, null);
    const logs = await quadPassport.queryFilter(filter, 0, "latest");
    const accounts = [];
    for (const log in logs) {
        const { args } = logs[log];
        const { from, to, id, value } = args as any;
        if (from === constants.AddressZero) {
            accounts.push(to);
        }
        if (to === constants.AddressZero) {
            delete accounts[accounts.indexOf(from)];
        }
    }

    const admin = (await ethers.getSigners())[0];


    // divide accounts into chunks of 5
    const chunks = [];
    for (let i = 0; i < accounts.length; i += 5) {
        chunks.push(accounts.slice(i, i + 5));
    }

    // perform upgrade to QuadPassport
    const QuadPassport = await recursiveRetry(ethers.getContractFactory, "QuadPassport");
    const quadPassportUpgraded = await recursiveRetry(QuadPassport.deploy);
    await recursiveRetry(quadPassportUpgraded.deployed);
    await recursiveRetry(quadPassport.upgradeTo, quadPassportUpgraded.address);

    // perform upgrade to QuadReader
    const QuadReader = await recursiveRetry(ethers.getContractFactory, "QuadReader");
    const quadReaderUpgraded = await recursiveRetry(QuadReader.deploy);
    await recursiveRetry(quadReaderUpgraded.deployed);
    await recursiveRetry(quadReader.upgradeTo, quadReaderUpgraded.address);

    // perform upgrade to QuadGovernance
    const QuadGovernance = await recursiveRetry(ethers.getContractFactory, "QuadGovernanceTestnet");
    const quadGovernanceUpgraded = await recursiveRetry(QuadGovernance.deploy);
    await recursiveRetry(quadGovernanceUpgraded.deployed);
    await recursiveRetry(quadGovernance.upgradeTo, quadGovernanceUpgraded.address);
    console.log("upgradeTo functions executed for QuadPassport, QuadReader and QuadGovernance")

    // setQuadReader address in QuadPassport
    const setQuadReaderFunctionData = quadPassportUpgraded.interface.encodeFunctionData("setQuadReader", [quadReader.address]);
    await recursiveRetry(async() => {
        await admin.sendTransaction({
            to: quadReader.address,
            value: 0,
            data: setQuadReaderFunctionData,
        });
    })
    console.log("setQuadReader function executed for QuadPassport")

    const chunkLength = chunks.length;
    var chunkIndex = 0;
    for (let chunk of chunks) {
        const migrateAttributesFunctionData = quadPassport.interface.encodeFunctionData("migrateAttributes", [chunk, eligibleAttributes]);
        await recursiveRetry(async() => {
            await admin.sendTransaction({
                to: quadPassport.address,
                value: 0,
                data: migrateAttributesFunctionData,
                gasLimit: 15000000,
            });
        })
        chunkIndex++;
        console.log("migrated chunk", chunk, "loading", chunkIndex, "of", chunkLength, "chunks")
    }
})();