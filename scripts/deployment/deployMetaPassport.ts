import { ethers, upgrades } from "hardhat";

// RINKEBY BICONEMY FORWARDER: 0xFD4973FeB2031D4409fB57afEE5dF2051b171104

const deployQuadMetaPassport = async (
    forwarder: string,
    passport: string
) => {
    console.log("forwarder: ", forwarder);
    console.log("passport: ", passport);
    const QuadMetaPassport = await ethers.getContractFactory("QuadMetaPassport");
    const metaPassport = await QuadMetaPassport.deploy(
        forwarder,
        passport
    );
    await metaPassport.deployed();
    console.log(`QuadMetaPassport is deployed: ${metaPassport.address}`);
    return metaPassport;
};

(async () => {
    await deployQuadMetaPassport(
        '0xFD4973FeB2031D4409fB57afEE5dF2051b171104',
        '0x69Ec3DD088e971bC24ef49aB8e57325c28cf30Dd'
    );

    //  npx hardhat verify --network rinkeby 0xC725d3426bf7ccAF6042Aa8A1c6c24F494528E60 "0xFD4973FeB2031D4409fB57afEE5dF2051b171104" "0x485582Af3CA30F937b22f2b6d48340a8769e54A4" "0x69Ec3DD088e971bC24ef49aB8e57325c28cf30Dd"
})()
