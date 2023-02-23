import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { READER_ROLE } from "../../utils/constant";
import { deployPassportEcosystem } from '../helpers/deployment_and_init';


describe('Flash attributes', () => {

    let reader: Contract;
    let passport: Contract;
    let governance: Contract;

    let creditUser: Contract;

    let admin: SignerWithAddress,
        transUnion: SignerWithAddress,
        treasury: SignerWithAddress,
        user: SignerWithAddress,
        issuerA: SignerWithAddress,
        issuerB: SignerWithAddress;

    beforeEach(async () => {
        [admin, transUnion, treasury, user, issuerA, issuerB] = await ethers.getSigners();
        const [governance, passport, reader] = await deployPassportEcosystem(admin, [issuerA, issuerB], treasury, [issuerA, issuerB]);

        const CreditUser = await ethers.getContractFactory("CreditUser");
        creditUser = await CreditUser.deploy(reader.address);
    });

    it('success - autherized dapp can flash attributes', async () => {
    });

});