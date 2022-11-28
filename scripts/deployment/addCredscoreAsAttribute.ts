import { id, parseUnits } from "ethers/lib/utils";
import { ISSUERS } from "../data/testnet";



; (async () => {

    // getting fuji testnet governance
    const quadGovernance = await ethers.getContractAt("QuadGovernance", "0xC1fcC7790291FF3D9DC378bfA16047eC3002a83a")

    const [admin] = await ethers.getSigners();

    console.log("Issuer has CRED_PROTOCOL_SCORE permission: ", await quadGovernance.getIssuerAttributePermission(ISSUERS[6].wallet, id("CRED_PROTOCOL_SCORE")))
    console.log("Issuer has CRED_PROTOCOL_SCORE permission: ", await quadGovernance.getIssuerAttributePermission(ISSUERS[7].wallet, id("CRED_PROTOCOL_SCORE")))
    console.log("Governance has CRED_PROTOCOL_SCORE elibigility: ", await quadGovernance.eligibleAttributes(id("CRED_PROTOCOL_SCORE")))
    console.log("Governance has CRED_PROTOCOL_SCORE did elibigility: ", await quadGovernance.eligibleAttributesByDID(id("CRED_PROTOCOL_SCORE")))
    console.log("Signer is: ", admin.address)
    console.log("Signer has role: GOVERNANCE_ROLE", await quadGovernance.hasRole(id("GOVERNANCE_ROLE"), admin.address))

    await quadGovernance.setEligibleAttributeByDID(id("CRED_PROTOCOL_SCORE"), true,
        {
            maxFeePerGas: 25000000000 * 3,
            gasLimit: 8000000
        }
    );
    console.log("Added CRED_PROTOCOL_SCORE to FUJI Governance")

    for (const issuer of ISSUERS) {
        await quadGovernance.setIssuerAttributePermission(
            issuer.wallet,
            id("CRED_PROTOCOL_SCORE"),
            true,
            {
                maxFeePerGas: 25000000000 * 3,
                gasLimit: 8000000
            }
        );

        console.log("ADDED CRED_PROTOCOL_SCORE to ", issuer.wallet)
    }


})()