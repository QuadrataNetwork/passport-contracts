import { expect } from "chai";
import { hexZeroPad } from "ethers/lib/utils";
import { ATTRIBUTE_AML, ATTRIBUTE_COUNTRY, ATTRIBUTE_CRED_PROTOCOL_SCORE, ATTRIBUTE_DID, ATTRIBUTE_IS_BUSINESS } from "../../utils/constant";





const main = async () => {
    const passportAddr = "0xF4d4F629eDD73680767eb7b509C7C2D1fE551522";
    const readerAddr = "0x5C6b81212c0A654B6e247F8DEfeC9a95c63EF954";
    const governanceAddr = "0x863db2c1A43441bbAB7f34740d0d62e21e678A4b";

    const quadPassport = await ethers.getContractAt("QuadPassport", passportAddr);
    const quadReader = await ethers.getContractAt("QuadReader", readerAddr);
    const quadGovernance = await ethers.getContractAt("QuadGovernance", governanceAddr);

    // read TransferSingle event from QuadPassport
    const filter = quadPassport.filters.TransferSingle(null, null, null, null, null);
    const logs = await quadPassport.queryFilter(filter, 0, 'latest');
    const accounts = [];
    for (const log in logs) {
        const { args } = logs[log];
        const { from, to, id, value } = args as any;
        if (from === ethers.constants.AddressZero) {
            accounts.push(to);
        }
        if (to === ethers.constants.AddressZero) {
            delete accounts[accounts.indexOf(from)];
        }
    }

    const attributes = [ATTRIBUTE_AML, ATTRIBUTE_DID, ATTRIBUTE_COUNTRY, ATTRIBUTE_CRED_PROTOCOL_SCORE, ATTRIBUTE_IS_BUSINESS];
    const attributeEligibleByDID: any = {};

    const blockTag = 8506910;
    for(let attribute of attributes) {
        const eligibleByDID = await quadGovernance.callStatic.eligibleAttributesByDID(attribute, {
            blockTag: blockTag
        });
        attributeEligibleByDID[attribute] = eligibleByDID;
    }

    /*
    0x6A11b625BFBbA2bb4528763f75Db22DE2F3c0F8B,0x40aE78E2DE98fBc1e32450EF678c2B5e53a968d7,0xb5c615B5f870dD8C7CDf14DffD3d0B039b28Ad0D,0xf83A1423827C967b99978BfdA89717694A7779f8,0xFdb01E4CC9AD0aE0206558a07F5190172c335Aa2
    */


    for(let account of accounts) {
        const queryFeeBulk = await quadReader.callStatic.queryFeeBulk(account, attributes, {
            blockTag: blockTag
        });
        expect(queryFeeBulk).to.be.gt(0);
        const results = await quadReader.callStatic.getAttributesBulk(account, attributes, {
            blockTag: blockTag,
            value: queryFeeBulk
        });
        const {value: aml} = results[0];
        const {value: did} = results[1];
        const {value: country} = results[2];
        const {value: credProtocolScore} = results[3];
        const {value: isBusiness} = results[4];

        console.log("account: ", account);
        console.log("aml: ", aml, attributeEligibleByDID[ATTRIBUTE_AML]);
        console.log("did: ", did, attributeEligibleByDID[ATTRIBUTE_DID]);
        console.log("country: ", country, attributeEligibleByDID[ATTRIBUTE_COUNTRY]);
        console.log("credProtocolScore: ", credProtocolScore, attributeEligibleByDID[ATTRIBUTE_CRED_PROTOCOL_SCORE]);
        console.log("isBusiness: ", isBusiness, attributeEligibleByDID[ATTRIBUTE_IS_BUSINESS]);
        console.log("====================================");
    }

}

main()