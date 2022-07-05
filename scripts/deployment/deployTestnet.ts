import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

const { ethers, upgrades } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

const deployGovernance = async (
    admin: string
) => {
    console.log("Admin: ", admin);
    const QuadGovernance = await ethers.getContractFactory("QuadGovernance");
    const governance = await upgrades.deployProxy(
        QuadGovernance,
        [admin],
        { initializer: "initialize", kind: "uups", unsafeAllow: ['constructor']  }
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
        { initializer: "initialize", kind: "uups", unsafeAllow: ['constructor']  }
    );
    await passport.deployed();
    console.log(`QuadPassport is deployed: ${passport.address}`);
    return passport;
};

export const deployReader = async (
    governance: SignerWithAddress,
    passport: SignerWithAddress
  ): Promise<Contract> => {
    const QuadReader = await ethers.getContractFactory("QuadReader");
    const reader = await upgrades.deployProxy(
      QuadReader,
      [
        governance.address,
        passport.address
      ],
      { initializer: "initialize", kind: "uups", unsafeAllow: ['constructor'] }
    );
    console.log("QuadReader is deployed: ", reader.address);
    await reader.deployed();
    return reader;
  };

const springLabsLEDeployment = async (governanceAddr:string) => {

    const governance = await ethers.getContractAt('QuadGovernance', governanceAddr)

    // SL 'L/E issuers'
    await governance.setIssuer('0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38', '0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38');
    console.log('added issuer: ', '0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38')
    await governance.setIssuer('0x8859c986F102924DBeC3767b67497b8d89Be2463', '0x8859c986F102924DBeC3767b67497b8d89Be2463');
    console.log('added issuer: ', '0x8859c986F102924DBeC3767b67497b8d89Be2463')
    await governance.setIssuer('0x3097988FD29cD00f2C27B2b964F99Ac974d30A41', '0x3097988FD29cD00f2C27B2b964F99Ac974d30A41');
    console.log('added issuer: ', '0x3097988FD29cD00f2C27B2b964F99Ac974d30A41')
    await governance.setIssuer('0x4c7E4C698f7D955981912FdDBA84cBFE84101d1E', '0x4c7E4C698f7D955981912FdDBA84cBFE84101d1E');
    console.log('added issuer: ', '0x4c7E4C698f7D955981912FdDBA84cBFE84101d1E')
    await governance.setIssuer('0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431', '0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431');
    console.log('added issuer: ', '0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431')

    // SL 'prod testnet issuers'
    await governance.setIssuer('0xAB5f37eA10Bd98228CDd5cD59605241DfE811701', '0xe5eF9Ce921f90086d55f0E8f541EF7892796268A');
    console.log('added issuer: ', '0xAB5f37eA10Bd98228CDd5cD59605241DfE811701')

}

const setTestingInterfaceIssuer = async (governanceAddr:string) => {
  const governance = await ethers.getContractAt('QuadGovernance', governanceAddr)

  await governance.setIssuer('0x19c6525E6927554e311Cd83491d34623fF04605a', '0x19c6525E6927554e311Cd83491d34623fF04605a');
  console.log('added issuer: ', '0x19c6525E6927554e311Cd83491d34623fF04605a')
}

(async () => {

    const signers = await ethers.getSigners()
    const timelock = signers[0].address;
    const governance = await deployGovernance(timelock)
    const passport = await deployPassport(governance.address, "ipfs://QmSczMjKWDJBoYSFzPAm3MVFznKcHNnR4EJW23Ng1zQAWu");
    const reader = await deployReader(governance, passport);


    await setTestingInterfaceIssuer(governance.address)
    await springLabsLEDeployment(governance.address)
})()
