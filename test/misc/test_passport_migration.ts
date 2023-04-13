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
} = require("../../utils/constant.ts");

describe.skip("PassportMigration", async () => {
    describe("upgrade", async () => {
        it("succeed", async () => {
            // fork mainnet eth
            await network.provider.request({
                method: "hardhat_reset",
                params: [
                    {
                        forking: {
                            jsonRpcUrl: process.env.MAINNET_URI,
                            blockNumber: 17039224,
                        },
                    },
                ],
            });
            // Preapproved address
            await network.provider.request({
              method: "hardhat_impersonateAccount",
              params: ["0xbA80003B975D1C82d64Efc7F8d2daC393E79B3f9"],
            });

            const quadPassport = await ethers.getContractAt("QuadPassport", "0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d");
            const quadReader = await ethers.getContractAt("QuadReader", "0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da");
            const quadGovernance = await ethers.getContractAt("QuadGovernance", "0xBfa59A31b379A62304327386bC2b03096D7695B3");

            const oldPassportImplAddress = await getImplementationAddress(network.provider, quadPassport.address);
            const oldReaderImplAddress = await getImplementationAddress(network.provider, quadReader.address);
            const oldGovernanceImplAddress = await getImplementationAddress(network.provider, quadGovernance.address);


            const preapproved = await ethers.getSigner("0xbA80003B975D1C82d64Efc7F8d2daC393E79B3f9")

            const didResults = await quadReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_DID)
            const amlResults = await quadReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_AML)
            const countryResults = await quadReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_COUNTRY)

            expect(didResults[0].value).eql('0xf7b171699fd929a3c0a2795659d9b10bc2cab64b934fe49686d5b0ab909a8ee1')
            expect(amlResults[0].value).eql('0x0000000000000000000000000000000000000000000000000000000000000001')
            expect(countryResults[0].value).eql('0x627fe66dd064a0a7d686e05b87b04d5a7c585907afae1f0c65ab27fa379ca189')

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

            await network.provider.request({
              method: "hardhat_impersonateAccount",
              params: ["0x76694A182dB047067521c73161Ebf3Db5Ca988d3"],
            });
            const timelock = await ethers.getSigner("0x76694A182dB047067521c73161Ebf3Db5Ca988d3")

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

            const upgradedDidResults = await upgradedReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_DID)
            const upgradedAmlResults = await upgradedReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_AML)
            const upgradedCountryResults = await upgradedReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_COUNTRY)

            expect(upgradedDidResults[0].value).eql('0xf7b171699fd929a3c0a2795659d9b10bc2cab64b934fe49686d5b0ab909a8ee1')
            expect(upgradedAmlResults[0].value).eql('0x0000000000000000000000000000000000000000000000000000000000000001')
            expect(upgradedCountryResults[0].value).eql('0x627fe66dd064a0a7d686e05b87b04d5a7c585907afae1f0c65ab27fa379ca189')

            expect(await upgradedGovernance.treasury(), '0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21')
            expect(await upgradedGovernance.revSplitIssuer(), '50')
            expect(await upgradedGovernance.passport(), '0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d ')
            expect(await upgradedGovernance.getIssuersLength(), '3')
            expect(await upgradedGovernance.getAllIssuersLength(), '3')
            expect(await upgradedGovernance.getEligibleAttributesLength(), '4')
            expect(await upgradedGovernance.getIssuers(), ['0x38a08d73153F32DBB2f867338d0BD6E3746E3391','0xA095585b1EF2310B4EcBe198a6A6CB86Ef386aBF','0x7256a9eE71fFFc02a92CAbBf950ea6e27f71bBF5'])
            expect(await upgradedGovernance.issuersTreasury('0x38a08d73153F32DBB2f867338d0BD6E3746E3391'), '0x5F3f69808772C56Daee7A5d3176990733C67A123')
            expect(await upgradedGovernance.issuersTreasury('0xA095585b1EF2310B4EcBe198a6A6CB86Ef386aBF'), '0xb93b22B75ac3EA6B5066c169B747DF249034F467')
            expect(await upgradedGovernance.issuersTreasury('0x7256a9eE71fFFc02a92CAbBf950ea6e27f71bBF5'), '0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21')
        });
    });
});


