// @ts-nocheck

import { ethers, upgrades } from "hardhat";
import { network } from "hardhat";
import { expect } from "chai";
import { getImplementationAddress } from '@openzeppelin/upgrades-core';

const {
    GOVERNANCE_ROLE,
    ATTRIBUTE_DID,
    ATTRIBUTE_AML,
    ATTRIBUTE_COUNTRY,
    ATTRIBUTE_IS_BUSINESS,
    NETWORK_IDS,
} = require("../../utils/constant.ts");

const {
    QUAD_PASSPORT,
    QUAD_READER,
    QUAD_GOVERNANCE
} = require("../../scripts/data/mainnet.ts");



// 5 previous individual passports + 5 business passports can still be queried with the exact same values
// a preapproved wallet can still query before and after upgrade
// a non-preapproved wallet CANNOT query before and after upgrade
// all QuadGovernance storage values remain the same before and after upgrade
// all QuadPassport storage values remain the same before and after upgrade
// an admin can still update some QuadGovernance values before and after upgrade
// a non-admin CANNOT update some admin QuadGovernance values before and after upgrade
// an operator can still call setTokenURI after upgrade
// all assigned roles for DEFAULT_ADMIN, GOVERNANCE, READER, OPERATOR, ISSUER remain the same before and after upgrade
// an unassigned role remain unassigned for DEFAULT_ADMIN, GOVERNANCE, READER, OPERATOR, ISSUER remain the same before and after upgrade
// QuadPassport.attributes & QuadPassport.attribute cannot be called by a NON-READER role before and after upgrade
// QuadGOvernance.upgrade, QuadREader.upgrade, QuadPasport.upgrade cannot be called by non-governance role

const INDIVIDUAL_ADDRESS_1 = '0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526'
const INDIVIDUAL_ADDRESS_2 = '0x560c9baf6487b9c237afe82213b92287261be5f8'
const INDIVIDUAL_ADDRESS_3 = '0x743d89a62248b787a23c663894b8cd36ac2049ec'
const INDIVIDUAL_ADDRESS_4 = '0xea0bac222acd0c364fb0d6ec6d4110231ad6eeb3'
const INDIVIDUAL_ADDRESS_5 = '0xb802f2e0e43438bdf64ee736f135f94ee071c087'

const EXPECTED_INDIVIDUAL_RESULTS = {
    [INDIVIDUAL_ADDRESS_1]: {
        'did': '0xf7b171699fd929a3c0a2795659d9b10bc2cab64b934fe49686d5b0ab909a8ee1',
        'aml': '0x0000000000000000000000000000000000000000000000000000000000000001',
        'country': '0x627fe66dd064a0a7d686e05b87b04d5a7c585907afae1f0c65ab27fa379ca189',
        'isBusiness': '0xa357fcb91396b2afa7ab60192e270c625a2eb250b8f839ddb179f207b40459b4',
    },
    [INDIVIDUAL_ADDRESS_2]: {
        'did': '0xad455feaa57a630819dfcd91a4f8cae0e1eadb7e6097b4081c2bb8bfab50cbb9',
        'aml': '0x0000000000000000000000000000000000000000000000000000000000000001',
        'country': '0x627fe66dd064a0a7d686e05b87b04d5a7c585907afae1f0c65ab27fa379ca189',
        'isBusiness': '0xa357fcb91396b2afa7ab60192e270c625a2eb250b8f839ddb179f207b40459b4',
    },
    [INDIVIDUAL_ADDRESS_3]: {
        'did': '0x6b564ef28df70adcc70aa23db3b80c9dc3c678ac14ec83a4d80e2bc0c40d2a36',
        'aml': '0x0000000000000000000000000000000000000000000000000000000000000001',
        'country': '0x32a63c4c805a578620c21134057f327a17922ae1831d86fc8ca0ea168bc25ce3',
        'isBusiness': '0xa357fcb91396b2afa7ab60192e270c625a2eb250b8f839ddb179f207b40459b4',
    },
    [INDIVIDUAL_ADDRESS_4]: {
        'did': '0x3b154246dac915d8dd6135bf2512145415d286d346465366a3bd71094050c29c',
        'aml': '0x0000000000000000000000000000000000000000000000000000000000000001',
        'country': '0xa58de32261c1daca7d9359f64242e87c5d42b10589f30dafe0c3cf007786f64a',
        'isBusiness': '0xa357fcb91396b2afa7ab60192e270c625a2eb250b8f839ddb179f207b40459b4',
    },
    [INDIVIDUAL_ADDRESS_5]: {
        'did': '0x0dfd20819935177fc9a663466f53229f489720f706aac054580323190f9a785f',
        'aml': '0x0000000000000000000000000000000000000000000000000000000000000001',
        'country': '0xfef58748d1dea6ebd1e61c2e5413397c0158d086bee02a41ba00125b4664ddf6',
        'isBusiness': '0xa357fcb91396b2afa7ab60192e270c625a2eb250b8f839ddb179f207b40459b4',
    },
}

