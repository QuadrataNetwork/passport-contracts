const { ethers, upgrades } = require("hardhat");

export const deployPassport = async (governance) => {
  const QuadPassport = ethers.getContractFactory("QuadPassport");
  const passport = await upgrades.deployProxy(
    QuadPassport,
    [governance.address],
    { initializer: "initialize" }
  );
  console.log(`QuadPassport is deployed: ${passport.address}`);
  return passport;
};
