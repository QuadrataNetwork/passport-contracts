import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
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

    let creditUser: Contract;

    let chainId: number;

    let admin: SignerWithAddress,
        transUnion: SignerWithAddress,
        treasury: SignerWithAddress,
        user: SignerWithAddress,
        issuerA: SignerWithAddress,
        issuerB: SignerWithAddress;

    beforeEach(async () => {
        [admin, transUnion, treasury, user, issuerA, issuerB] = await ethers.getSigners();
        [governance, passport, reader] = await deployPassportEcosystem(admin, [issuerA, issuerB], treasury, [issuerA, issuerB]);

        const CreditUser = await ethers.getContractFactory("CreditUser");
        creditUser = await CreditUser.deploy(reader.address);

        chainId = await ethers.provider.getNetwork().then((network) => network.chainId);
    });

    it('success - autherized dapp can flash attributes', async () => {
        const now = 3429834;
        console.log(chainId);
        const hash = keccak256(
            ethers.utils.defaultAbiCoder.encode([
                "address",
                "address",
                "bytes32",
                "uint256",
                "uint256",
                "bytes32",
                "bool",
                "uint256"
            ], [
                user.address,
                admin.address,
                ATTRIBUTE_TU_CREDIT_SCORE,
                now,
                400,
                hexZeroPad("0x", 32),
                false,
                chainId
            ])
        )
        console.log("hash: ", hash);
        const sig = await issuerA.signMessage(hash);

        await reader.connect(admin).getFlashAttributeGTE(
            user.address,
            admin.address,
            ATTRIBUTE_TU_CREDIT_SCORE,
            now,
            400,
            sig
        );
    });
});