const fetchResults = async (quadReader, preapproved, address) => {
    return {
        'did': await quadReader.connect(preapproved).callStatic.getAttributes(address, ATTRIBUTE_DID),
        'aml': await quadReader.connect(preapproved).callStatic.getAttributes(address, ATTRIBUTE_AML),
        'country': await quadReader.connect(preapproved).callStatic.getAttributes(address, ATTRIBUTE_COUNTRY),
        'isBusiness': await quadReader.connect(preapproved).callStatic.getAttributes(address, ATTRIBUTE_IS_BUSINESS),
    };
};

const assertGovernanceValues = async (quadGovernance) => {
    expect(await quadGovernance.treasury(), '0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21')
    expect(await quadGovernance.revSplitIssuer(), '50')
    expect(await quadGovernance.passport(), '0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d ')
    expect(await quadGovernance.getIssuersLength(), '3')
    expect(await quadGovernance.getAllIssuersLength(), '3')
    expect(await quadGovernance.getEligibleAttributesLength(), '4')
    expect(await quadGovernance.getIssuers(), ['0x38a08d73153F32DBB2f867338d0BD6E3746E3391','0xA095585b1EF2310B4EcBe198a6A6CB86Ef386aBF','0x7256a9eE71fFFc02a92CAbBf950ea6e27f71bBF5'])
    expect(await quadGovernance.issuersTreasury('0x38a08d73153F32DBB2f867338d0BD6E3746E3391'), '0x5F3f69808772C56Daee7A5d3176990733C67A123')
    expect(await quadGovernance.issuersTreasury('0xA095585b1EF2310B4EcBe198a6A6CB86Ef386aBF'), '0xb93b22B75ac3EA6B5066c169B747DF249034F467')
    expect(await quadGovernance.issuersTreasury('0x7256a9eE71fFFc02a92CAbBf950ea6e27f71bBF5'), '0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21')
}

