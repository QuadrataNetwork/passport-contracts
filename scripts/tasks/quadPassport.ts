import { hexZeroPad, id } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { deployGovernance } from "../../utils/deployment";
import { recursiveRetry } from "../utils/retries";


task("getSetReaderFunctionData", "npx hardhat getSetReaderFunctionData --reader <address>")
    .addParam("reader", "sets the address for reader")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const address = taskArgs.reader;
        // return error if network is not hardhat
        if (hre.network.name != "hardhat") {
            console.log("getSetReaderFunctionData can only be run on hardhat network");
            return;
        }
        const QuadPassport = await ethers.getContractFactory("QuadPassport");
        const passport = await QuadPassport.deploy();
        await passport.deployed();

        const setQuadReaderFunctionData = passport.interface.encodeFunctionData("setQuadReader", [address]);
        console.log(setQuadReaderFunctionData);
    });


task("getAllMinters", "npx hardhat getAllMinters --passport <address>")
    .addParam("passport", "sets the address for passport")
    .setAction(async function (taskArgs, hre) {
        const ethers = hre.ethers;
        const address = taskArgs.passport;
        const passport = await ethers.getContractAt("QuadPassport", address);

        const filter = passport.filters.TransferSingle(null, null, null, null, null);
        const logs = await passport.queryFilter(filter, 0, "latest");
        const accounts = [];
        for (const log in logs) {
            const { args } = logs[log];
            const { from, to, id, value } = args as any;
            if (from === ethers.constants.AddressZero) {
                accounts.push(to);
            }
            if (to === ethers.constants.AddressZero) {
                delete accounts[accounts.indexOf(from)];
            }
        }
        const csv = accounts.join(",");
        console.log(csv);
    });


task("setAttributes", "npx hardhat setAttributes --passport <address> --account <address> --did <bytes32> --raw <flag> --attributes <string,string,...> --values <string,string,...> --network <network>")
    .addParam("passport", "sets the address for reader")
    .addParam("account", "sets the address for account")
    .addParam("did", "sets the did")
    .addFlag("raw", "sets the raw flag")
    .addParam("attributes", "sets the attributes")
    .addParam("values", "sets the values")
    .setAction(async function (taskArgs, hre) {

        const ethers = hre.ethers;
        const passportAddress = taskArgs.passport;
        const minter = taskArgs.account;
        const did = !taskArgs.raw ? id(taskArgs.did) : taskArgs.did;
        const attributes = taskArgs.attributes.split(",");
        const attrTypes: any = attributes.map((attribute: string) => id(attribute));
        const values = taskArgs.values.split(",");
        const chainId = hre.network.config.chainId;

        const passport = await ethers.getContractAt("QuadPassport", passportAddress);
        console.log("Setting attributes for", minter, "with did", did, "on chain", chainId, "with attributes", attributes, "and values", values, "on passport", passportAddress);

        const governanceAddress = await passport.governance();
        const governance = await ethers.getContractAt("QuadGovernance", governanceAddress);

        const signers = await ethers.getSigners();
        const admin = signers[0];
        const issuer = signers[1];

        for (const attrKey of attrTypes) {
            const eligibilityByDid = await governance.eligibleAttributesByDID(attrKey);
            const eligibility = await governance.eligibleAttributes(attrKey);
            console.log("attrKey", attrKey, "eligibleByDid", eligibilityByDid, "eligible", eligibility);
            const issuerHasPermission = await governance.getIssuerAttributePermission(issuer.address, attrKey);
            console.log("issuerHasPermission", issuerHasPermission);
        }
        const attrValues: any = [];
        const attrKeys: any = [];
        for (var i = 0; i < attrTypes.length; i++) {
            if (attrTypes[i] === id("AML")) {
                // append AML has hex with 32 bytes
                const formattedAML = hexZeroPad(ethers.BigNumber.from(values[i]).toHexString(), 32);
                console.log("AML", formattedAML);

                attrValues.push(formattedAML);
                attrKeys.push(ethers.utils.keccak256(
                    ethers.utils.defaultAbiCoder.encode(["bytes32", "bytes32"], [did, attrTypes[i]])
                ));
            } else {
                console.log("Hashing", values[i], "of type", attributes[i])

                attrValues.push(id(values[i]));
                attrKeys.push(ethers.utils.keccak256(
                    ethers.utils.defaultAbiCoder.encode(["address", "bytes32"], [minter, attrTypes[i]])
                ));
            }
        }


        console.log("attrTypes", attrTypes);
        console.log("attrKeys", attrKeys);
        console.log("attrValues", attrValues);

        // get block timestamp
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp;

        // set verrifiedAt and issuedAt to 1 hour ago
        const verifiedAt = timestamp - 3600;
        const issuedAt = timestamp - 3600;

        const hash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                [
                    "address",
                    "bytes32[]",
                    "bytes32[]",
                    "bytes32",
                    "uint256",
                    "uint256",
                    "uint256",
                    "uint256",
                    "address",
                ],
                [
                    minter,
                    attrKeys,
                    attrValues,
                    did,
                    verifiedAt,
                    issuedAt,
                    0,
                    chainId,
                    passportAddress,
                ]
            )
        );

        const sigIssuer = await issuer.signMessage(ethers.utils.arrayify(hash));

        const tx = await passport
            .connect(issuer)
            .setAttributesIssuer(
                minter,
                [
                    attrKeys,
                    attrValues,
                    attrTypes,
                    did,
                    1,
                    verifiedAt,
                    issuedAt,
                    0,
                ],
                sigIssuer,
                {
                    value: 0,
                    gasLimit: 8000000,
                }
            )

        // wait for status to be mined
        console.log("Waiting for transaction to be mined");
        const receipt = await tx.wait();
        console.log(receipt);
    });


task("getAllMintersByTokenIds", "npx hardhat getAllMintersByTokenIds --passport <address> --tokenIds <string,string,...>")
    .addParam("passport", "sets the address for passport")
    .addParam("tokenIds", "sets the tokenIds")
    .setAction(async function (taskArgs, hre) {

        const ethers = hre.ethers;
        const passportAddress = taskArgs.passport;
        const tokenIds = taskArgs.tokenIds.split(",");
        const passport = await ethers.getContractAt("QuadPassport", passportAddress);

        const filter = passport.filters.TransferSingle(null, null, null, null, null);
        const logs = await passport.queryFilter(filter, 0, "latest");
        const accounts = [];
        for (const log in logs) {
            const { args } = logs[log];
            const { from, to, id, value } = args as any;
            // continue if tokenId is not in tokenIds
            if (!tokenIds.includes(id.toString())) {
                continue;
            }
            if (from === ethers.constants.AddressZero) {
                accounts.push(to);
            }
            if (to === ethers.constants.AddressZero) {
                delete accounts[accounts.indexOf(from)];
            }
        }
        const csv = accounts.join(",");
        console.log("length", accounts.length);
        console.log(csv);
    });