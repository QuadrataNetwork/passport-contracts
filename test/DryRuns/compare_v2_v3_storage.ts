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



    var accounts = [
        "0x5501CC22Be0F12381489D0980f20f872e1E6bfb9", "0xfdFBCeDAC0AFA43Ba336b657199e6f77d657C25d", "0xf2169cA68C8d312073B5032E1c54F3018921Cd95", "0x6DaC996E32cEBcA0afa8Fc701C5eF65088a90947", "0xFDBBA0448Ade7521D755fcC21e5E46A3F98deB2E", "0x8d03fA51923EBDf8e1D93a6eE08211293A66A1C2", "0x0Bd9292e1aEF0d1a9a4dE513F16baA7507AC1213", "0xFA6756324110ac62dA1CB6E90B11D37F887d028C", "0x938e50bF3826AFEE55a6719D5F160E646df8B7Da", "0x64524218879e96D9a11d48994219E389B55369B1", "0x2FFA3b77EAb06da475e3602bEc45B7FA3Ca71596", "0x3E2Cb2Da8Cd2145EcbD6266Ca7394AF73F471133", "0x6704b31FBF1CE359b61E30f7010e7963E48dF0Ad", "0xeA0bac222acD0c364fb0d6Ec6D4110231AD6EEB3", "0x9Ba01dC4E5De13257e9Dfd01fa68132b41d1E766", "0x9031537E04e25f02dccFD0988214AC320611Ed6F", "0xe5f02A62BB59255D31B93F750Ce372cDc26aFd3e", "0xF053aDb5D6310219f84B5792db23a4feD3C25d57", "0xFdb01E4CC9AD0aE0206558a07F5190172c335Aa2", "0xfB9ecC10FA880B77A92C2CD50DF0fc760312fa7A", "0x5051EfAa1c4E6527a84471D407e1a47860431Ddc", "0x6809286652409310B57dc5BA280D768a27B4CA29", "0x62beE234b4066af4709DeE5FD3FFCed6782f5C0D", "0x2B2D0DE9a8d1747b6eEDE6d34F4C12F6590E914b", "0x004A014984904D48fE450db8dEB9289aC27F427D", "0xf1b9686626D78Df34ec873FBb3B3aD052280505B", "0xd8b2B7F42873F111348c835563e26865474337db", "0xA45c45222d15e038080B34812E55a499Ab05e2D5", "0xcf9ecd940458E6b35F98376147314a75adb0bdAc", "0x3B2Ae6DB08362C1c52a22C6E44902BEe097c4E4a", "0x0186DEf17B78D3c96059A30bf1804174b83bb9AD", "0x113d101cd9e1Cf592a2FD1Ae4B3DfbEE4d7076C2", "0x677B8Aa6E64917c94b472FaCBC3D092adBd2fdFa", "0xEeD71F7eFF1661Fea46c010b92709432057012Af", "0xA386044F838362cb21F162048e9f12A6bd2E82c0", "0x70c45B1168FfadF61F2507fe7BE0af152ce30959", "0x298523fAA843CA40e83b7934170ca874a4FA1b04", "0xca4aD39F872E89Ef23eABd5716363Fc22513E147", "0x38FA34C9E899D329b3477B99F3BD663D05F0Db5f", "0x3b1e20Aea65D5dC0b7948258f3B0b41618a96c6b", "0x72f821571B1301550B44b8bC2E7b32B64cDB47cC", "0xDc66219C5e0156712eb8Bc78635241C7AF76F27D", "0xe9E5A2E72D9F99b6F2F522cd6F8B4c88a3Da4A8E", "0xaF520EFe17f0C35c5Ed5d5e15B88bDB8f37b3560", "0xB802f2e0E43438Bdf64Ee736F135f94ee071C087", "0x8ec0AaF6d5eC636431e28C728D5A3D90399b8dE5", "0x045dfef0b67C6b70DAa9cD3d534d16C5252A7E5f", "0x54C2a2480B3930b8ec2f4Dc0113F9e60333e0995", "0xaAd6AB2Bfe1dfAebadb49a07b64b8454A3114aD8", "0xF4A25EF4df76e0Cab20C92464c6C43762CF50D05", "0xb533C4dA86AfB2Fa8fc5BF4eC2a854875c09c848", "0xdab51BD7e8490cf87E239Cf89f4B2e93B3C5a5ab", "0xD71bB1fF98D84ae00728f4A542Fa7A4d3257b33E", "0x0d75B10629808A3c8A70e11c932a9116696E2D80", "0xcA9821Bd229B44B7A78754b50231091c957DCa74", "", "0xaAA94eC1d5C58493257FA6811503e5CD5aa02410", "0x30F1Fd1914C8a1CFcb2FD254772C041F9063a6E9", "0x0Ea64349b70048Ad983ae58936CC1417963cBB5b", "0xA35AC0ca78722f8156c35436D03a038e22065932", "0x8f6304e498fc444Cafc356fb5E792C01626C2e4f", "0x2654DDf31E5D8DDA52fE8C1D759Be186D316d8A6", "0xacD997307e81302e1671f6242d817B0a1456161a", "0xecc23eCc7364c3883f3d3539882031E281226685", "0x48538A4804593E9E3996065083280F9b43d8DAAD", "0x26ca32b540Bdb8080A514F82705c9E9ab53A5207", "0xfd259b5b63881c62AE364acB18752c1E84b5Bd36", "0x46D7ACAD8CD02d1E6497cF0D6283Bda45cc31892", "0xb3ec8c4f0a206104c352d74f3047543068e720FC", "0x980bBdaf8dB489a8F501C55360040e44574953a2", "0xCBc280853B83dD458a26BDe2AF8c5dE31Da422E7", "0xC7c50Dd1Acf186cfC5dB9dABA5bfCBd176147e93", "0x07724e9dd8B49A6880EaeE7120B78c81B57Dc924", "0x95F50Cf888dFeC90321dC376c1E695F15B081595", "0xda620ADcCb2Dbdd0041175ED5E8b3e32F518A55C", "0x79ec3a2B72f45a56105dB95Cbf50C0C003E5F3f0", "0xD117262C30a73c0C4ad8037658b4a8fc3A386ce5", "0xEf96e35691D9EF95f77EA337B82BA180Ccf5Fde0", "0x860b3630a3534f707D1DC7b98757BBEC8446d736", "0x69cC0679eDCE409926c065C31141daeA9a889c1F", "0xD23E1CD59A0A9ca5453Fefc349D9A00219e56304", "0x21FD80d6184aaC6978e0d21225396512eb97a591", "0x90Cfa92aDfbCe9B035183f2475253F298d5b1422", "0x3C734064dF1F2316eB66Aa1101a3e3E0e7Bcc340", "0xDD4EB4a4E80f8390EA158fD2Cb14CB667B5Acdc5", "0xAF449Da8797353a0875418AdC6f066d88EEE217F", "0xb2cc1609E97e4257D32715Cc1dd1C9203a114Ed9", "0xa591d576F65b8311462049de4eA8F9B9219aC844", "0xCc2005844AeABbd4d663f7C45C9bd1369eb062b3", "0x89C49429C46E62121A57599A49720e09fCb1Fe13", "0x14A20b4B762b8d297859cf0477D86324d66aF69f", "0xeBf283720AC8748BDE7C70733B1332D027891b21", "0xBCaD0914338b6aafF27F5FCB6de531E22c517353", "0xA15C57f4c1769D302de15bb5F6A992607c314aA1", "0x0d1A35F9eE038d4500459857Fb5567f53F3Cd08c", "0xa6e96DBB6B7d2c12062E70d3dEc87C4FE23f961f", "0x12651F27224dCEFA41Db255a2814959373829fd9", "0xEe2907f60A5D2FF2233419BfACC6F9023053D628", "0xd59e99927018b995ee9Ad6b9003677f1e7393F8A", "0x8dAC0B5eBf7f543A1Ee7bE63D0e741f150bA1c97", "0xdC21328946fa8FF066CC8dE84376116b78d40d8e", "0xD24736f0e2f4A98B7E474040D9E5911BFF67c3F9", "0xC4a131a1b8dc15514c902602B8CeF6342BBDd8CC", "0x99581ad2A1701fE8a48B79385957c78F5eF174BC", "0x0F5717e1e3B5851a1E62f204A310Ba76CF497F86", "0x86a5F67016B9A10560Cf14632Dd189adDBBe65dB", "0x7621940f6068C024Fb3a3eeE2810D5Ad76CEa374"
    ]

    // get sub array of 20th to 40th accounts
    accounts = accounts.slice(20, 40);


    const premigrationBlock = 39892040;
    const attributeTypes = [
        "COUNTRY",
        "AML",
        "IS_BUSINESS",
        "DID"
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
            if(attributeType === "AML") {
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