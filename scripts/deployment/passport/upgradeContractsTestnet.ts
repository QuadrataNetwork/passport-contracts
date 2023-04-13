const { ethers, upgrades } = require("hardhat");


(async () => {
  const GovernanceFactory = await ethers.getContractFactory("QuadGovernance");
  const governance = await upgrades.deployImplementation(GovernanceFactory)
  console.log("Governance implementation", governance.address)

  const ReaderFactory = await ethers.getContractFactory("QuadReader");
  const reader = await upgrades.deployImplementation(ReaderFactory)
  console.log("Reader implementation", reader.address)

  const PassportFactory = await ethers.getContractFactory("QuadPassport");
  const passport = await upgrades.deployImplementation(PassportFactory)
  console.log("Passport implementation", passport.address)
})();
