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

const getAttributesV2AsSlots = (addressOrDIDType: any, addressOrDIDValue: any, attribute: any, length: any) => {
    const attributeArrPtr = getAttributesLengthV2Slot(addressOrDIDType, addressOrDIDValue, attribute)
    const p = ethers.BigNumber.from(keccak256(attributeArrPtr));

    const slots = []
    for (var i = p; i < p.add(ethers.BigNumber.from(length).mul(3));) {
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

    var accounts = ["0x87F6d5Cc3c65D06130f6861129aaae325309Ff85","0xeD5D581f603799E388A96e243D020D0f498bF71c","0xf593e16Fe4BB969818859b618CE148BBb04Cb366","0xF6E8bC89739b576927Fa8e5fEA37806990F34936","0x1051Cf2fF8D2AFf445aFdC0f2144A28A86D6d781","0x785de3aC19F26e22e029605e407E728c1660714F","0x2C3C070ec5da505ed68F3BCA91dE961dB837F52b","0xDDdE8021114889a8FAc4ABd21E3ED300Ca91b496","0x6A3de25fbCCb30e265dffaD8c507C5Ee429b0C0B","0x347775a4dc31813Cd31528fA6D2fC2a367300656","0xB7c0b1a9592780868af195Bbd574076b3E005DD1","0x18EAD99008825C959f128D4AAAdD340f0cAd1922","0x084B8d9c0834F5b905c17bc447C909a897B4BD85","0x856f3Ba82D948d7A3C61A1d5204bB8c160A19dA8","0x286C229170BE05FeA608D39bA6E2548AcA553423","0x3142aC4045eD8B02ae5FFD7b84242674b7162515","0x782D931e522eDBa8b4Cc6d3701CF53360E6a1a7f","0xa43527599BcA4C6fF070A96916FAFe2657F3d53f","0xD696a5fA12ab423Ea65fA84D35E105FB185E0511","0x12DA2D03D71485a629E8d28FE2F9188A62deF189","0xDd0CB7B7ccaAdC9540079A807ae0F871b0297dB3","0x8CD1960C18D13503D62E47EC8EA7FbF19A7b4d47","0xDcb9D10109bF58578dF7Ad9093CdD1B775A24b75","0x1eb4aC0CD307aB4c7dB6c25a78029E035670ac95","0x5AD7Ee21c2088f0091fAA5Ca97E9e985e2B7cbA5","0xB802f2e0E43438Bdf64Ee736F135f94ee071C087","0x97563a0299822a624062c01ADB0A6098e07497b0","0x896dd79e289c38de49f7D1d661A1f8DE9d5c5093","0x3bAe075c8728a976E69e6F2E45e9682D1BA063d2","0xbf9a4eCC4151f28C03100bA2C0555a3D3e439e69","0x4e172Ea6873b2b2cb3f41b796dd5364Ecc13cd75","0xa2EeEa10a9a116b5ec77fa3A12d580A7265ECE9D","0x49Aba39Fc04566399DBB227b884196c58EaEfdC6","0x743D89a62248B787a23C663894B8cd36Ac2049Ec","0x3F23388b021C0f418853e2011D53097290258517"];


    const premigrationBlock = 16748326;
    const attributeTypes = [
        "COUNTRY",
        "AML",
        "IS_BUSINESS",
    ];

    for (const account of accounts) {
        console.log("getting v2 attributes for " + account);

        var v2User: any = {
            value: "0x",
            epoch: "0x",
            issuer: "0x"
        };
        var v3User: any = {
            value: "0x",
            epoch: "0x",
            issuer: "0x"
        };

        var didValue: any = {}

        for (const attributeType of attributeTypes) {
            if (attributeType === "AML") {
                const didLengthSlot = getAttributesLengthV2Slot("address", account, "DID");
                const didLength = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", didLengthSlot, premigrationBlock);
                const didAttributeSlots = getAttributesV2AsSlots("address", account, "DID", didLength);

                for (const attribute of didAttributeSlots) {
                    const value = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", attribute.valueSlot, premigrationBlock);
                    const epoch = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", attribute.epochSlot, premigrationBlock);
                    const issuer = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", attribute.issuerSlot, premigrationBlock);
                    didValue = {
                        value,
                        epoch,
                        issuer
                    }
                    break;
                }

            }

            const lengthSlot = getAttributesLengthV2Slot(!didValue.value ? "address" : "bytes32", !didValue.value ? account : didValue.value, attributeType);
            const length = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", lengthSlot, premigrationBlock);
            const attributeSlots = getAttributesV2AsSlots(!didValue.value ? "address" : "bytes32", !didValue.value ? account : didValue.value, attributeType, length);

            for (const attribute of attributeSlots) {
                const value = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", attribute.valueSlot, premigrationBlock);
                const epoch = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", attribute.epochSlot, premigrationBlock);
                const issuer = await ethers.provider.getStorageAt("0x2e779749c40CC4Ba1cAB4c57eF84d90755CC017d", attribute.issuerSlot, premigrationBlock);
                v2User = {
                    value,
                    epoch,
                    issuer
                }
                break;
            }

            console.log("getting v3 attributes for " + account);
            const reader = await ethers.getContractAt("QuadReader", "0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da");
            const result = await reader.callStatic.getAttributes(account, ethers.utils.id(attributeType));
            if (result.length !== 0) {
                v3User = {
                    value: result[0][0],
                    epoch: hexZeroPad(result[0][1].toHexString(), 32),
                    issuer: hexZeroPad(result[0][2], 32)
                }
            }

            console.log("attributeType: " + attributeType)
            console.log("v2user: " + JSON.stringify(v2User, null, 2));
            console.log("v3user: " + JSON.stringify(v3User, null, 2));

            expect(v2User.value).equals(v3User.value);
            expect(v2User.epoch === v3User.epoch).equals(true);
            expect(v2User.issuer.toLocaleLowerCase()).equals(v3User.issuer.toLocaleLowerCase());

        }
    }
})()