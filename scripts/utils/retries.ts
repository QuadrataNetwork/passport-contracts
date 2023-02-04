import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


export const recursiveRetry = async (func: (...args: any) => any, ...args: any): Promise<any>  => {
    try {
        return await func(...args);
    } catch (e: any) {
        console.log("failed to execute " + func.name + " due to " + e.toString());
        console.log("retrying in 5ish seconds");
        let wait = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));
        await wait(4000 + Math.random() * 2000);
        return await recursiveRetry(func, ...args);
    }
}

export const recursiveRetryIncreamentNonce = async (signer: SignerWithAddress): Promise<any>  => {
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
