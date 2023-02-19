import { network } from "hardhat";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { constants, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { defaultAbiCoder, hexZeroPad } from "ethers/lib/utils";
import { ATTRIBUTE_AML, ATTRIBUTE_COUNTRY, ATTRIBUTE_CRED_PROTOCOL_SCORE, ATTRIBUTE_DID, ATTRIBUTE_IS_BUSINESS } from "../../utils/constant";

describe('migrateToV3Storage', function() {
    // increase timeout to 600s
    this.timeout(600000);

    it('should migrate to v3 storage [ETH MAINNET fork]', async () => {
        // fork mainnet eth
        await network.provider.request({
            method: "hardhat_reset",
            params: [
                {
                    forking: {
                        jsonRpcUrl: process.env.MAINNET_URI,
                        blockNumber: 16582505,
                    },
                },
            ],
        });

        // deploy NonDelegateProxy
        const NonDelegateProxy = await ethers.getContractFactory("NonDelegateProxy");
        const nonDelegateProxy = await NonDelegateProxy.deploy();
        await nonDelegateProxy.deployed();

        const proxyCode = await ethers.provider.getCode(nonDelegateProxy.address);

        const timelockAddress = "0x76694A182dB047067521c73161Ebf3Db5Ca988d3"

        // set timelock code to nonDelegateProxy
        await network.provider.request({
            method: "hardhat_setCode",
            params: [timelockAddress, proxyCode],
        });

        // get eligible attributes from QuadGovernance
        const quadGovernance = await ethers.getContractAt("QuadGovernance", "0xBfa59A31b379A62304327386bC2b03096D7695B3");

        const eligibleAttributes: any = [ATTRIBUTE_AML];
        const eligibleAttributesLength = await quadGovernance.getEligibleAttributesLength();
        for (let i = 0; i < eligibleAttributesLength; i++) {
            const attribute = await quadGovernance.eligibleAttributesArray(i);
            eligibleAttributes.push(attribute);
        }
        expect(eligibleAttributes.length).to.be.equals(5) // includes AML, DID, COUNTRY, CRED_PROTOCOL_SCORE, IS_BUSINESS
        // test that DID is listed after AML
        expect(eligibleAttributes.indexOf(ATTRIBUTE_DID) > eligibleAttributes.indexOf(ATTRIBUTE_AML)).to.be.true;

        const quadPassport = await ethers.getContractAt("QuadPassport", "0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d");
        const quadReader = await ethers.getContractAt("QuadReader", "0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da");

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
            if(to === constants.AddressZero) {
                delete accounts[accounts.indexOf(from)];
            }
        }

        // send some ETH to timelockSigner
        const signers = await ethers.getSigners();

        // divide accounts into chunks of 5
        const chunks = [];
        for (let i = 0; i < accounts.length; i += 5) {
            chunks.push(accounts.slice(i, i + 5));
        }

        // check that the storage is not migrated
        const queryFeeBulk = await quadReader.connect(signers[0]).queryFeeBulk(accounts[0], eligibleAttributes);

        // read all attributes in all accounts pre-migration
        const premigrationAttributes: any = {};
        for (let account of chunks[0]) {
            const attributes = await quadReader.connect(signers[0]).callStatic.getAttributesBulk(account, eligibleAttributes, {
                value: queryFeeBulk,
            });

            // iterate over attributes and eligibleAttributes
            expect(attributes.length).to.be.equal(eligibleAttributes.length);
            for(let i = 0; i < attributes.length; i++) {
                const attribute = attributes[i];
                const eligibleAttribute = eligibleAttributes[i];
                const { value, epoch, issuer } = attribute;

                premigrationAttributes[defaultAbiCoder.encode(["address", "bytes32"], [account, eligibleAttribute])] = {
                    value,
                    epoch,
                    issuer,
                    account,
                    eligibleAttribute,
                }
            }
        }

        // perform upgrade to QuadPassport
        const QuadPassport = await ethers.getContractFactory("QuadPassport");
        const quadPassportUpgraded = await QuadPassport.deploy();
        await quadPassportUpgraded.deployed();
        // setQuadReader address in QuadPassport
        const setQuadReaderFunctionData = quadPassportUpgraded.interface.encodeFunctionData("setQuadReader", [quadReader.address]);

        const upgradeToFunctionData = quadPassport.interface.encodeFunctionData("upgradeToAndCall", [quadPassportUpgraded.address, setQuadReaderFunctionData]);
        var executeRawFunctionData = nonDelegateProxy.interface.encodeFunctionData("executeRaw", [quadPassport.address, upgradeToFunctionData]);
        await signers[1].sendTransaction({
            to: timelockAddress,
            value: 0,
            data: executeRawFunctionData,
        });

        // perform upgrade to QuadReader
        const QuadReader = await ethers.getContractFactory("QuadReader");
        const quadReaderUpgraded = await QuadReader.deploy();
        await quadReaderUpgraded.deployed();

        const upgradeToFunctionData2 = quadReader.interface.encodeFunctionData("upgradeTo", [quadReaderUpgraded.address]);
        var executeRawFunctionData2 = nonDelegateProxy.interface.encodeFunctionData("executeRaw", [quadReader.address, upgradeToFunctionData2]);
        await signers[1].sendTransaction({
            to: timelockAddress,
            value: 0,
            data: executeRawFunctionData2,
        });

        // perform upgrade to QuadGovernance
        const QuadGovernance = await ethers.getContractFactory("QuadGovernance");
        const quadGovernanceUpgraded = await QuadGovernance.deploy();
        await quadGovernanceUpgraded.deployed();

        const signersAddresses = await Promise.all(signers.map((signer) => signer.getAddress()));
        const trueStatuses = signersAddresses.map(() => true);

        const setPreapprovalsFunctionData = quadGovernanceUpgraded.interface.encodeFunctionData("setPreapprovals", [signersAddresses, trueStatuses]);
        expect(signersAddresses.length).to.be.equals(trueStatuses.length);

        const upgradeToFunctionData3 = quadGovernance.interface.encodeFunctionData("upgradeToAndCall", [quadGovernanceUpgraded.address, setPreapprovalsFunctionData]);
        var executeRawFunctionData3 = nonDelegateProxy.interface.encodeFunctionData("executeRaw", [quadGovernance.address, upgradeToFunctionData3]);
        await signers[1].sendTransaction({
            to: timelockAddress,
            value: 0,
            data: executeRawFunctionData3,
            gasLimit: 15000000,
        });

        console.log("upgradeTo functions executed for QuadPassport, QuadReader and QuadGovernance")


        // ensure all account level attributes in all accounts are falsy
        for (let account of chunks[0]) {
            const account0init = await quadReader.connect(signers[0]).callStatic.getAttributesBulk(account, eligibleAttributes, {
                value: queryFeeBulk,
            });
            account0init.forEach((attribute: any) => {
                const { value, epoch, issuer } = attribute;
                expect(value).to.be.equal(hexZeroPad("0x0", 32));
                expect(epoch).to.be.equal(0);
                expect(issuer).to.be.equal(constants.AddressZero);
            });

            console.log("account", account, "is falsy")
        }


        // check timelock has governance role
        expect(await quadGovernance.hasRole(await quadGovernance.GOVERNANCE_ROLE(), timelockAddress)).to.be.true;

        for (let chunk of chunks.slice(0, 1)) {
            // signer calls custom timelock which calls migrate function
            const migrateAttributesFunctionData = quadPassport.interface.encodeFunctionData("migrateAttributes", [chunk, eligibleAttributes]);
            executeRawFunctionData = nonDelegateProxy.interface.encodeFunctionData("executeRaw", [quadPassport.address, migrateAttributesFunctionData]);
            // send tx with max gas limit
            const tx = await signers[1].sendTransaction({
                to: timelockAddress,
                value: 0,
                data: executeRawFunctionData,
                gasLimit: 15000000,
            });

            // wait for tx to be mined
            const metaData = await tx.wait();

            // check that the tx was successful
            expect(metaData.status).to.be.equal(1);

            console.log("migrated chunk", chunk)
        }



        // ensure all attributes in all accounts are equal to premigrationAttributes
        for (let account of chunks[0]) {
            const attributes = await quadReader.connect(signers[0]).callStatic.getAttributesBulk(account, eligibleAttributes, {
                value: queryFeeBulk,
            });
            // assert that attributes is not empty
            expect(attributes.length).to.be.equal(eligibleAttributes.length);
            for(let i = 0; i < attributes.length; i++) {
                const attribute = attributes[i];
                const eligibleAttribute = eligibleAttributes[i];
                const { value, epoch, issuer } = attribute;
                const key = defaultAbiCoder.encode(["address", "bytes32"], [account, eligibleAttribute]);
                expect(value).to.be.equal(premigrationAttributes[key].value);
                expect(epoch).to.be.equal(premigrationAttributes[key].epoch);
                expect(issuer).to.be.equal(constants.AddressZero);

                console.log("account", account, "is equal to premigrationAttributes")
                console.log("\t -premigrationAttributes: value, ", premigrationAttributes[key].value)
                console.log("\t -premigrationAttributes: epoch, ", premigrationAttributes[key].epoch)
                console.log("\t -premigrationAttributes: issuer, ", premigrationAttributes[key].issuer)
                console.log("\t -attributes: value, ", value)
                console.log("\t -attributes: epoch, ", epoch)
                console.log("\t -attributes: issuer, ", issuer)

                console.log("--------------------------------------------------------------------")
            };
        }

        // check that all mockAddress are not preapproved
        const mockAddresses = [
            '0x5501CC22Be0F12381489D0980f20f872e1E6bfb9',
            '0xffE462ed723275eF8E7655C4883e8cD428826669',
            '0x8337B2AEDa4Dfff0d520003747aAC061c9f74f0E',
            '0x4E553a07054C1ADa5b30ED84F3179886eA1d4144',
            '0x4D749Ecb07a68f230b23da84399de63Df7E63d53'
        ]

        for (let mockAddress of mockAddresses) {
            expect(await quadGovernance.preapproval(mockAddress)).to.be.false;
        }

        // check all signers are preapproved
        for (let signer of signers) {
            expect(await quadGovernance.preapproval(await signer.getAddress())).to.be.true;
        }

    });

});