const { task } =  require("hardhat/config");


task("deployFEUtils", "npx hardhat deployFEUtils --governance <address> --passport <address> --network <network_name>")
  .addParam("governance", "<address>")
  .addParam("passport", "<address>")
  .setAction(async function (taskArgs, hre) {
    const { deployFEUtils } = require("./utils/deployment");

    const ethers = hre.ethers;

    const governanceAddress = taskArgs.governance;
    const passportAddress = taskArgs.passport;

    const governance = await ethers.getContractAt("QuadGovernance", governanceAddress);
    const passport = await ethers.getContractAt("QuadPassport", passportAddress);

    const feUtils = await deployFEUtils(governance, passport);

    console.log("FE Utils Deployed At:")
    console.log(feUtils.address)
  });