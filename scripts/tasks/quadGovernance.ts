import { id } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { recursiveRetry } from "../utils/retries";


task("addIssuer", "npx hardhat addIssuer --issuer <address> --governance <address> --network <network_name>")
    .addParam("issuer", "<address>")
    .addParam("governance", "<address>")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const issuerAddress = taskArgs.issuer;
        const governanceAddress = taskArgs.governance;
        const governance = await recursiveRetry(ethers.getContractAt, "QuadGovernance", governanceAddress);
        await recursiveRetry(governance.addIssuer, issuerAddress, issuerAddress);
        console.log("added " + issuerAddress + " on network " + hre.network.name);
    });


task("addIssuers", "npx hardhat addIssuers --issuers <address,address,...> --governance <address> --network <network_name>")
    .addParam("issuers", "<address,address,...>")
    .addParam("governance", "<address>")
    .setAction(async function (taskArgs, hre) {

        const issuerAddresses = taskArgs.issuers.split(",");
        const governanceAddress = taskArgs.governance;

        for (const issuerAddress of issuerAddresses) {
            await hre.run("addIssuer", { issuer: issuerAddress, governance: governanceAddress });
        }
    });

task("getIssuers", "npx hardhat getIssuers --governance <address> --network <network_name>")
    .addParam("governance", "<address>")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;

        const governanceAddress = taskArgs.governance;

        const governance = await ethers.getContractAt("QuadGovernance", governanceAddress);

        const issuers = await governance.getIssuers();

        console.log(issuers);
    });

task("setAttributePermission", "npx hardhat setAttributePermission --issuer <address> --attribute <string> --enabled <boolean> --governance <address) --network <network_name>")
    .addParam("issuer", "sets the issuer address")
    .addParam("attribute", "sets the attribute")
    .addParam("enabled", "sets the enabled flag")
    .addParam("governance", "sets the governance address")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const issuer = taskArgs.issuer;
        const attribute = taskArgs.attribute;
        const enabled = taskArgs.enabled;
        const governanceAddress = taskArgs.governance;

        const governance = await recursiveRetry(ethers.getContractAt, "QuadGovernance", governanceAddress);
        await recursiveRetry(governance.setIssuerAttributePermission, issuer, id(attribute), enabled);
        console.log("set " + attribute + " permission to " + enabled + " for " + issuer + " on network " + hre.network.name);
    });

task("setAttributePermissions", "npx hardhat setAttributePermissions --issuers <address,address,...> --attributes <string,string,...> --enabled <boolean> --governance <address) --network <network_name>")
    .addParam("issuers", "sets the issuer addresses")
    .addParam("attributes", "sets the attributes for all issuers")
    .addParam("enabled", "sets the enabled flag")
    .addParam("governance", "sets the governance address")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const issuerAddresses = taskArgs.issuers.split(",");
        const attributeNames = taskArgs.attributes.split(",");
        const enabled = taskArgs.enabled;
        const governanceAddress = taskArgs.governance;

        for (const issuerAddress of issuerAddresses) {
            for (const attributeName of attributeNames) {
                await hre.run("setAttributePermission", {
                    issuer: issuerAddress,
                    attribute: attributeName,
                    enabled: enabled,
                    governance: governanceAddress
                });
            }
        }
    });

task("setEligibleAttribute", "npx hardhat setEligibleAttribute --attribute <string> --eligible <boolean> --governance <address) --network <network_name>")
    .addParam("attribute", "sets the attribute")
    .addParam("eligible", "sets the eligible flag")
    .addParam("governance", "sets the governance address")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const attribute = taskArgs.attribute;
        const eligible = taskArgs.eligible;
        const governanceAddress = taskArgs.governance;

        const governance = await recursiveRetry(ethers.getContractAt, "QuadGovernance", governanceAddress);
        await recursiveRetry(governance.setEligibleAttribute, id(attribute), eligible);
        console.log("set " + attribute + " eligibility to " + eligible + " on network " + hre.network.name);
    });

task("setEligibleAttributes", "npx hardhat setEligibleAttributes --attributes <string,string,...> --eligible <boolean> --governance <address) --network <network_name>")
    .addParam("attributes", "sets the attributes")
    .addParam("eligible", "sets the eligible flag")
    .addParam("governance", "sets the governance address")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const attributeNames = taskArgs.attributes.split(",");
        const eligible = taskArgs.eligible;
        const governanceAddress = taskArgs.governance;

        for (const attributeName of attributeNames) {
            await hre.run("setEligibleAttribute", {
                attribute: attributeName,
                eligible: eligible,
                governance: governanceAddress
            });
        }
    });

