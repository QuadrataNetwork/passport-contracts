import { ethers } from "hardhat";
import { id } from "ethers/lib/utils";

const {
  assertGetAttributesBulkStatic,
} = require("../../test/helpers/assert/assert_get_attributes_bulk.ts");

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
} = require("../../utils/constant.ts");

const OLD_PASSPORT = "0x911757E425dBc4D5f9E522E87Ab01C8a096AD0D6";

const OLD_READER = "0x2B212B47Faf2040cA4782e812048F5aE8ad5Fa2f";
const NEW_READER = "0xdeB66c6744097d7172539BB7c7FC1e255d1135cD";

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
    console.log(did);
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
      [ATTRIBUTE_DID, ATTRIBUTE_AML, ATTRIBUTE_COUNTRY, ATTRIBUTE_IS_BUSINESS],
      reader,
      expectedIssuers,
      expectedAttributes,
      expectedVerifiedAt
    );

    console.log(
      `[${i}/${passports.length}] Verification OK for passport ${account}`
    );
  }
})();
