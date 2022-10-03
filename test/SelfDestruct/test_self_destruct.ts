import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { time } from "console";
import { constants } from "ethers";
import { defaultAbiCoder, id, parseEther } from "ethers/lib/utils";
import { network, ethers } from "hardhat"
import { QuadGovernance, QuadPassport, QuadReader, SelfDestruct } from "../../types"

const getSignerFromAddress = async (account: string): Promise<SignerWithAddress> => {

  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [account],
  });

  return await ethers.getSigner(account);
}

describe("SelfDestruct()", function () {
  let quadPassport: QuadPassport;
  let quadReader: QuadReader;
  let quadGovernance: QuadGovernance;
  let timelock: SignerWithAddress;

  let selfDestruct: SelfDestruct;

  let signers: SignerWithAddress[];

  before(async () => {

    signers = await ethers.getSigners();

    // fork mainnet
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.MAINNET_URI,
            blockNumber: 15627738,
          },
        },
      ],
    });

    quadPassport = await ethers.getContractAt("QuadPassport", "0x32791980a332F1283c69660eC8e426de3aD66E7f") as QuadPassport;
    quadGovernance = await ethers.getContractAt("QuadGovernance", "0xA16E936425df96b9dA6125B03f19C4d34b315212") as QuadGovernance;
    quadReader = await ethers.getContractAt("QuadReader", "0x7907bD4Be498cC9a7E2CF1a31dEeFCD8B132bca9") as QuadReader;

    const SelfDestruct = await ethers.getContractFactory("SelfDestruct");
    selfDestruct = await SelfDestruct.deploy(signers[0].address) as SelfDestruct;
    await selfDestruct.deployed();

    timelock = await getSignerFromAddress("0x76694A182dB047067521c73161Ebf3Db5Ca988d3");

    await signers[0].sendTransaction({
      to: timelock.address,
      value: parseEther("50")
    })
  })

  it("should have governance role", async () => {
    expect(await quadGovernance.hasRole(id("GOVERNANCE_ROLE"), timelock.address)).equals(true)
  })

  it("should destroy QuadPassport", async () => {
    const calldata = selfDestruct.interface.encodeFunctionData("dangerZone");
    console.log(calldata)
    //await quadPassport.connect(timelock).upgradeToAndCall(selfDestruct.address, calldata);
    await quadPassport.connect(timelock).upgradeTo("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d");
  })

})
