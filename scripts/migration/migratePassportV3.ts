import { ethers, run } from "hardhat";




(async () => {

    // npx hardhat migrateV3 --governance 0x863db2c1A43441bbAB7f34740d0d62e21e678A4b --passport 0xF4d4F629eDD73680767eb7b509C7C2D1fE551522 --start-block 7509680 --end-block 8409680 --network goerli

    await run("migrateV3", {
        governance: "0x863db2c1A43441bbAB7f34740d0d62e21e678A4b",
        passport: "0xF4d4F629eDD73680767eb7b509C7C2D1fE551522",
        startBlock: "7000000",
        endBlock:   "7500000",
    });
    console.log("Migrated 7000000 - 7500000");

    await run("migrateV3", {
        governance: "0x863db2c1A43441bbAB7f34740d0d62e21e678A4b",
        passport: "0xF4d4F629eDD73680767eb7b509C7C2D1fE551522",
        startBlock: "7500000",
        endBlock:   "8000000",
    });
    console.log("Migrated 7500000 - 8000000");
    await run("migrateV3", {
        governance: "0x863db2c1A43441bbAB7f34740d0d62e21e678A4b",
        passport: "0xF4d4F629eDD73680767eb7b509C7C2D1fE551522",
        startBlock: "8000000",
        endBlock:   "8500000",
    });
    console.log("Migrated 8000000 - 8500000");
})();