/// To get this test to work, you have to copy/paste .openzeppelin/mainnet.json into unknown-31337.json
/// or just run in the project root dir:
///
/// cp -r .openzeppelin/mainnet.json .openzeppelin/unknown-31337.json; npx hardhat test test/misc/test_passport_upgrade.ts
describe("PassportUpgrade", async () => {
    describe("upgrade", async () => {
        it("succeed", async () => {
            // fork mainnet eth
            await network.provider.request({
                method: "hardhat_reset",
                params: [
                    {
                        forking: {
                            jsonRpcUrl: process.env.MAINNET_URI,
                            blockNumber: 17082401,
                        },
                    },
                ],
            });

            // Preapproved address
            const preapprovedAddr = '0xbA80003B975D1C82d64Efc7F8d2daC393E79B3f9';
            await network.provider.request({
              method: "hardhat_impersonateAccount",
              params: [preapprovedAddr],
            });
            const preapproved = await ethers.getSigner(preapprovedAddr)
            const quadPassport = await ethers.getContractAt("QuadPassport", QUAD_PASSPORT[NETWORK_IDS.MAINNET]);
            const quadReader = await ethers.getContractAt("QuadReader", QUAD_READER[NETWORK_IDS.MAINNET]);
            const quadGovernance = await ethers.getContractAt("QuadGovernance", QUAD_GOVERNANCE[NETWORK_IDS.MAINNET]);

            const oldPassportImplAddress = await getImplementationAddress(network.provider, quadPassport.address);
            const oldReaderImplAddress = await getImplementationAddress(network.provider, quadReader.address);
            const oldGovernanceImplAddress = await getImplementationAddress(network.provider, quadGovernance.address);

            for (const wallet of [INDIVIDUAL_ADDRESS_1, INDIVIDUAL_ADDRESS_2, INDIVIDUAL_ADDRESS_3, INDIVIDUAL_ADDRESS_4, INDIVIDUAL_ADDRESS_5]){
                let results = await fetchResults(quadReader, preapproved, wallet)
                expect(results['did'][0].value).eql(EXPECTED_INDIVIDUAL_RESULTS[wallet]['did'])
                expect(results['aml'][0].value).eql(EXPECTED_INDIVIDUAL_RESULTS[wallet]['aml'])
                expect(results['country'][0].value).eql(EXPECTED_INDIVIDUAL_RESULTS[wallet]['country'])
            }

            await assertGovernanceValues(quadGovernance)

            const timelockAddress = "0x76694A182dB047067521c73161Ebf3Db5Ca988d3";
            await network.provider.request({
              method: "hardhat_impersonateAccount",
              params: [timelockAddress],
            });
            const timelock = await ethers.getSigner(timelockAddress)

            const deployer = (await ethers.getSigners())[0];
            await deployer.sendTransaction({
                to: timelock.address,
                value: ethers.utils.parseEther("100.0"),
            });
            await quadGovernance.connect(timelock).grantRole(GOVERNANCE_ROLE, deployer.address)

            const QuadPassport = await ethers.getContractFactory(
                "QuadPassport"
            );
            const upgradedPassport = await upgrades.upgradeProxy(
                quadPassport.address,
                QuadPassport,
                { unsafeAllow: ["constructor"] }
            );

            const QuadReader = await ethers.getContractFactory(
                "QuadReader"
            );
            const upgradedReader = await upgrades.upgradeProxy(
                quadReader.address,
                QuadReader,
                { unsafeAllow: ["constructor"] }
            );

            const QuadGovernance = await ethers.getContractFactory(
                "QuadGovernance"
            );
            const upgradedGovernance = await upgrades.upgradeProxy(
                quadGovernance.address,
                QuadGovernance,
                { unsafeAllow: ["constructor"] }
            );

            const newPassportImplAddress = await getImplementationAddress(network.provider, upgradedPassport.address);
            const newReaderImplAddress = await getImplementationAddress(network.provider, upgradedReader.address);
            const newGovernanceImplAddress = await getImplementationAddress(network.provider, upgradedGovernance.address);

            expect(newPassportImplAddress).to.not.eql(oldPassportImplAddress)
            expect(newReaderImplAddress).to.not.eql(oldReaderImplAddress)
            expect(newGovernanceImplAddress).to.not.eql(oldGovernanceImplAddress)

            for (const wallet of [INDIVIDUAL_ADDRESS_1, INDIVIDUAL_ADDRESS_2, INDIVIDUAL_ADDRESS_3, INDIVIDUAL_ADDRESS_4, INDIVIDUAL_ADDRESS_5]){
                let results = await fetchResults(upgradedReader, preapproved, wallet)
                expect(results['did'][0].value).eql(EXPECTED_INDIVIDUAL_RESULTS[wallet]['did'])
                expect(results['aml'][0].value).eql(EXPECTED_INDIVIDUAL_RESULTS[wallet]['aml'])
                expect(results['country'][0].value).eql(EXPECTED_INDIVIDUAL_RESULTS[wallet]['country'])
            }

            await assertGovernanceValues(upgradedGovernance)
        });
    });
});


