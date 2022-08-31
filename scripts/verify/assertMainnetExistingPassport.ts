import { network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const { expect } = require("chai");
const { id, hexZeroPad } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

const { COUNTRY_CODES } = require("./countryCodes.ts");

const {
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_COUNTRY,
  ATTRIBUTE_IS_BUSINESS,
} = require("../../utils/constant.ts");

const TEDDY = "0xffE462ed723275eF8E7655C4883e8cD428826669";
const DANIEL = "0x5501CC22Be0F12381489D0980f20f872e1E6bfb9";
const TRAVIS = "0xD71bB1fF98D84ae00728f4A542Fa7A4d3257b33E";

const QUAD_READER = "0x7907bD4Be498cC9a7E2CF1a31dEeFCD8B132bca9";

const EXPECTED_AML_SCORE_TEDDY = hexZeroPad("0x01", 32);
const EXPECTED_COUNTRY_SCORE_TEDDY = id("US");

const EXPECTED_AML_SCORE_DANIEL = hexZeroPad("0x03", 32);
const EXPECTED_AML_SCORE_TRAVIS = hexZeroPad("0x03", 32);

const getCountry = async (
  user: any,
  reader: any,
  isoCodes: any
): Promise<string> => {
  const queryFeeCountry = await reader.queryFee(user, ATTRIBUTE_AML);
  const result = await reader.callStatic.getAttributes(
    user,
    ATTRIBUTE_COUNTRY,
    {
      value: queryFeeCountry,
    }
  );
  let userSymbol = "nothing found";
  isoCodes.forEach((code: any) => {
    if (code.HASH === result[0][0]) {
      userSymbol = code.SYMBOL;
      return;
    }
  });

  return userSymbol;
};

const getAML = async (user: any, reader: any) => {
  const queryFee = await reader.queryFee(user, ATTRIBUTE_AML);
  const result = await reader.callStatic.getAttributes(user, ATTRIBUTE_AML, {
    value: queryFee,
  });
  return result[0][0];
};

const getDID = async (user: any, reader: any) => {
  const queryFee = await reader.queryFee(user, ATTRIBUTE_DID);
  const result = await reader.callStatic.getAttributes(user, ATTRIBUTE_DID, {
    value: queryFee,
  });
  return result[0][0];
};

const getIsBusiness = async (user: any, reader: any) => {
  const queryFee = await reader.queryFee(user, ATTRIBUTE_IS_BUSINESS);
  const result = await reader.callStatic.getAttributes(
    user,
    ATTRIBUTE_IS_BUSINESS,
    { value: queryFee }
  );
  return result[0][0];
};

const getUserData = async (user: any, reader: any, isoCodes: any) => {
  const country = await getCountry(user, reader, isoCodes);
  const aml = await getAML(user, reader);
  const did = await getDID(user, reader);
  const isBusiness = await getIsBusiness(user, reader);

  return {
    country: country,
    aml: aml,
    did: did,
    isBusiness: isBusiness,
  };
};

// MAINNET CHECKS
(async () => {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.ETHEREUM_MAINNET,
        },
      },
    ],
  });

  const reader = await ethers.getContractAt("QuadReader", QUAD_READER);

  // USER_1
  console.log("SAMPLING USER 1 (from CH)");
  expect(
    await getCountry(
      "0x4e95fEdB012831e3207c8167be1690f812f964a5",
      reader,
      COUNTRY_CODES
    )
  ).equals("CH");
  console.log(
    await getUserData(
      "0x4e95fEdB012831e3207c8167be1690f812f964a5",
      reader,
      COUNTRY_CODES
    )
  );

  // USER_2
  console.log("SAMPLING USER 2 (from GB)");
  expect(
    await getCountry(
      "0xE8c150212ecCE414202D4cC00e86ae24f95037c0",
      reader,
      COUNTRY_CODES
    )
  ).equals("GB");
  console.log(
    await getUserData(
      "0xE8c150212ecCE414202D4cC00e86ae24f95037c0",
      reader,
      COUNTRY_CODES
    )
  );

  const queryFee = await reader.queryFee(TEDDY, ATTRIBUTE_AML);
  const resultTeddyGetAttributesETH = await reader.callStatic.getAttributes(
    TEDDY,
    ATTRIBUTE_AML,
    { value: queryFee }
  );
  expect(resultTeddyGetAttributesETH[0][0]).equals(EXPECTED_AML_SCORE_TEDDY);
  console.log("Teddy AML OK");

  const queryFeeCountry = await reader.queryFee(TEDDY, ATTRIBUTE_AML);
  const resultTeddyGetAttributesETHCountry =
    await reader.callStatic.getAttributes(TEDDY, ATTRIBUTE_COUNTRY, {
      value: queryFeeCountry,
    });
  expect(resultTeddyGetAttributesETHCountry[0][0]).equals(
    EXPECTED_COUNTRY_SCORE_TEDDY
  );
  console.log("Teddy COUNTRY OK");

  const resultDanielGetAttributesETH = await reader.callStatic.getAttributes(
    DANIEL,
    ATTRIBUTE_AML,
    { value: queryFee }
  );
  expect(resultDanielGetAttributesETH[0][0]).equals(EXPECTED_AML_SCORE_DANIEL);
  console.log("Daniel AML OK");

  const resultTravisGetAttributesETH = await reader.callStatic.getAttributes(
    TRAVIS,
    ATTRIBUTE_AML,
    { value: queryFee }
  );
  expect(resultTravisGetAttributesETH[0][0]).equals(EXPECTED_AML_SCORE_TRAVIS);
  console.log("TRAVIS AML OK");
  console.log("COMPLETE LOCAL STATIC CHECKS");
})();
