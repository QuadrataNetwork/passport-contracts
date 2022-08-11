import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { formatBytes32String, id } from "ethers/lib/utils";

const {
  MINT_PRICE,
  ATTRIBUTE_DID,
  ATTRIBUTE_AML,
  ATTRIBUTE_IS_BUSINESS,
  ATTRIBUTE_COUNTRY,
  TOKEN_ID,
  PRICE_PER_ATTRIBUTES_ETH,
  PRICE_PER_BUSINESS_ATTRIBUTES_ETH,
} = require("../../utils/constant.ts");

const { deployPassportEcosystem } = require("../utils/deployment_and_init.ts");

const { signMint, signMessage } = require("../utils/signature.ts");

const setAttributeOptimized = async (
  minter: SignerWithAddress,
  issuer: SignerWithAddress,
  passport: Contract,
  attributes: any,
  issuedAt: number,
  price: any
) => {
  let attrKeys: string[] = [];
  let attrValues: string[] = [];

  Object.keys(attributes).forEach((k, i) => {
    let attrKey;
    if (k == ATTRIBUTE_AML) {
      console.log({ attributes, k });
      attrKey = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["bytes32", "bytes32"],
          [attributes[ATTRIBUTE_DID], k]
        )
      );
    } else {
      attrKey = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "bytes32"],
          [minter.address, k]
        )
      );
    }
    attrKeys.push(attrKey);
    attrValues.push(attributes[k]);
  });

  const hash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "bytes32[]", "bytes32[]", "uint256", "uint256"],
      [minter.address, attrKeys, attrValues, issuedAt, price]
    )
  );

  const sig = await issuer.signMessage(ethers.utils.arrayify(hash));

  const sigAccount = await minter.signMessage(
    ethers.utils.arrayify(ethers.utils.id("Quadrata"))
  );

  await passport
    .connect(minter)
    .mintPassport2([attrKeys, attrValues, issuedAt, price], sig, sigAccount, {
      value: price,
    });
};

