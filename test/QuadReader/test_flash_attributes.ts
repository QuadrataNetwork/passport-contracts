import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { hexZeroPad, keccak256 } from "ethers/lib/utils";
import { ATTRIBUTE_TU_CREDIT_SCORE } from "../../utils/constant";

const {
  deployPassportEcosystem,
} = require("../helpers/deployment_and_init.ts");


describe('Flash attributes', () => {
    let reader: Contract;
    let passport: Contract;
    let governance: Contract;

    let chainId: number;

    let admin: SignerWithAddress,
        treasury: SignerWithAddress,
        user: SignerWithAddress,
        issuerA: SignerWithAddress,
        issuerB: SignerWithAddress;

    beforeEach(async () => {
        [admin, treasury, user, issuerA, issuerB] = await ethers.getSigners();
        [governance, passport, reader] = await deployPassportEcosystem(admin, [issuerA, issuerB], treasury, [issuerA, issuerB]);

        chainId = await ethers.provider.getNetwork().then((network) => network.chainId);
    });
    describe('getFlashAttributeGTE', () => {
        it('authorizes when dapp signs over TRUE', async () => {
            const now = 3429834;
            const fee = 0;
            const hash = keccak256(
                ethers.utils.defaultAbiCoder.encode([
                    "address",
                    "address",
                    "bytes32",
                    "uint256",
                    "uint256",
                    "bytes32",
                    "uint256",
                    "bytes32",
                    "uint256"
                ], [
                    user.address,
                    admin.address,
                    ATTRIBUTE_TU_CREDIT_SCORE,
                    now,
                    400,
                    hexZeroPad("0x", 32),
                    fee,
                    utils.keccak256(utils.toUtf8Bytes("TRUE")),
                    chainId
                ])
            )
            const sig = await issuerA.signMessage(ethers.utils.arrayify(hash));
            expect(
                await reader.connect(admin).callStatic.getFlashAttributeGTE(
                    user.address,
                    admin.address,
                    ATTRIBUTE_TU_CREDIT_SCORE,
                    now,
                    400,
                    fee,
                    sig)
            ).to.equal(true);
        });

        it('authorizes when dapp signs over FALSE', async () => {
            const now = 3429834;
            const fee = 0;
            const hash = keccak256(
                ethers.utils.defaultAbiCoder.encode([
                    "address",
                    "address",
                    "bytes32",
                    "uint256",
                    "uint256",
                    "bytes32",
                    "uint256",
                    "bytes32",
                    "uint256"
                ], [
                    user.address,
                    admin.address,
                    ATTRIBUTE_TU_CREDIT_SCORE,
                    now,
                    400,
                    hexZeroPad("0x", 32),
                    fee,
                    utils.keccak256(utils.toUtf8Bytes("FALSE")),
                    chainId
                ])
            )
            const sig = await issuerA.signMessage(ethers.utils.arrayify(hash));
            expect(
                await reader.connect(admin).callStatic.getFlashAttributeGTE(
                    user.address,
                    admin.address,
                    ATTRIBUTE_TU_CREDIT_SCORE,
                    now,
                    400,
                    fee,
                    sig)
            ).to.equal(false);
        });
    });
});
