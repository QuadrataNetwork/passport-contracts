import { ethers } from "hardhat";

const OLD_PASSPORT = "0x911757E425dBc4D5f9E522E87Ab01C8a096AD0D6";
const NEW_PASSPORT = "0xD3d0fc5387b1F1F210551e7A32eAB1fcF6e9C1a3";

const ISSUER_ADDRESS = "";
const MAX_GAS_FEE = ethers.utils.parseUnits("4.1337", "gwei");
const BATCH_SIZE = 10;
const START_POSITION = 0;
const END_POSITION = 10;

(async () => {
  console.log(`Starting Migration....`);
  console.log(`Max Gas Fee: ${ethers.utils.formatUnits(MAX_GAS_FEE, "gwei")}`);
  const passportOld = await ethers.getContractAt(
    "QuadPassportOld",
    OLD_PASSPORT
  );
  const passport = await ethers.getContractAt("QuadPassport", NEW_PASSPORT);

  const events = await passportOld.queryFilter(
    passportOld.filters.TransferSingle()
  );

  const passportHolders = new Set<string>();
  // Add Passports that have been minted in old Contract
  for (const event of events) {
    const args: any = event.args;
    if (args.from === "0x0000000000000000000000000000000000000000")
      // Mint
      passportHolders.add(args.to);

    if (args.to === "0x0000000000000000000000000000000000000000")
      // Burn
      passportHolders.delete(args.from);
  }

  const batchUsers: string[][] = [];
  let singleBatch: string[] = [];
  let counter: number = 1;

  console.log(
    `${passportHolders.size} passports have been found in old contrats`
  );

  passportHolders.forEach((account) => {
    singleBatch.push(account);

    if (counter % BATCH_SIZE === 0) {
      batchUsers.push(singleBatch);
      singleBatch = [];
    }

    counter++;
  });

  if (singleBatch.length > 0) {
    batchUsers.push(singleBatch);
  }
  console.log({ batchUsers });

  const [deployer] = await ethers.getSigners();
  const maxPosition = END_POSITION || batchUsers.length;

  for (let i = START_POSITION; i < maxPosition; i++) {
    console.log(
      `---Migrating index ${i} (Max: ${maxPosition}): ${batchUsers[i]}`
    );
    const tx = await passport
      .connect(deployer)
      .migrate(batchUsers[i], ISSUER_ADDRESS, OLD_PASSPORT, {
        maxFeePerGas: MAX_GAS_FEE,
      });

    console.log(`Transaction hash: ${tx.has}`);
  }
})();