task("setEligibleAttributeByDID", "npx hardhat setEligibleAttributeByDID --attribute <string> --eligible <boolean> --governance <address> --network <network_name>")
    .addParam("attribute", "sets the attribute")
    .addParam("eligible", "sets the eligible flag")
    .addParam("governance", "sets the governance address")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const attribute = taskArgs.attribute;
        const eligible = taskArgs.eligible;
        const governanceAddress = taskArgs.governance;

        const governance = await recursiveRetry(ethers.getContractAt, "QuadGovernance", governanceAddress);
        await recursiveRetry(governance.setEligibleAttributeByDID, id(attribute), eligible);
        console.log("set " + attribute + " eligibility by DID to " + eligible + " on network " + hre.network.name);
    });

task("setEligibleAttributesByDID", "npx hardhat setEligibleAttributesByDID --attributes <string,string,...> --eligible <boolean> --governance <address> --network <network_name>")
    .addParam("attributes", "sets the attributes")
    .addParam("eligible", "sets the eligible flag")
    .addParam("governance", "sets the governance address")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const attributeNames = taskArgs.attributes.split(",");
        const eligible = taskArgs.eligible;
        const governanceAddress = taskArgs.governance;

        for (const attributeName of attributeNames) {
            await hre.run("setEligibleAttributeByDID", {
                attribute: attributeName,
                eligible: eligible,
                governance: governanceAddress
            });
        }
    });

