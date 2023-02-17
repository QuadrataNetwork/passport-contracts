import { expect } from "chai";
import { recursiveRetry } from "../utils/retries";
import { task } from "hardhat/config";

task("migrateV3", "npx hardhat migrateV3 --passport <address> --governance <address> --startBlock <number> --endBlock <number> --network <network>")
    .addParam("passport", "QuadPassport proxy address")
    .addParam("governance", "Governance proxy address")
    .addParam("startBlock", "start block number")
    .addParam("endBlock", "end block number")
    .setAction(async (taskArgs, hre) => {
        const ethers = hre.ethers;
        const passportAddr = taskArgs.passport;
        const governanceAddr = taskArgs.governance;
        const startBlock = parseInt(taskArgs.startBlock);
        const endBlock = parseInt(taskArgs.endBlock);
        const ATTRIBUTE_AML = ethers.utils.id("AML");
        const ATTRIBUTE_COUNTRY = ethers.utils.id("COUNTRY");
        const ATTRIBUTE_DID = ethers.utils.id("DID");
        const ATTRIBUTE_IS_BUSINESS = ethers.utils.id("IS_BUSINESS");
        const ATTRIBUTE_CRED_PROTOCOL_SCORE = ethers.utils.id("CRED_PROTOCOL_SCORE")
        const ATTRIBUTE_IS_ACCREDITITED_INVESTOR_US = ethers.utils.id("IS_ACCREDITITED_INVESTOR_US")
        const ATTRIBUTE_IS_QUALIFIEDPURCHASER_US = ethers.utils.id("IS_QUALIFIEDPURCHASER_US")

        const quadPassport = await recursiveRetry(ethers.getContractAt, "QuadPassport", passportAddr);
        const quadGovernance = await recursiveRetry(async () => {
            return await ethers.getContractAt("QuadGovernance", governanceAddr);
        });
        const eligibleAttributes: any = [ATTRIBUTE_AML];
        const eligibleAttributesLength = await recursiveRetry(async () => {
            return await quadGovernance.getEligibleAttributesLength()
        });

        for (let i = 0; i < eligibleAttributesLength; i++) {
            const attribute = await recursiveRetry(async () => {
                return await quadGovernance.eligibleAttributesArray(i)
            });
            eligibleAttributes.push(attribute);
        }

        expect(eligibleAttributes.length).to.be.equals(5) // includes AML, DID, COUNTRY, CRED_PROTOCOL_SCORE, IS_BUSINESS
        expect(eligibleAttributes.includes(ATTRIBUTE_AML)).to.be.true; // AML is eligible
        expect(eligibleAttributes.includes(ATTRIBUTE_COUNTRY)).to.be.true; // COUNTRY is eligible
        expect(eligibleAttributes.includes(ATTRIBUTE_DID)).to.be.true; // DID is eligible
        expect(eligibleAttributes.includes(ATTRIBUTE_CRED_PROTOCOL_SCORE)).to.be.true; // CRED_PROTOCOL_SCORE is eligible
        expect(eligibleAttributes.includes(ATTRIBUTE_IS_BUSINESS)).to.be.true; // IS_BUSINESS is eligible

        console.log("running migration across block interval [", startBlock,",", endBlock,"]")
        // read TransferSingle event from QuadPassport
        const filter = quadPassport.filters.TransferSingle(null, null, null, null, null);
        const logs = await quadPassport.queryFilter(filter, startBlock, endBlock);
        const accounts = [];
        for (const log in logs) {
            const { args } = logs[log];
            const { from, to, id, value } = args as any;
            if (from === ethers.constants.AddressZero) {
                accounts.push(to);
            }
            if (to === ethers.constants.AddressZero) {
                delete accounts[accounts.indexOf(from)];
            }
        }

        // divide accounts into chunks of 5
        const chunks = [];
        for (let i = 0; i < accounts.length; i += 5) {
            chunks.push(accounts.slice(i, i + 5));
        }
        const chunkLength = chunks.length;
        var chunkIndex = 0;

        const admin = (await ethers.getSigners())[0];
        for (let chunk of chunks) {
            const migrateAttributesFunctionData = quadPassport.interface.encodeFunctionData("migrateAttributes", [chunk, eligibleAttributes]);
            await recursiveRetry(async () => {
                console.log("attempting to migrate chunk", chunk, "loading", chunkIndex, "of", chunkLength, "chunks");
                // send transaction to QuadPassport with max gas fee of 20 gwei
                await admin.sendTransaction({
                    to: quadPassport.address,
                    value: 0,
                    data: migrateAttributesFunctionData,
                    gasLimit: 1500000,
                    maxFeePerGas: ethers.utils.parseUnits("20", "gwei"),

                });
            })
            chunkIndex++;
            console.log("migrated chunk", chunk, "loading", chunkIndex, "of", chunkLength, "chunks")
        }
    });

