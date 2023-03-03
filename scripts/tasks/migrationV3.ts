import { expect } from "chai";
import { recursiveRetry } from "../utils/retries";
import { task } from "hardhat/config";


task("migrateV3", "npx hardhat migrateV3 --passport <address> --governance <address> --startBlock <number> --endBlock <number> --chunkIndex <number> --network <network>")
    .addParam("passport", "QuadPassport proxy address")
    .addParam("governance", "Governance proxy address")
    .addParam("startBlock", "start block number")
    .addParam("endBlock", "end block number")
    .addParam("chunkIndex", "chunk index, pass 0 for first chunk, if transaction fails, pass the chunk index of the last successful chunk")
    .setAction(async (taskArgs, hre) => {
        const ethers = hre.ethers;
        const passportAddr = taskArgs.passport;
        const governanceAddr = taskArgs.governance;
        const startBlock = parseInt(taskArgs.startBlock);
        const endBlock = parseInt(taskArgs.endBlock);
        const chunkIndex = parseInt(taskArgs.chunkIndex);
        const ATTRIBUTE_AML = ethers.utils.id("AML");
        const ATTRIBUTE_COUNTRY = ethers.utils.id("COUNTRY");
        const ATTRIBUTE_DID = ethers.utils.id("DID");
        const ATTRIBUTE_IS_BUSINESS = ethers.utils.id("IS_BUSINESS");
        const ATTRIBUTE_CRED_PROTOCOL_SCORE = ethers.utils.id("CRED_PROTOCOL_SCORE")

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

        var accounts = ["0x87F6d5Cc3c65D06130f6861129aaae325309Ff85","0xeD5D581f603799E388A96e243D020D0f498bF71c","0xf593e16Fe4BB969818859b618CE148BBb04Cb366","0xF6E8bC89739b576927Fa8e5fEA37806990F34936","0x1051Cf2fF8D2AFf445aFdC0f2144A28A86D6d781","0x785de3aC19F26e22e029605e407E728c1660714F","0x2C3C070ec5da505ed68F3BCA91dE961dB837F52b","0xDDdE8021114889a8FAc4ABd21E3ED300Ca91b496","0x6A3de25fbCCb30e265dffaD8c507C5Ee429b0C0B","0x347775a4dc31813Cd31528fA6D2fC2a367300656","0xB7c0b1a9592780868af195Bbd574076b3E005DD1","0x18EAD99008825C959f128D4AAAdD340f0cAd1922","0x084B8d9c0834F5b905c17bc447C909a897B4BD85","0x856f3Ba82D948d7A3C61A1d5204bB8c160A19dA8","0x286C229170BE05FeA608D39bA6E2548AcA553423","0x3142aC4045eD8B02ae5FFD7b84242674b7162515","0x782D931e522eDBa8b4Cc6d3701CF53360E6a1a7f","0xa43527599BcA4C6fF070A96916FAFe2657F3d53f","0xD696a5fA12ab423Ea65fA84D35E105FB185E0511","0x12DA2D03D71485a629E8d28FE2F9188A62deF189","0xDd0CB7B7ccaAdC9540079A807ae0F871b0297dB3","0x8CD1960C18D13503D62E47EC8EA7FbF19A7b4d47","0xDcb9D10109bF58578dF7Ad9093CdD1B775A24b75","0x1eb4aC0CD307aB4c7dB6c25a78029E035670ac95","0x5AD7Ee21c2088f0091fAA5Ca97E9e985e2B7cbA5","0xB802f2e0E43438Bdf64Ee736F135f94ee071C087","0x97563a0299822a624062c01ADB0A6098e07497b0","0x896dd79e289c38de49f7D1d661A1f8DE9d5c5093","0x3bAe075c8728a976E69e6F2E45e9682D1BA063d2","0xbf9a4eCC4151f28C03100bA2C0555a3D3e439e69","0x4e172Ea6873b2b2cb3f41b796dd5364Ecc13cd75","0xa2EeEa10a9a116b5ec77fa3A12d580A7265ECE9D","0x49Aba39Fc04566399DBB227b884196c58EaEfdC6","0x743D89a62248B787a23C663894B8cd36Ac2049Ec","0x3F23388b021C0f418853e2011D53097290258517"];

        console.log("migration accounts: ", accounts.length, "accounts")

        // remove empty accounts
        accounts = accounts.filter((account) => {
            return account !== undefined;
        });

        // divide accounts into chunks of 100
        const chunks = [];
        for (let i = 0; i < accounts.length; i += 100) {
            chunks.push(accounts.slice(i, i + 100));
        }
        const chunkLength = chunks.length;
        var currChunkIndex = 0;

        const admin = (await ethers.getSigners())[0];
        for (let chunk of chunks) {
            if (currChunkIndex < chunkIndex) {
                currChunkIndex++;
                continue;
            }
            await recursiveRetry(async () => {
                console.log("attempting to migrate chunk", chunk, "working on", currChunkIndex, "of", chunkLength, "chunks...");
                const tx = await quadPassport.migrateAttributes(chunk, eligibleAttributes, {
                    gasLimit: 30000000,
                    maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
                    maxPriorityFeePerGas: ethers.utils.parseUnits("40", "gwei"),
                });
                // wait for transaction to be mined
                console.log("tx hash: ", tx.hash)
                console.log("nonce: ", tx.nonce)
                console.log("waiting for transaction to be mined...")
                const metaData = await tx.wait();

                // check if transaction was successful
                if (metaData.status === 0) {
                    // print revert reason
                    const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
                    const reason = ethers.utils.toUtf8String(receipt.logs[0].data);
                    const errorMessage = "transaction reverted: " + reason;
                    throw new Error(errorMessage);
                }

            })
            currChunkIndex++;
            console.log(currChunkIndex + " was migrated successfully")
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


        if (mode !== "mainnet" && mode !== "testnet") {
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
            const tx = await quadPassport.connect(admin).upgradeToAndCall(quadPassportUpgraded.address, setQuadReaderFunctionData);
            await tx.wait();
            console.log("POINTED QUAD PASSPORT TO LOGIC AT: ", quadPassportUpgraded.address);
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
            const tx = await quadReader.connect(admin).upgradeTo(quadReaderUpgraded.address);
            await tx.wait();
            console.log("POINTED QUAD READER TO LOGIC AT: ", quadReaderUpgraded.address);
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
            const tx = await quadGovernance.connect(admin).upgradeToAndCall(quadGovernanceUpgraded.address, setPreapprovalsFunctionData)
            await tx.wait();
            console.log("POINTED QUAD GOVERNANCE TO LOGIC AT: ", quadGovernanceUpgraded.address);
        });
        console.log("upgradeTo and upgradeToAndCall functions executed for QuadPassport, QuadReader and QuadGovernance")
    });

