import { expect } from "chai";
import { task } from "hardhat/config";
import { recursiveRetry } from "../utils/retries";



task("getAttributes", "npx hardhat getAttributes --reader <address> --account <address> --attribute <string> --blockNumber <number> ")
    .addParam("reader", "sets the address for reader")
    .addParam("account", "sets the address for account")
    .addParam("attribute", "sets the attribute")
    .addParam("blockNumber", "sets the block number")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const readerAddress = taskArgs.reader;
        const accountAddress = taskArgs.account;
        const attribute = taskArgs.attribute;
        const blockNumber = parseInt(taskArgs.blockNumber);

        const quadReader = await recursiveRetry(ethers.getContractAt, "QuadReader", readerAddress);
        const results = await recursiveRetry(async () => {
            const queryFee = await quadReader.callStatic.queryFee(accountAddress, ethers.utils.id(attribute), { blockTag: blockNumber });
            return await quadReader.callStatic.getAttributes(accountAddress, ethers.utils.id(attribute), {
                value: queryFee,
                blockTag: blockNumber
            });
        });
        console.log(attribute + " attributes: " + results.length)
        for (var i = 0; i < results.length; i++) {
            const { value } = results[i];
            console.log("value: " + value);
        }
    });

task("assertAllAttributesEqual", "npx hardhat assertAllAttributesEqual --reader <address> --accounts <address,address,...> --attributes <string,string,...>  --startBlock <number> --endBlock <number> ")
    .addParam("reader", "sets the address for reader")
    .addParam("accounts", "sets the addresses for accounts")
    .addParam("attributes", "sets the attributes")
    .addParam("startBlock", "sets the start block")
    .addParam("endBlock", "sets the end block")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const readerAddress = taskArgs.reader;
        const attributes = taskArgs.attributes.split(",");
        const accounts = taskArgs.accounts.split(",");
        const startBlock = parseInt(taskArgs.startBlock);
        const endBlock = parseInt(taskArgs.endBlock);

        const quadReader = await recursiveRetry(ethers.getContractAt, "QuadReader", readerAddress);

        for (var i = 0; i < accounts.length; i++) {
            for(var j = 0; j < attributes.length; j++) {
                const attribute = attributes[j];
                const account = accounts[i];
                const results1 = await recursiveRetry(async () => {
                    const queryFee = await quadReader.callStatic.queryFee(account, ethers.utils.id(attribute), { blockTag: startBlock });
                    return await quadReader.callStatic.getAttributes(account, ethers.utils.id(attribute), {
                        value: queryFee,
                        blockTag: startBlock
                    });
                });

                const results2 = await recursiveRetry(async () => {
                    return await quadReader.callStatic.getAttributes(account, ethers.utils.id(attribute), { blockTag: endBlock });
                });

                expect(results1.length).to.equal(results2.length);
                for (var k = 0; k < results1.length; k++) {
                    const { value: value1 } = results1[k];
                    const { value: value2 } = results2[k];
                    expect(value1).to.equal(value2);
                }
            }
        }


    });