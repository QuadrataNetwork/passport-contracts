const { ethers } = require("hardhat");

const {
  deployGovernance,
  deployPassport,
  deployReader,
} = require("../../../utils/deployment.ts");

(async () => {
  // const governance = await deployGovernance();
  // console.log(`QuadGovernance is deployed: ${governance.address}`);
  const governance = await ethers.getContractAt(
    "QuadGovernance",
    "0xBfa59A31b379A62304327386bC2b03096D7695B3"
  );
  const passport = await deployPassport(governance);
  console.log(`QuadPassport is deployed: ${passport.address}`);
  // const reader = await deployReader(governance, passport);
  // console.log("QuadReader is deployed: ", reader.address);
})();