/*
// usage for setting all attribute eligibility for all testnets (account level)
(copy and paste all of the following into terminal)
npx hardhat setEligibleAttributes --attributes COUNTRY,IS_BUSINESS,CRED_PROTOCOL_SCORE --eligible true --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network goerli
npx hardhat setEligibleAttributes --attributes COUNTRY,IS_BUSINESS,CRED_PROTOCOL_SCORE --eligible true --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network mumbai
npx hardhat setEligibleAttributes --attributes COUNTRY,IS_BUSINESS,CRED_PROTOCOL_SCORE --eligible true --governance 0xC1fcC7790291FF3D9DC378bfA16047eC3002a83a --network avax_testnet
npx hardhat setEligibleAttributes --attributes COUNTRY,IS_BUSINESS,CRED_PROTOCOL_SCORE --eligible true --governance 0xCF6bA3a3d18bA1e35A41db79B3dBF2F6023F6071 --network bsc_testnet
npx hardhat setEligibleAttributes --attributes COUNTRY,IS_BUSINESS,CRED_PROTOCOL_SCORE --eligible true --governance 0x2B212B47Faf2040cA4782e812048F5aE8ad5Fa2f --network celo_testnet
npx hardhat setEligibleAttributes --attributes COUNTRY,IS_BUSINESS,CRED_PROTOCOL_SCORE --eligible true --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network arbitrum_goerli
npx hardhat setEligibleAttributes --attributes COUNTRY,IS_BUSINESS,CRED_PROTOCOL_SCORE --eligible true --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network optimism_goerli
npx hardhat setEligibleAttributes --attributes COUNTRY,IS_BUSINESS,CRED_PROTOCOL_SCORE --eligible true --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network fantom_testnet

// usage for setting all attribute eligibility for all testnets (did level)
(copy and paste all of the following into terminal)
npx hardhat setEligibleAttributesByDID --attributes AML,IS_ACCREDITITED_INVESTOR_US,IS_QUALIFIEDPURCHASER_US --eligible true --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network goerli
npx hardhat setEligibleAttributesByDID --attributes AML,IS_ACCREDITITED_INVESTOR_US,IS_QUALIFIEDPURCHASER_US --eligible true --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network mumbai
npx hardhat setEligibleAttributesByDID --attributes AML,IS_ACCREDITITED_INVESTOR_US,IS_QUALIFIEDPURCHASER_US --eligible true --governance 0xC1fcC7790291FF3D9DC378bfA16047eC3002a83a --network avax_testnet
npx hardhat setEligibleAttributesByDID --attributes AML,IS_ACCREDITITED_INVESTOR_US,IS_QUALIFIEDPURCHASER_US --eligible true --governance 0xCF6bA3a3d18bA1e35A41db79B3dBF2F6023F6071 --network bsc_testnet
npx hardhat setEligibleAttributesByDID --attributes AML,IS_ACCREDITITED_INVESTOR_US,IS_QUALIFIEDPURCHASER_US --eligible true --governance 0x2B212B47Faf2040cA4782e812048F5aE8ad5Fa2f --network celo_testnet
npx hardhat setEligibleAttributesByDID --attributes AML,IS_ACCREDITITED_INVESTOR_US,IS_QUALIFIEDPURCHASER_US --eligible true --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network arbitrum_goerli
npx hardhat setEligibleAttributesByDID --attributes AML,IS_ACCREDITITED_INVESTOR_US,IS_QUALIFIEDPURCHASER_US --eligible true --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network optimism_goerli
npx hardhat setEligibleAttributesByDID --attributes AML,IS_ACCREDITITED_INVESTOR_US,IS_QUALIFIEDPURCHASER_US --eligible true --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network fantom_testnet

// usage for setting all attributes for all issuers for all testnets
(copy and paste all of the following into terminal)
npx hardhat setAttributePermissions --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --attributes AML,COUNTRY,DID,IS_BUSINESS,CRED_PROTOCOL_SCORE --enabled true --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network goerli
npx hardhat setAttributePermissions --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --attributes AML,COUNTRY,DID,IS_BUSINESS,CRED_PROTOCOL_SCORE --enabled true --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network mumbai
npx hardhat setAttributePermissions --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --attributes AML,COUNTRY,DID,IS_BUSINESS,CRED_PROTOCOL_SCORE --enabled true --governance 0xC1fcC7790291FF3D9DC378bfA16047eC3002a83a --network avax_testnet
npx hardhat setAttributePermissions --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --attributes AML,COUNTRY,DID,IS_BUSINESS,CRED_PROTOCOL_SCORE --enabled true --governance 0xCF6bA3a3d18bA1e35A41db79B3dBF2F6023F6071 --network bsc_testnet
npx hardhat setAttributePermissions --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --attributes AML,COUNTRY,DID,IS_BUSINESS,CRED_PROTOCOL_SCORE --enabled true --governance 0x2B212B47Faf2040cA4782e812048F5aE8ad5Fa2f --network celo_testnet
npx hardhat setAttributePermissions --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --attributes AML,COUNTRY,DID,IS_BUSINESS,CRED_PROTOCOL_SCORE --enabled true --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network arbitrum_goerli
npx hardhat setAttributePermissions --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --attributes AML,COUNTRY,DID,IS_BUSINESS,CRED_PROTOCOL_SCORE --enabled true --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network optimism_goerli
npx hardhat setAttributePermissions --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --attributes AML,COUNTRY,DID,IS_BUSINESS,CRED_PROTOCOL_SCORE --enabled true --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network fantom_testnet

// usage for getting all issuers for all testnets
(copy and paste all of the following into terminal)

npx hardhat getIssuers --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network goerli
npx hardhat getIssuers --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network mumbai
npx hardhat getIssuers --governance 0xC1fcC7790291FF3D9DC378bfA16047eC3002a83a --network avax_testnet
npx hardhat getIssuers --governance 0xCF6bA3a3d18bA1e35A41db79B3dBF2F6023F6071 --network bsc_testnet
npx hardhat getIssuers --governance 0x2B212B47Faf2040cA4782e812048F5aE8ad5Fa2f --network celo_testnet
npx hardhat getIssuers --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network arbitrum_goerli
npx hardhat getIssuers --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network optimism_goerli
npx hardhat getIssuers --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network fantom_testnet

*/

/*

// usage for adding all issuers for all testnets
(copy and paste all of the following into terminal)

npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network goerli
npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --network mumbai
npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0xC1fcC7790291FF3D9DC378bfA16047eC3002a83a --network avax_testnet
npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0xCF6bA3a3d18bA1e35A41db79B3dBF2F6023F6071 --network bsc_testnet
npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0x2B212B47Faf2040cA4782e812048F5aE8ad5Fa2f --network celo_testnet
npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network arbitrum_goerli
npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network optimism_goerli
npx hardhat addIssuers --issuers 0x0706a7CFC2d1B8EcFbF3dF103095Ac3047BeA431,0xd0c0256D625a74c0ACb7447Bd0940f23BBe33ff1,0x3097988FD29cD00f2C27B2b964F99Ac974d30A41,0x1135F3b9f2895Fb1B688B354Aea3C31114B49a38,0x8859c986F102924DBeC3767b67497b8d89Be2463 --governance 0x82F5a215f29089429C634d686103D297b85d4e2a --network fantom_testnet

*/