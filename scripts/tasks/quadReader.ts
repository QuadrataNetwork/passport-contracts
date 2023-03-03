import { expect } from "chai";
import { formatEther, parseEther } from "ethers/lib/utils";
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
            console.log("attempting to read query fee");
            const queryFee = await quadReader.callStatic.queryFee(accountAddress, ethers.utils.id(attribute), { blockTag: blockNumber });
            console.log("query fee: " + queryFee);

            console.log("attempting to read attributes");
            return await quadReader.callStatic.getAttributes(accountAddress, ethers.utils.id(attribute), {
                value: queryFee,
                blockTag: blockNumber,
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

        // print balance of signer of reader at start block
        const signer = quadReader.signer.address;
        const balance = await ethers.provider.getBalance(signer, startBlock);
        console.log("signer: " + signer + " has balance: " + formatEther(balance.toString()) + " at block: " + startBlock);

        for (var i = 0; i < accounts.length; i++) {
            for (var j = 0; j < attributes.length; j++) {
                const attribute = attributes[j];
                const account = accounts[i];
                const results1 = await recursiveRetry(async () => {
                    const queryFee = await quadReader.callStatic.queryFee(account, ethers.utils.id(attribute), { blockTag: startBlock });
                    //expect(balance.gte(queryFee)).to.be.true;
                    console.log("query fee: " + formatEther(queryFee.toString()));

                    return await quadReader.callStatic.getAttribute(account, ethers.utils.id(attribute), {
                        value: queryFee,
                    });
                });

                const results2 = await recursiveRetry(async () => {
                    return await quadReader.callStatic.getAttributes(account, ethers.utils.id(attribute), { blockTag: endBlock });
                });

                try {
                    expect(results1.length).to.equal(results2.length);
                } catch (e) {
                    console.log("account: " + account);
                    console.log("attribute: " + attribute);
                    console.log("results1.length: " + results1.length);
                    console.log("results2.length: " + results2.length);
                    throw e;
                }
                for (var k = 0; k < results1.length; k++) {
                    const { value: value1 } = results1[k];
                    const { value: value2 } = results2[k];
                    console.log("comparing " + value1 + " and " + value2);
                    expect(value1).to.equal(value2);
                }
            }
        }


    });

task("getAllQueries", "npx hardhat getAllQueries --reader <address> --startBlock <number>")
    .addParam("reader", "sets the address for reader")
    .addParam("startBlock", "sets the start block")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const readerAddress = taskArgs.reader;
        const startBlock = parseInt(taskArgs.startBlock);

        const quadReader = await recursiveRetry(ethers.getContractAt, "QuadReader", readerAddress);

        // get current block number
        const currentBlockNumber = await ethers.provider.getBlockNumber();
        console.log("current block number: " + currentBlockNumber);
        const callers = new Set();
        // create a Set of all callers
        // create map of callers to event count
        const callerToEventCount = new Map();
        const stepSize = 100000;

        for (var i = startBlock; i < currentBlockNumber; i += stepSize) {
            var filter = quadReader.filters.QueryBulkEvent(null, null, null);
            var logs = await recursiveRetry(async () => {
                return await quadReader.queryFilter(filter, i, i + stepSize);
            }) as any;
            for (const log in logs) {
                const { args } = logs[log];
                const { _caller } = args as any;
                callers.add(_caller);
                callerToEventCount.set(_caller, (callerToEventCount.get(_caller) || 0) + 1);
            }

            filter = quadReader.filters.QueryEvent(null, null, null);
            logs = await recursiveRetry(async () => {
                return await quadReader.queryFilter(filter, i, i + stepSize);
            }) as any;

            for (const log in logs) {
                const { args } = logs[log];
                const { _caller } = args as any;
                callers.add(_caller);
                callerToEventCount.set(_caller, (callerToEventCount.get(_caller) || 0) + 1);
            }

            // print percentage complete out of 100
            console.log("progress: " + Math.floor((i / currentBlockNumber) * 100) + "%");
        }

        // pretty print the callers
        // print event count for each caller
        console.log("------------------callers' event count-----------------");
        for (const caller of callers) {
            console.log(caller + ": " + callerToEventCount.get(caller));
        }
        console.log("------------------------------------------");
    });