
import {deployFEUtils} from "../../utils/deployment"

(async () => {

    const governance = await ethers.getContractAt("QuadGovernance", "0x863db2c1A43441bbAB7f34740d0d62e21e678A4b");
    const passport = await ethers.getContractAt("QuadPassport", "0xF4d4F629eDD73680767eb7b509C7C2D1fE551522");

    const feUtils = await deployFEUtils(governance, passport);

    console.log("FE Utils Deployed At:")
    console.log(feUtils.address)

})()