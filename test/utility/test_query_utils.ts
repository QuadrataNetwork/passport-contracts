import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";


describe('QueryUtils()', function() {
    let TestQueryUtils;
    let signers;
    let testQueryUtilsInstance: Contract;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const QueryUtilsLib = await ethers.getContractFactory("QueryUtils");
        const queryUtilsLibInstance = await QueryUtilsLib.deploy();
        await queryUtilsLibInstance.deployed();

        TestQueryUtils = await ethers.getContractFactory("TestQueryUtils", {
            libraries: {
                QueryUtils: queryUtilsLibInstance.address
            }
        })

        testQueryUtilsInstance = await TestQueryUtils.deploy();
        await testQueryUtilsInstance.deployed();
    })

    describe('IsBusinessTrue()', function() {
      it("asserts correct IsBusiness value", async () => {
        expect(await testQueryUtilsInstance.functions.isBusinessTrue(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes('TRUE'))
        )).eql([true])

        expect(await testQueryUtilsInstance.functions.isBusinessTrue(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes('FALSE'))
        )).eql([false])
      })
    })
})
