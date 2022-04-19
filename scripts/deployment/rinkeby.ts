import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const { ethers, upgrades } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

const deployGovernance = async (
    admin: string
) => {
    const QuadGovernance = await ethers.getContractFactory("QuadGovernance");
    const governance = await upgrades.deployProxy(
        QuadGovernance,
        [admin],
        { initializer: "initialize", kind: "uups" }
    );
    await governance.deployed();
    console.log(`QuadGovernance is deployed: ${governance.address}`);
     return governance;
};


const deployPassport = async (
    governance: string,
    uri: string
) => {
    const QuadPassport = await ethers.getContractFactory("QuadPassport");
    const passport = await upgrades.deployProxy(
        QuadPassport,
        [governance, uri],
        { initializer: "initialize", kind: "uups" }
    );
    await passport.deployed();
    console.log(`QuadPassport is deployed: ${passport.address}`);
    return passport;
};

(async () => {

    const timelock = '0x[timelockAddress]'
    const governance = await deployGovernance(timelock)
    await deployPassport(governance.address, "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu");


})()