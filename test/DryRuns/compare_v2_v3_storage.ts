import { expect } from "chai";
import { hexZeroPad } from "ethers/lib/utils";
import { ethers } from "hardhat";

const { keccak256, concat, id, defaultAbiCoder } = require("ethers/lib/utils");


const getAttributesLengthV2Slot = (addressOrDIDType: any, addressOrDIDValue: any, attribute: any) => {
    const mapKey = keccak256(defaultAbiCoder.encode(
        [addressOrDIDType, "bytes32"],
        [addressOrDIDValue, id(attribute)]
      )
    )

    const attributeArrPtr = keccak256(defaultAbiCoder.encode(["bytes32", "uint256"], [mapKey, 302]))
    return attributeArrPtr;
}

const getAttributesLengthV3Slot = (mapKey: any) => {
    const attributeArrPtr = keccak256(defaultAbiCoder.encode(["bytes32", "uint256"], [mapKey, 304]))
    return attributeArrPtr;
}

const getAttributesV2AsSlots = (addressOrDIDType: any, addressOrDIDValue: any, attribute: any, length: any) => {
    const attributeArrPtr = getAttributesLengthV2Slot(addressOrDIDType, addressOrDIDValue, attribute)
    const p = ethers.BigNumber.from(keccak256(attributeArrPtr));

    const slots = []
    for(var i = p; i < p.add(ethers.BigNumber.from(length).mul(3));) {
        slots.push({
            valueSlot: i.toHexString(),
            epochSlot: i.add(1).toHexString(),
            issuerSlot: i.add(2).toHexString()
        })
        i = i.add(3)
    }

    return slots;
}

const getAttributesV3AsSlots = (mapKey: any, length: any) => {
    const attributeArrPtr = getAttributesLengthV3Slot(mapKey)
    const p = ethers.BigNumber.from(keccak256(attributeArrPtr));

    const slots = []
    for(var i = p; i < p.add(ethers.BigNumber.from(length).mul(3));) {
        slots.push({
            valueSlot: i.toHexString(),
            epochSlot: i.add(1).toHexString(),
            issuerSlot: i.add(2).toHexString()
        })
        i = i.add(3)
    }

    return slots;
}

(async () => {
    const addressOrDIDType = "address";
    const addressOrDIDValue = "0x0f5717e1e3b5851a1e62f204a310ba76cf497f86";
    const v2Users = [];
    const v3Users = [];

    const premigrationBlock = 39892040;
    const attributeType = "DID";

    console.log("getting v2 attributes")
    const lengthSlot = getAttributesLengthV2Slot(addressOrDIDType, addressOrDIDValue, attributeType);
    const length = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", lengthSlot, premigrationBlock);

    const attributeSlots = getAttributesV2AsSlots(addressOrDIDType, addressOrDIDValue, attributeType, length);


    for (const attribute of attributeSlots) {
        const value = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", attribute.valueSlot, premigrationBlock);
        const epoch = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", attribute.epochSlot, premigrationBlock);
        const issuer = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", attribute.issuerSlot, premigrationBlock);

        v2Users.push({
            value,
            epoch,
            issuer
        })
    }

    console.log("getting v3 attributes");
    const reader = await ethers.getContractAt("QuadReader", "0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da");
    const result = await reader.callStatic.getAttributes(addressOrDIDValue, ethers.utils.id(attributeType));

    v3Users.push({
        value: result[0][0],
        epoch: hexZeroPad(result[0][1].toHexString(), 32),
        issuer: hexZeroPad(result[0][2], 32)
    })

    // verify that the v2 and v3 attributes are the same
    for(var i = 0; i < v2Users.length; i++) {
        expect(v2Users[i].value === v3Users[i].value).equals(true);
        expect(v2Users[i].epoch === v3Users[i].epoch).equals(true);
        expect(v2Users[i].issuer.toLocaleLowerCase()).equals(v3Users[i].issuer.toLocaleLowerCase());
    }
})()