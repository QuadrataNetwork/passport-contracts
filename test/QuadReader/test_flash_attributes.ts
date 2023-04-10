import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { hexZeroPad, keccak256 } from "ethers/lib/utils";
import { ATTRIBUTE_TRANSUNION_CREDIT_SCORE } from "../../utils/constant";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");


describe('Flash attributes', () => {
    let reader: Contract;
    let passport: Contract;
    let governance: Contract;

    let chainId: number;

    let deployer: SignerWithAddress,
        admin: SignerWithAddress,
        treasury: SignerWithAddress,
        user: SignerWithAddress,
        issuerA: SignerWithAddress,
        issuerATreasury: SignerWithAddress,
        issuerB: SignerWithAddress,
        issuerBTreasury: SignerWithAddress;

    beforeEach(async () => {
        [deployer, admin, treasury, user, issuerA, issuerB, issuerATreasury, issuerBTreasury] = await ethers.getSigners();
        [governance, passport, reader] = await deployPassportEcosystem(admin, [issuerA, issuerB], treasury, [issuerATreasury, issuerBTreasury]);

        chainId = await ethers.provider.getNetwork().then((network) => network.chainId);
    });
    describe('getFlashAttributeGTE', () => {
        describe('success', () => {
            it('authorizes once when dapp signs over TRUE', async () => {
                const now = 3429834;
                const fee = 0;
                const hash = keccak256(
                    ethers.utils.defaultAbiCoder.encode([
                        "address",
                        "address",
                        "bytes32",
                        "uint256",
                        "uint256",
                        "uint256",
                        "bytes32",
                        "uint256"
                    ], [
                        user.address,
                        admin.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        fee,
                        utils.keccak256(utils.toUtf8Bytes("TRUE")),
                        chainId
                    ])
                )
                const sig = await issuerA.signMessage(ethers.utils.arrayify(hash));
                expect(
                    await reader.connect(admin).callStatic.getFlashAttributeGTE(
                        user.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        sig)
                ).to.equal(true);

                const balanceBefore = await ethers.provider.getBalance(issuerATreasury.address)

                // actually call once and then call a second time
                await reader.connect(admin).getFlashAttributeGTE(
                    user.address,
                    ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                    now,
                    400,
                    sig)

                const balanceAfter = await ethers.provider.getBalance(issuerATreasury.address)
                expect(balanceAfter.sub(balanceBefore).toNumber()).to.equal(fee)

                await expect(
                    reader.connect(admin).getFlashAttributeGTE(
                        user.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        sig)
                ).to.be.revertedWith('SIGNATURE_ALREADY_USED');
            });

            it('authorizes once when dapp signs over FALSE', async () => {
                const now = 3429834;
                const fee = 0;
                const hash = keccak256(
                    ethers.utils.defaultAbiCoder.encode([
                        "address",
                        "address",
                        "bytes32",
                        "uint256",
                        "uint256",
                        "uint256",
                        "bytes32",
                        "uint256"
                    ], [
                        user.address,
                        admin.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        fee,
                        utils.keccak256(utils.toUtf8Bytes("FALSE")),
                        chainId
                    ])
                )
                const sig = await issuerA.signMessage(ethers.utils.arrayify(hash));
                expect(
                    await reader.connect(admin).callStatic.getFlashAttributeGTE(
                        user.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        sig)
                ).to.equal(false);

                const balanceBefore = await ethers.provider.getBalance(issuerATreasury.address)

                // actually call once and then call a second time
                await reader.connect(admin).getFlashAttributeGTE(
                    user.address,
                    ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                    now,
                    400,
                    sig)

                const balanceAfter = await ethers.provider.getBalance(issuerATreasury.address)
                expect(balanceAfter.sub(balanceBefore).toNumber()).to.equal(fee)

                await expect(
                    reader.connect(admin).getFlashAttributeGTE(
                        user.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        sig)
                ).to.be.revertedWith('SIGNATURE_ALREADY_USED');
            });

            it('authorizes once when dapp signs over TRUE with a fee', async () => {
                const now = 3429834;
                const fee = 100000;
                const hash = keccak256(
                    ethers.utils.defaultAbiCoder.encode([
                        "address",
                        "address",
                        "bytes32",
                        "uint256",
                        "uint256",
                        "uint256",
                        "bytes32",
                        "uint256"
                    ], [
                        user.address,
                        admin.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        fee,
                        utils.keccak256(utils.toUtf8Bytes("TRUE")),
                        chainId
                    ])
                )
                const sig = await issuerA.signMessage(ethers.utils.arrayify(hash));
                expect(
                    await reader.connect(admin).callStatic.getFlashAttributeGTE(
                        user.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        sig, {value: fee})
                ).to.equal(true);

                const balanceBefore = await ethers.provider.getBalance(issuerATreasury.address)
                // Actually make the call now instead of callstatic
                const tx = await reader.connect(admin).getFlashAttributeGTE(
                    user.address,
                    ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                    now,
                    400,
                    sig, {value: fee});
                const balanceAfter = await ethers.provider.getBalance(issuerATreasury.address)
                expect(balanceAfter.sub(balanceBefore).toNumber()).to.equal(fee)

                await expect(
                    reader.connect(admin).getFlashAttributeGTE(
                        user.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        sig, {value: fee})
                ).to.be.revertedWith('SIGNATURE_ALREADY_USED');
            });
        });
        describe('failure', () => {
            it('has invalid msg.value', async () => {
                const now = 3429834;
                const fee = 100000;
                const hash = keccak256(
                    ethers.utils.defaultAbiCoder.encode([
                        "address",
                        "address",
                        "bytes32",
                        "uint256",
                        "uint256",
                        "uint256",
                        "bytes32",
                        "uint256"
                    ], [
                        user.address,
                        admin.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        fee,
                        utils.keccak256(utils.toUtf8Bytes("TRUE")),
                        chainId
                    ])
                )
                const sig = await issuerA.signMessage(ethers.utils.arrayify(hash));

                await expect(
                    reader.connect(admin).getFlashAttributeGTE(
                        user.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        sig, {value: 0})
                ).to.be.revertedWith('INVALID_ISSUER_OR_PARAMS');

                await expect(
                    reader.connect(admin).getFlashAttributeGTE(
                        user.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        sig, {value: fee + fee})
                ).to.be.revertedWith('INVALID_ISSUER_OR_PARAMS');
            });

            it('is signed by an invalid issuer', async() =>{
                const now = 3429834;
                const fee = 100000;
                const hash = keccak256(
                    ethers.utils.defaultAbiCoder.encode([
                        "address",
                        "address",
                        "bytes32",
                        "uint256",
                        "uint256",
                        "uint256",
                        "bytes32",
                        "uint256"
                    ], [
                        admin.address,
                        user.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        fee,
                        utils.keccak256(utils.toUtf8Bytes("TRUE")),
                        chainId
                    ])
                )
                const sig = await user.signMessage(ethers.utils.arrayify(hash));

                await expect(
                    reader.connect(user).getFlashAttributeGTE(
                        admin.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        sig, {value: fee})
                ).to.be.revertedWith('INVALID_ISSUER_OR_PARAMS');
            });
            it('has an invalid account', async () => {
                const now = 3429834;
                const fee = 100000;
                const hash = keccak256(
                    ethers.utils.defaultAbiCoder.encode([
                        "address",
                        "address",
                        "bytes32",
                        "uint256",
                        "uint256",
                        "uint256",
                        "bytes32",
                        "uint256"
                    ], [
                        user.address,
                        admin.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        fee,
                        utils.keccak256(utils.toUtf8Bytes("TRUE")),
                        chainId
                    ])
                )
                const sig = await issuerA.signMessage(ethers.utils.arrayify(hash));

                await expect(
                    reader.connect(admin).getFlashAttributeGTE(
                        admin.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        sig, {value: fee})
                ).to.be.revertedWith('INVALID_ISSUER_OR_PARAMS');
            });
            it('sender is not preapproved', async () => {
                const now = 3429834;
                const fee = 0;
                const hash = keccak256(
                    ethers.utils.defaultAbiCoder.encode([
                        "address",
                        "address",
                        "bytes32",
                        "uint256",
                        "uint256",
                        "uint256",
                        "bytes32",
                        "uint256"
                    ], [
                        user.address,
                        admin.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        fee,
                        utils.keccak256(utils.toUtf8Bytes("TRUE")),
                        chainId
                    ])
                )
                const sig = await issuerA.signMessage(ethers.utils.arrayify(hash));
                const randomSigner = ethers.Wallet.createRandom().connect(ethers.provider);
                await expect(
                    reader.connect(randomSigner).callStatic.getFlashAttributeGTE(
                        user.address,
                        ATTRIBUTE_TRANSUNION_CREDIT_SCORE,
                        now,
                        400,
                        sig, {value: fee})
                ).to.be.revertedWith('SENDER_NOT_AUTHORIZED');
            });
            it('attribute is not eligible', async () => {
                const now = 3429834;
                const fee = 0;
                const hash = keccak256(
                    ethers.utils.defaultAbiCoder.encode([
                        "address",
                        "address",
                        "bytes32",
                        "uint256",
                        "uint256",
                        "uint256",
                        "bytes32",
                        "uint256"
                    ], [
                        user.address,
                        admin.address,
                        ethers.utils.id("RANDOM_ATTR"),
                        now,
                        400,
                        fee,
                        utils.keccak256(utils.toUtf8Bytes("TRUE")),
                        chainId
                    ])
                )
                const sig = await issuerA.signMessage(ethers.utils.arrayify(hash));
                await expect(
                    reader.connect(admin).callStatic.getFlashAttributeGTE(
                        user.address,
                        ethers.utils.id("RANDOM_ATTR"),
                        now,
                        400,
                        sig, {value: fee})
                ).to.be.revertedWith('INVALID_ATTRIBUTE');
            });
            it('issuer does not have permission to sign attribute', async () => {
                governance.connect(admin).setEligibleAttribute(ethers.utils.id("RANDOM_ATTR"), true)
                const now = 3429834;
                const fee = 0;
                const hash = keccak256(
                    ethers.utils.defaultAbiCoder.encode([
                        "address",
                        "address",
                        "bytes32",
                        "uint256",
                        "uint256",
                        "uint256",
                        "bytes32",
                        "uint256"
                    ], [
                        user.address,
                        admin.address,
                        ethers.utils.id("RANDOM_ATTR"),
                        now,
                        400,
                        fee,
                        utils.keccak256(utils.toUtf8Bytes("TRUE")),
                        chainId
                    ])
                )
                const sig = await issuerA.signMessage(ethers.utils.arrayify(hash));
                await expect(
                    reader.connect(admin).callStatic.getFlashAttributeGTE(
                        user.address,
                        ethers.utils.id("RANDOM_ATTR"),
                        now,
                        400,
                        sig, {value: fee})
                ).to.be.revertedWith('INVALID_ISSUER_ATTR_PERMISSION');
            });
        });
    });
});