describe("QuadReader", async () => {
  let passport: Contract;
  let governance: Contract; // eslint-disable-line no-unused-vars
  let reader: Contract; // eslint-disable-line no-unused-vars
  let usdc: Contract;
  let defi: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    minterA: SignerWithAddress,
    minterB: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerB: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuerC: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuerTreasury: SignerWithAddress,
    issuerBTreasury: SignerWithAddress, // eslint-disable-line no-unused-vars
    issuerCTreasury: SignerWithAddress; // eslint-disable-line no-unused-vars

  let baseURI: string;
  let did: string;
  let aml: string;
  let country: string;
  let isBusiness: string;
  let issuedAt: number;

  beforeEach(async () => {
    baseURI = "https://quadrata.io";
    did = formatBytes32String("did:quad:123456789abcdefghi");
    aml = id("LOW");
    country = id("FRANCE");
    isBusiness = id("FALSE");
    issuedAt = Math.floor(new Date().getTime() / 1000) - 100;

    [
      deployer,
      admin,
      minterA,
      minterB,
      issuer,
      treasury,
      issuerTreasury,
      issuerB,
      issuerBTreasury,
      issuerC,
      issuerCTreasury,
    ] = await ethers.getSigners();
    [governance, passport, reader, usdc, defi] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury],
      baseURI
    );

    const sig = await signMint(
      issuer,
      minterA,
      TOKEN_ID,
      did,
      aml,
      country,
      isBusiness,
      issuedAt
    );
    const sigAccount = await signMessage(minterA, minterA.address);
    await passport
      .connect(minterA)
      .mintPassport(
        [minterA.address, TOKEN_ID, did, aml, country, isBusiness, issuedAt],
        sig,
        sigAccount,
        {
          value: MINT_PRICE,
        }
      );

    const attributes = {
      [ATTRIBUTE_DID]: did,
      [ATTRIBUTE_AML]: aml,
      [ATTRIBUTE_COUNTRY]: country,
      [ATTRIBUTE_IS_BUSINESS]: isBusiness,
    };

    const price = MINT_PRICE;

    await setAttributeOptimized(
      minterA,
      issuer,
      passport,
      attributes,
      issuedAt,
      price
    );
  });

  describe("calculate Gas - 1 issuer | 4 attributes", async () => {
    const attributes = [
      ATTRIBUTE_DID,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_AML,
    ];

    it("getAttributes(directly) - old", async () => {
      await reader
        .connect(minterA)
        .getAttributes(minterA.address, 1, ATTRIBUTE_COUNTRY, {
          value: ethers.utils.parseEther("1"),
        });
    });

    it("getAttributes(directly) - optimized", async () => {
      await reader
        .connect(minterA)
        .getAttributes2(minterA.address, 1, ATTRIBUTE_AML, {
          value: ethers.utils.parseEther("1"),
        });
    });

    it("getAttributes Old", async () => {
      await defi.connect(minterA).queryMultipleAttributes(attributes, {
        value: ethers.utils.parseEther("1"),
      });
    });

    it("getAttribute Optimized", async () => {
      await defi.connect(minterA).queryMultipleAttributesOptimized(attributes, {
        value: ethers.utils.parseEther("1"),
      });
    });

    it("getAttributesBulk", async () => {
      await defi.connect(minterA).queryMultipleBulk(attributes, {
        value: ethers.utils.parseEther("1"),
      });
    });
  });

  describe("calculate Gas - 3 issuers | 4 attributes", async () => {
    const attributes = [
      ATTRIBUTE_DID,
      ATTRIBUTE_COUNTRY,
      ATTRIBUTE_IS_BUSINESS,
      ATTRIBUTE_AML,
    ];

    beforeEach(async () => {
      await governance
        .connect(admin)
        .setIssuer(issuerB.address, issuerBTreasury.address);
      await governance
        .connect(admin)
        .setIssuer(issuerC.address, issuerCTreasury.address);
      for (const iss of [issuerB, issuerC]) {
        const sig = await signMint(
          iss,
          minterA,
          TOKEN_ID,
          did,
          aml,
          country,
          isBusiness,
          issuedAt
        );
        const sigAccount = await signMessage(minterA, minterA.address);
        await passport
          .connect(minterA)
          .mintPassport(
            [
              minterA.address,
              TOKEN_ID,
              did,
              aml,
              country,
              isBusiness,
              issuedAt,
            ],
            sig,
            sigAccount,
            {
              value: MINT_PRICE,
            }
          );
        const attributesDict = {
          [ATTRIBUTE_DID]: did,
          [ATTRIBUTE_AML]: aml,
          [ATTRIBUTE_COUNTRY]: country,
          [ATTRIBUTE_IS_BUSINESS]: isBusiness,
        };

        await setAttributeOptimized(
          minterA,
          iss,
          passport,
          attributesDict,
          issuedAt,
          MINT_PRICE
        );
      }
    });
    it("getAttributes(directly) - old", async () => {
      await reader
        .connect(minterA)
        .getAttributes(minterA.address, 1, ATTRIBUTE_COUNTRY, {
          value: ethers.utils.parseEther("1"),
        });
    });

    it("getAttributes(directly) - optimized", async () => {
      await reader
        .connect(minterA)
        .getAttributes2(minterA.address, 1, ATTRIBUTE_COUNTRY, {
          value: ethers.utils.parseEther("1"),
        });
    });

    it("getAttribute(through DeFi) Old", async () => {
      await defi.connect(minterA).queryMultipleAttributes(attributes, {
        value: ethers.utils.parseEther("1"),
      });
    });

    it("getAttribute Optimized", async () => {
      await defi.connect(minterA).queryMultipleAttributesOptimized(attributes, {
        value: ethers.utils.parseEther("1"),
      });
    });

    it("getAttributesBulk", async () => {
      await defi.connect(minterA).queryMultipleBulk(attributes, {
        value: ethers.utils.parseEther("1"),
      });
    });
  });
});
