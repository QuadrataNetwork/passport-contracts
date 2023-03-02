import { ethers } from "hardhat";

// !--------------- TO FILLL -----------------!
const OLD_PASSPORT = "0x32791980a332F1283c69660eC8e426de3aD66E7f"; // Mainnet OldQuadPassport.sol
const NEW_PASSPORT = "0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d";

const ISSUER_ADDRESS = "0x38a08d73153F32DBB2f867338d0BD6E3746E3391"; // SpringLabs
const MAX_GAS_FEE = ethers.utils.parseUnits("5.0002", "gwei");
const BATCH_SIZE = 30;
// Last Position Index Completed 29
const START_POSITION = 30;
const END_POSITION = START_POSITION + 2;

(async () => {
  // // !!!!!!!!!!!!!!! TODO: REMOVE!!!!!!!!!!!!!!!
  // const impersonatedSigner = await ethers.getImpersonatedSigner(
  //   "0x76694A182dB047067521c73161Ebf3Db5Ca988d3"
  // );
  // console.log(`Loading Impersonating Account: ${impersonatedSigner.address}`);
  // const [deployer] = await ethers.getSigners();
  // await deployer.sendTransaction({
  //   to: impersonatedSigner.address,
  //   value: ethers.utils.parseEther("1"),
  // });
  // const govOld = await ethers.getContractAt(
  //   "QuadGovernanceOld",
  //   "0xA16E936425df96b9dA6125B03f19C4d34b315212" // Mainet oldQuadGovernance.sol
  // );
  // console.log("Transfer ETH to Timelock");
  // await govOld
  //   .connect(impersonatedSigner)
  //   .grantRole(ethers.utils.id("READER_ROLE"), NEW_PASSPORT);
  // console.log("Grant READER_ROLE to QuadPassport");
  // // !!!!!!!!!!!!!!! TODO: END-REMOVE!!!!!!!!!!!!!!!

  const [deployer] = await ethers.getSigners();
  console.log(`Starting Migration....`);
  console.log(`Deployer Address ${deployer.address}`);
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

  const maxPosition = END_POSITION || batchUsers.length;

  for (let i = START_POSITION; i < maxPosition; i++) {
    console.log(
      `---Migrating index ${i}/${maxPosition - 1}: [${batchUsers[i]}]`
    );
    const tx = await passport
      .connect(deployer)
      .migrate(batchUsers[i], ISSUER_ADDRESS, OLD_PASSPORT, {
        maxFeePerGas: MAX_GAS_FEE,
      });

    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();
  }
})();
