import { ethers, upgrades } from "hardhat";
import { network } from "hardhat";
import { expect } from "chai";

const {
    GOVERNANCE_ROLE,
    ATTRIBUTE_DID,
    ATTRIBUTE_AML,
    ATTRIBUTE_COUNTRY,
    ATTRIBUTE_IS_BUSINESS,
} = require("../../utils/constant.ts");

describe("PassportMigration", async () => {
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

            const preapproved = await ethers.getSigner("0xbA80003B975D1C82d64Efc7F8d2daC393E79B3f9")

            const didResults = await quadReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_DID)
            const amlResults = await quadReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_AML)
            const countryResults = await quadReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_COUNTRY)

            expect(didResults[0].value).eql('0xf7b171699fd929a3c0a2795659d9b10bc2cab64b934fe49686d5b0ab909a8ee1')
            expect(amlResults[0].value).eql('0x0000000000000000000000000000000000000000000000000000000000000001')
            expect(countryResults[0].value).eql('0x627fe66dd064a0a7d686e05b87b04d5a7c585907afae1f0c65ab27fa379ca189')

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

            const upgradedDidResults = await quadReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_DID)
            const upgradedAmlResults = await quadReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_AML)
            const upgradedCountryResults = await quadReader.connect(preapproved).callStatic.getAttributes('0xbb0D3aD3ba60EeE1F8d33F00A7f1F2c384Ae7526', ATTRIBUTE_COUNTRY)

            expect(upgradedDidResults[0].value).eql('0xf7b171699fd929a3c0a2795659d9b10bc2cab64b934fe49686d5b0ab909a8ee1')
            expect(upgradedAmlResults[0].value).eql('0x0000000000000000000000000000000000000000000000000000000000000001')
            expect(upgradedCountryResults[0].value).eql('0x627fe66dd064a0a7d686e05b87b04d5a7c585907afae1f0c65ab27fa379ca189')

        });
    });
});


