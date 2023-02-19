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
