import { ethers } from "hardhat";
import { id } from "ethers/lib/utils";

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
} = require("../../utils/constant.ts");

const {
  assertGetAttributesBulkStatic,
} = require("../../test/helpers/assert/assert_get_attributes_bulk.ts");

const {
  assertGetAttributesStatic,
} = require("../../test/helpers/assert/assert_get_attributes.ts");

const OLD_PASSPORT = "0x32791980a332F1283c69660eC8e426de3aD66E7f"; // Mainnet oldQuadPassport.sol

const OLD_READER = "0x7907bD4Be498cC9a7E2CF1a31dEeFCD8B132bca9"; // Mainnet oldQuadReader.sol
const NEW_READER = ""; // Mainnet QuadReader.ol

(async () => {
  const passportOld = await ethers.getContractAt(
    "QuadPassportOld",
    OLD_PASSPORT
  );

  const readerOld = await ethers.getContractAt("QuadReaderOld", OLD_READER);
  const reader = await ethers.getContractAt("QuadReader", NEW_READER);

  const events = await passportOld.queryFilter(
    passportOld.filters.TransferSingle()
  );

  const passportHolders = new Set<string>();
  // Add Passports that have been minted in old Contract
  for (const event of events) {
    const args: any = event.args;
    if (args.from === "0x0000000000000000000000000000000000000000")
      // Mint
      passportHolders.add(args.to);

    if (args.to === "0x0000000000000000000000000000000000000000")
      // Burn
      passportHolders.delete(args.from);
  }
  const passports = Array.from(passportHolders);
  console.log(`Start Verification for ${passports.length} passports`);

  for (let i = 0; i < passports.length; i++) {
    const account = passports[i];

    const feeForDID = await readerOld.calculatePaymentETH(id("DID"), account);

    const feeForAML = await readerOld.calculatePaymentETH(id("AML"), account);
    const feeForCountry = await readerOld.calculatePaymentETH(
      id("COUNTRY"),
      account
    );
    const feeForIsBusiness = await readerOld.calculatePaymentETH(
      id("IS_BUSINESS"),
      account
    );

    const did = await readerOld.callStatic.getAttributesETH(
      account,
      1,
      id("DID"),
      { value: feeForDID }
    );
    const aml = await readerOld.callStatic.getAttributesETH(
      account,
      1,
      id("AML"),
      { value: feeForAML }
    );

    const country = await readerOld.callStatic.getAttributesETH(
      account,
      1,
      id("COUNTRY"),
      { value: feeForCountry }
    );
    const isBusiness = await readerOld.callStatic.getAttributesETH(
      account,
      1,
      id("IS_BUSINESS"),
      { value: feeForIsBusiness }
    );

    const expectedAttributes = [
      {
        [ATTRIBUTE_DID]: did[0][0],
        [ATTRIBUTE_AML]: aml[0][0],
        [ATTRIBUTE_COUNTRY]: country[0][0],
        [ATTRIBUTE_IS_BUSINESS]: isBusiness[0][0],
      },
    ];
    const expectedIssuers = [new ethers.VoidSigner(did[2][0])];
    const expectedVerifiedAt = [did[1][0]];
    const accSigner = new ethers.VoidSigner(account);
    await assertGetAttributesBulkStatic(
      accSigner,
      [ATTRIBUTE_IS_BUSINESS, ATTRIBUTE_COUNTRY, ATTRIBUTE_DID],
      reader,
      expectedIssuers,
      expectedAttributes,
      expectedVerifiedAt
    );
    await assertGetAttributesStatic(
      accSigner,
      ATTRIBUTE_AML,
      reader,
      expectedIssuers,
      expectedAttributes,
      [aml[1][0]]
    );

    console.log(
      `[${i}/${passports.length}] Verification OK for passport ${account}`
    );
  }
})();
