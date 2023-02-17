import { ethers, run } from "hardhat";




(async () => {

    // npx hardhat migrateV3 --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --passport 0xF4d4F629eDD73680767eb7b509C7C2D1fE551522 --start-block 7509680 --end-block 8409680 --network goerli

    const currentBlock = await ethers.provider.getBlockNumber();
    const deltaBlock = 500000;
    for(var startBlock = 0; startBlock < currentBlock; startBlock += deltaBlock) {
        await run("migrateV3", {
            governance: "0x863db2c1A43441bbAB7f34740d0d62e21e678A4b",
            passport: "0xF4d4F629eDD73680767eb7b509C7C2D1fE551522",
            startBlock: startBlock.toString(),
            endBlock: (startBlock + deltaBlock).toString(),
        });

        console.log(`Migrated from block ${startBlock} to ${startBlock + deltaBlock}`);
        console.log(`${
            (startBlock + deltaBlock) / currentBlock * 100
        }% done`)
    }
})();