task("upgradeV3", "npx hardhat upgradeV3 --passport <address> --reader <address> --governance <address> --preapproved <address,address,...> --mode <mainnet|testnet>  --network <network>")
    .addParam("passport", "QuadPassport proxy address")
    .addParam("reader", "QuadReader proxy address")
    .addParam("governance", "QuadGovernance proxy address")
    .addParam("preapproved", "list of preapproved addresses separated by comma")
    .addParam("mode", "mainnet or testnet")
    .setAction(async (taskArgs, hre) => {
        const ethers = hre.ethers;
        const passportAddr = taskArgs.passport;
        const readerAddr = taskArgs.reader;
        const governanceAddr = taskArgs.governance;
        const preapproved = taskArgs.preapproved.split(",");
        const mode = taskArgs.mode;
        const ATTRIBUTE_AML = ethers.utils.id("AML");
        const ATTRIBUTE_COUNTRY = ethers.utils.id("COUNTRY");
        const ATTRIBUTE_DID = ethers.utils.id("DID");
        const ATTRIBUTE_IS_BUSINESS = ethers.utils.id("IS_BUSINESS");
        const ATTRIBUTE_CRED_PROTOCOL_SCORE = ethers.utils.id("CRED_PROTOCOL_SCORE")
        const ATTRIBUTE_IS_ACCREDITITED_INVESTOR_US = ethers.utils.id("IS_ACCREDITITED_INVESTOR_US")
        const ATTRIBUTE_IS_QUALIFIEDPURCHASER_US = ethers.utils.id("IS_QUALIFIEDPURCHASER_US")


        if(mode !== "mainnet" && mode !== "testnet") {
            console.log("mode must be either mainnet or testnet");
            return;
        }

        // verify preapproved is an array of addresses
        if (!Array.isArray(preapproved)) {
            console.log("preapproved is not an array");
            return;
        }
        for (let address of preapproved) {
            if (!ethers.utils.isAddress(address)) {
                console.log("preapproved is not an array of addresses");
                return;
            }
        }

        const admin = (await ethers.getSigners())[0];

        const quadGovernance = await recursiveRetry(async () => {
            return await ethers.getContractAt("QuadGovernance", governanceAddr);
        });
        const eligibleAttributes: any = [ATTRIBUTE_AML];
        const eligibleAttributesLength = await recursiveRetry(async () => {
            return await quadGovernance.getEligibleAttributesLength()
        });

        for (let i = 0; i < eligibleAttributesLength; i++) {
            const attribute = await recursiveRetry(async () => {
                return await quadGovernance.eligibleAttributesArray(i)
            });
            eligibleAttributes.push(attribute);
        }

        expect(eligibleAttributes.length).to.be.equals(5) // includes AML, DID, COUNTRY, CRED_PROTOCOL_SCORE, IS_BUSINESS
        expect(eligibleAttributes.includes(ATTRIBUTE_AML)).to.be.true; // AML is eligible
        expect(eligibleAttributes.includes(ATTRIBUTE_COUNTRY)).to.be.true; // COUNTRY is eligible
        expect(eligibleAttributes.includes(ATTRIBUTE_DID)).to.be.true; // DID is eligible
        expect(eligibleAttributes.includes(ATTRIBUTE_CRED_PROTOCOL_SCORE)).to.be.true; // CRED_PROTOCOL_SCORE is eligible
        expect(eligibleAttributes.includes(ATTRIBUTE_IS_BUSINESS)).to.be.true; // IS_BUSINESS is eligible


        expect(await recursiveRetry(async () => {
            return await quadGovernance.eligibleAttributesByDID(ATTRIBUTE_AML)
        })).to.be.true; // AML is eligible by DID
        expect(await recursiveRetry(async () => {
            return await quadGovernance.eligibleAttributesByDID(ATTRIBUTE_COUNTRY)
        })).to.be.false; // COUNTRY is not eligible by DID
        expect(await recursiveRetry(async () => {
            return await quadGovernance.eligibleAttributesByDID(ATTRIBUTE_DID)
        })).to.be.false; // DID is not eligible by DID
        expect(await recursiveRetry(async () => {
            return await quadGovernance.eligibleAttributesByDID(ATTRIBUTE_CRED_PROTOCOL_SCORE)
        })).to.be.false; // CRED_PROTOCOL_SCORE is not eligible by DID
        expect(await recursiveRetry(async () => {
            return await quadGovernance.eligibleAttributesByDID(ATTRIBUTE_IS_BUSINESS)
        })).to.be.false; // IS_BUSINESS is not eligible by DID

        const quadPassport = await recursiveRetry(ethers.getContractAt, "QuadPassport", passportAddr);
        const quadReader = await recursiveRetry(ethers.getContractAt, "QuadReader", readerAddr);



        // perform upgrade to QuadPassport
        const QuadPassport = await recursiveRetry(async () => {
            return await ethers.getContractFactory("QuadPassport");
        });
        const quadPassportUpgraded = await recursiveRetry(async () => {
            return await QuadPassport.deploy();
        });
        await recursiveRetry(async () => {
            return await quadPassportUpgraded.deployed();
        });
        const setQuadReaderFunctionData = quadPassportUpgraded.interface.encodeFunctionData("setQuadReader", [quadReader.address]);
        await recursiveRetry(async () => {
            return await quadPassport.connect(admin).upgradeToAndCall(quadPassportUpgraded.address, setQuadReaderFunctionData);
        });

        // perform upgrade to QuadReader
        const QuadReader = await recursiveRetry(async () => {
            return await ethers.getContractFactory("QuadReader");
        });
        const quadReaderUpgraded = await recursiveRetry(async () => {
            return await QuadReader.deploy();
        });
        await recursiveRetry(async () => {
            await quadReaderUpgraded.deployed();
        });
        await recursiveRetry(async () => {
            await quadReader.connect(admin).upgradeTo(quadReaderUpgraded.address);
        });

        // perform upgrade to QuadGovernance
        const QuadGovernance = await recursiveRetry(async () => {
            return await ethers.getContractFactory(mode === "mainnet" ? "QuadGovernance" : "QuadGovernanceTestnet");
        });
        const quadGovernanceUpgraded = await recursiveRetry(async () => {
            return await QuadGovernance.deploy();
        });

        const trueStatuses = preapproved.map(() => true);
        const setPreapprovalsFunctionData = quadGovernanceUpgraded.interface.encodeFunctionData("setPreapprovals", [preapproved, trueStatuses]);
        await recursiveRetry(async () => {
            await quadGovernanceUpgraded.deployed();
        });
        await recursiveRetry(async () => {
            await quadGovernance.connect(admin).upgradeToAndCall(quadGovernanceUpgraded.address, setPreapprovalsFunctionData)
        });
        console.log("upgradeTo and upgradeToAndCall functions executed for QuadPassport, QuadReader and QuadGovernance")
    });
