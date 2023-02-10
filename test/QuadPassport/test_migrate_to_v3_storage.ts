import { network } from "hardhat";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { constants, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { hexZeroPad } from "ethers/lib/utils";

describe('migrateToV3Storage', () => {

    it('should migrate to v3 storage [ETH MAINNET]', async () => {
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
        const eligibleAttributes: any = [];
        const eligibleAttributesLength = await quadGovernance.getEligibleAttributesLength();
        for (let i = 0; i < eligibleAttributesLength; i++) {
            const attribute = await quadGovernance.eligibleAttributesArray(i);
            eligibleAttributes.push(attribute);
        }
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
                // could be more optimized if we check that the user did not burn
                accounts.push(to);
            }
        }

        // send some ETH to timelockSigner
        const signers = await ethers.getSigners();

        // perform upgrade to QuadPassport
        const QuadPassport = await ethers.getContractFactory("QuadPassport");
        const quadPassportUpgraded = await QuadPassport.deploy();
        await quadPassportUpgraded.deployed();

        const upgradeToFunctionData = quadPassport.interface.encodeFunctionData("upgradeTo", [quadPassportUpgraded.address]);
        var executeRawFunctionData = nonDelegateProxy.interface.encodeFunctionData("executeRaw", [quadPassport.address, upgradeToFunctionData]);
        await signers[1].sendTransaction({
            to: timelockAddress,
            value: 0,
            data: executeRawFunctionData,
        });

        // divide accounts into chunks of 5
        const chunks = [];
        for (let i = 0; i < accounts.length; i += 5) {
            chunks.push(accounts.slice(i, i + 5));
        }

        // check that the storage is not migrated
        const queryFeeBulk = await quadReader.connect(signers[0]).queryFeeBulk(accounts[0], eligibleAttributes);

        // ensure all attributes in all accounts are falsy
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
            const migrateAttributesFunctionData = quadPassport.interface.encodeFunctionData("migrateAttributes", [chunk]);
            executeRawFunctionData = nonDelegateProxy.interface.encodeFunctionData("executeRaw", [quadPassport.address, migrateAttributesFunctionData]);
            await signers[1].sendTransaction({
                to: timelockAddress,
                value: 0,
                data: executeRawFunctionData,
            });

            console.log("migrated chunk", chunk)
        }



        // ensure all attributes in all accounts are updated
        for (let account of chunks[0]) {
            const account0init = await quadReader.connect(signers[0]).callStatic.getAttributesBulk(account, eligibleAttributes, {
                value: queryFeeBulk,
            });
            account0init.forEach((attribute: any) => {
                const { value, epoch, issuer } = attribute;
                console.log(value, epoch.toString(), issuer);
            });
        }

    });

});