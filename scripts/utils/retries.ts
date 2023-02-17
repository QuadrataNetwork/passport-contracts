import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";


interface ErrorHandling {
    gasLimit: BigNumber;
    // other possible values for future handling of public endpoint rotation
}


export const recursiveRetry = async (func: (...args: any) => any, ...args: any): Promise<any> => {
    try {
        console.log("executing..." + func.name);
        return await func(...args);
    } catch (e: any) {
        console.log("failed to execute " + func.name + " due to " + e.toString());
        console.log("retrying in 5ish seconds");
        let wait = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));
        await wait(4000 + Math.random() * 2000);

        // magage error handling for recursion path
        if (e.toString().includes("cannot estimate gas") || e.toString().includes("UNPREDICTABLE_GAS_LIMIT")) {
            // dispatch to recursiveRetryErrorHandling
            return await recursiveRetryErrorHandling(func, {
                gasLimit: parseUnits("0.001", "gwei"), // a million gas will cover our largest transaction
            }, ...args);
        } else {
            return await recursiveRetry(func, ...args);
        }
    }
}

export const recursiveRetryErrorHandling = async (func: (...args: any) => any, errorHandling: ErrorHandling, ...args: any): Promise<any> => {
    try {
        if (errorHandling.gasLimit) {
            return await func(...args, {
                gasLimit: errorHandling.gasLimit,
            });
        } else {
            return await func(...args);
        }
    } catch (e: any) {
        console.log("failed to execute " + func.name + " due to " + e.toString());
        console.log("retrying in 5ish seconds");
        let wait = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));
        await wait(4000 + Math.random() * 2000);

        // magage error handling for recursion path
        if (e.toString().includes("cannot estimate gas") || e.toString().includes("UNPREDICTABLE_GAS_LIMIT")) {
            var gasLimit = errorHandling.gasLimit;
            // increase gas limit by 50%
            gasLimit = gasLimit.mul(3).div(2);

            console.log("mannually increasing gas limit to " + gasLimit.toString());

            return await recursiveRetryErrorHandling(func, {
                gasLimit: gasLimit,
            }, ...args);

        } else if (e.toString().includes("exceeds block gas limit") || e.toString().includes("> current max gas")) {

            // parse out the 2 numbers from the error message
            const gasLimitString = e.toString().match(/\d+/g);
            const blockGasLimit = BigNumber.from(gasLimitString[1]);
            const targetGasLimit = blockGasLimit.mul(95).div(100);

            console.log("mannually discovering gas limit from error message to be " + targetGasLimit.toString());

            return await recursiveRetryErrorHandling(func, {
                gasLimit: targetGasLimit,
            }, ...args);
        } else {
            // delegate back to recursiveRetry
            return await recursiveRetry(func, ...args)
        }
    }
}

export const recursiveRetryIncreamentNonce = async (signer: SignerWithAddress): Promise<any> => {
    try {
        return await signer.sendTransaction({
            to: signer.address,
            value: 69,
        });
    } catch (e: any) {
        console.log("failed to execute sendTransaction due to " + e.toString());
        console.log("retrying in 5ish seconds");
        let wait = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));
        await wait(4000 + Math.random() * 2000);
        return await recursiveRetryIncreamentNonce(signer);
    }
}