task("upgradeReader", "npx hardhat upgradeReader --reader <address>")
    .addParam("reader", "address of the QuadReader contract")
    .setAction(async (taskArgs, hre) => {
        const ethers = hre.ethers;
        const reader = taskArgs.reader;

        const admin = (await ethers.getSigners())[0];
        console.log("admin address: ", admin.address);

        const quadReader = await recursiveRetry(ethers.getContractAt, "QuadReader", reader);
        console.log("getting QuadReader contract at: ", quadReader.address);

        const QuadReader = await recursiveRetry(async () => {
            return await ethers.getContractFactory("QuadReader");
        });

        const quadReaderUpgraded = await recursiveRetry(async () => {
            return await QuadReader.deploy({
                maxFeePerGas: ethers.utils.parseUnits("2000", "gwei"),
                maxPriorityFeePerGas: ethers.utils.parseUnits("2000", "gwei")
            });
        });
        console.log(quadReaderUpgraded)
        console.log("attempting to deploy logic at: ", quadReaderUpgraded.address)
        await recursiveRetry(async () => {
            await quadReaderUpgraded.deployed();
        });
        console.log("logic deployed at: ", quadReaderUpgraded.address)
        await recursiveRetry(async () => {
            const tx = await quadReader.connect(admin).upgradeTo(quadReaderUpgraded.address,{
                maxFeePerGas: ethers.utils.parseUnits("2000", "gwei"),
                maxPriorityFeePerGas: ethers.utils.parseUnits("2000", "gwei")
            });
            await tx.wait();
            console.log("POINTED QUAD READER TO LOGIC AT: ", quadReaderUpgraded.address);
        });
    });