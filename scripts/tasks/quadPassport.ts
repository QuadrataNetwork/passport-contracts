import { id } from "ethers/lib/utils";
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
            console.log("getPreapprovalFunctionData can only be run on hardhat network");
            return;
        }
        const QuadPassport = await ethers.getContractFactory("QuadPassport");
        const passport = await QuadPassport.deploy();
        await passport.deployed();

        const setQuadReaderFunctionData = passport.interface.encodeFunctionData("setQuadReader", [address]);
        console.log(setQuadReaderFunctionData);
    });