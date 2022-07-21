import { network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const { expect } = require("chai");
const { constants } = require("ethers");
const { parseEther, id, hexZeroPad, parseUnits } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

const TIMELOCK = '0x76694A182dB047067521c73161Ebf3Db5Ca988d3';
const MULTISIG = '0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21';
const DEPLOYER = '0xc4f9dfd524dd6b639846e2bd80b2e6f0e2e2c660';

const EXPECTED_ORACLE = '0x65c816077c29b557bee980ae3cc2dce80204a0c5';
const EXPECTED_TREASURY = '0xa011eB50e03CaeCb9b551Df9Df478b6a513e0d21';
const EXPECTED_SPRINGLABS_ISSUER = '0x38a08d73153F32DBB2f867338d0BD6E3746E3391';
const EXPECTED_SPRINGLABS_TREASURY = '0x5F3f69808772C56Daee7A5d3176990733C67A123';
const EXPECTED_ISSUER_COUNT = '1';
const EXPECTED_MINT_PRICE = parseEther('0.006');
const EXPECTED_REV_SPLIT_ISSUER = '50';

const EXPECTED_INDIVIDUAL_COST_IS_BUSINESS = parseUnits("0", 6);
const EXPECTED_INDIVIDUAL_COST_AML = parseUnits("1", 6);
const EXPECTED_INDIVIDUAL_COST_COUNTRY = parseUnits("1", 6);
const EXPECTED_INDIVIDUAL_COST_DID = parseUnits("2", 6);

const EXPECTED_MARGIN_OF_SAFTY = {MIN: 0, MAX: parseUnits("1", 6)}

const EXPECTED_AML_SCORE_TEDDY = hexZeroPad('0x01', 32);
const EXPECTED_AML_SCORE_DANIEL = hexZeroPad('0x03', 32);
const EXPECTED_AML_SCORE_TRAVIS = hexZeroPad('0x03', 32);

const EXPECTED_BUSINESS_COST_IS_BUSINESS = 0
const EXPECTED_BUSINESS_COST_AML = parseUnits("5", 6);
const EXPECTED_BUSINESS_COST_COUNTRY = parseUnits("5", 6);
const EXPECTED_BUSINESS_COST_DID = parseUnits("10", 6);

const DEACTIVATED = '0';
const ACTIVATED = '1';

const GOVERNANCE_ROLE = id("GOVERNANCE_ROLE");
const PAUSER_ROLE = id("PAUSER_ROLE");
const ISSUER_ROLE = id("ISSUER_ROLE");
const DEFAULT_ADMIN_ROLE = hexZeroPad('0x00', 32);

const TIMELOCK_ADMIN_ROLE = '0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5';
const PROPOSER_ROLE = '0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1';
const EXECUTOR_ROLE = '0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63';

const AML = id("AML");
const DID = id("DID");
const COUNTRY = id("COUNTRY");
const IS_BUSINESS = id("IS_BUSINESS");

const TEDDY = '0xffE462ed723275eF8E7655C4883e8cD428826669';
const DANIEL = '0x5501CC22Be0F12381489D0980f20f872e1E6bfb9';
const TRAVIS = '0xD71bB1fF98D84ae00728f4A542Fa7A4d3257b33E';

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';

const QUAD_PASSPORT = '0x32791980a332F1283c69660eC8e426de3aD66E7f';
const QUAD_GOV = '0xA16E936425df96b9dA6125B03f19C4d34b315212';
const QUAD_READER = '0x7907bD4Be498cC9a7E2CF1a31dEeFCD8B132bca9';


// MAINNET CHECKS
;(async () => {

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

    let mockIssuer;
    [mockIssuer] = await ethers.getSigners();

    const passport = await ethers.getContractAt('QuadPassport', QUAD_PASSPORT);
    const governance = await ethers.getContractAt('QuadGovernance', QUAD_GOV)
    const reader = await ethers.getContractAt('QuadReader', QUAD_READER)
    const timelock = await ethers.getContractAt('IAccessControlUpgradeable', TIMELOCK);

    const priceOracle = await ethers.getContractAt('IUniswapAnchoredView', await governance.oracle())
    const priceDAI = await priceOracle.price("DAI");

    await expect(reader.calculatePaymentToken(AML, WBTC, TEDDY)).to.be.revertedWith("TOKEN_PAYMENT_NOT_ALLOWED");

    // CHECK INDIVIDUAL QUERY PRICE (USDC)
    var paymentTokenAML = await reader.calculatePaymentToken(AML, USDC, TEDDY);
    expect(paymentTokenAML.toString()).equals(EXPECTED_INDIVIDUAL_COST_AML.toString());
    var paymentTokenCOUNTRY = await reader.calculatePaymentToken(COUNTRY, USDC, TEDDY);
    expect(paymentTokenCOUNTRY.toString()).equals(EXPECTED_INDIVIDUAL_COST_COUNTRY.toString());
    var paymentTokenDID = await reader.calculatePaymentToken(DID, USDC, TEDDY);
    expect(paymentTokenDID.toString()).equals(EXPECTED_INDIVIDUAL_COST_DID.toString());
    var paymentTokenIS_BUSINESS = await reader.calculatePaymentToken(IS_BUSINESS, USDC, TEDDY);
    expect(paymentTokenIS_BUSINESS.toString()).equals(EXPECTED_INDIVIDUAL_COST_IS_BUSINESS.toString());

    console.log("COMPLETE PAYMENT USDC CHECKS");

    // CHECK INDIVIDUAL QUERY PRICE (USDT)
    paymentTokenAML = await reader.calculatePaymentToken(AML, USDT, TEDDY);
    expect(paymentTokenAML.toString()).equals(EXPECTED_INDIVIDUAL_COST_AML.toString());
    paymentTokenCOUNTRY = await reader.calculatePaymentToken(COUNTRY, USDT, TEDDY);
    expect(paymentTokenCOUNTRY.toString()).equals(EXPECTED_INDIVIDUAL_COST_COUNTRY.toString());
    paymentTokenDID = await reader.calculatePaymentToken(DID, USDT, TEDDY);
    expect(paymentTokenDID.toString()).equals(EXPECTED_INDIVIDUAL_COST_DID.toString());
    paymentTokenIS_BUSINESS = await reader.calculatePaymentToken(IS_BUSINESS, USDT, TEDDY);
    expect(paymentTokenIS_BUSINESS.toString()).equals(EXPECTED_INDIVIDUAL_COST_IS_BUSINESS.toString());

    console.log("COMPLETE PAYMENT USDT CHECKS");

    // CHECK INDIVIDUAL QUERY PRICE (DAI)
    paymentTokenAML = await reader.calculatePaymentToken(AML, DAI, TEDDY);
    const expectedAMLPrice = EXPECTED_INDIVIDUAL_COST_AML.mul(ethers.BigNumber.from("10").pow(18).div(priceDAI));
    expect(expectedAMLPrice.sub(paymentTokenAML).abs()).to.be.within(EXPECTED_MARGIN_OF_SAFTY.MIN, EXPECTED_MARGIN_OF_SAFTY.MAX)

    paymentTokenCOUNTRY = await reader.calculatePaymentToken(COUNTRY, DAI, TEDDY);
    const expectedCOUNTRYPrice = EXPECTED_INDIVIDUAL_COST_COUNTRY.mul(ethers.BigNumber.from("10").pow(18).div(priceDAI));
    expect(expectedCOUNTRYPrice.sub(paymentTokenCOUNTRY).abs()).to.be.within(EXPECTED_MARGIN_OF_SAFTY.MIN, EXPECTED_MARGIN_OF_SAFTY.MAX)

    paymentTokenDID = await reader.calculatePaymentToken(DID, DAI, TEDDY);
    const expectedDIDPrice = EXPECTED_INDIVIDUAL_COST_DID.mul(ethers.BigNumber.from("10").pow(18).div(priceDAI));
    expect(expectedDIDPrice.sub(paymentTokenDID).abs()).to.be.within(EXPECTED_MARGIN_OF_SAFTY.MIN, EXPECTED_MARGIN_OF_SAFTY.MAX)

    paymentTokenIS_BUSINESS = await reader.calculatePaymentToken(IS_BUSINESS, DAI, TEDDY);
    const expectedIS_BUSINESSPrice = EXPECTED_INDIVIDUAL_COST_IS_BUSINESS.mul(ethers.BigNumber.from("10").pow(18).div(priceDAI));
    expect(expectedIS_BUSINESSPrice.sub(paymentTokenIS_BUSINESS).abs()).to.be.within(EXPECTED_MARGIN_OF_SAFTY.MIN, EXPECTED_MARGIN_OF_SAFTY.MAX)
    console.log("COMPLETE PAYMENT DAI CHECKS");

    console.log("COMPLETE ALL PAYMENT METHOD CHECKS");

    const paymentEth = await reader.calculatePaymentETH(AML, TEDDY);
    const resultTeddyGetAttributesETH = await reader.callStatic.getAttributesETH(TEDDY, 1, AML, {value: paymentEth});
    expect(resultTeddyGetAttributesETH[0][0]).equals(EXPECTED_AML_SCORE_TEDDY); // teddy is clean

    const resultDanielGetAttributesETH = await reader.callStatic.getAttributesETH(DANIEL, 1, AML, {value: paymentEth});
    expect(resultDanielGetAttributesETH[0][0]).equals(EXPECTED_AML_SCORE_DANIEL); // daniel is a sketchy guy

    const resultTravisGetAttributesETH = await reader.callStatic.getAttributesETH(TRAVIS, 1, AML, {value: paymentEth});
    expect(resultTravisGetAttributesETH[0][0]).equals(EXPECTED_AML_SCORE_TRAVIS); // travis is a sketchy guy

    console.log("COMPLETE LOCAL STATIC CHECKS");

    const oracle = await governance.oracle();
    const treasury = await governance.treasury();
    const issuers = await governance.getIssuers();
    const springLabs = issuers[0].issuer;
    const springLabsTreasury = await governance.issuersTreasury(springLabs);
    const issuerCount = await governance.getIssuersLength();
    const springLabsActivationStatus = await governance.getIssuerStatus(springLabs);
    const mintPrice = await governance.mintPrice();
    const revSplitIssuer = await governance.revSplitIssuer();

    expect(oracle.toLowerCase()).equals(EXPECTED_ORACLE.toLowerCase());
    expect(treasury.toLowerCase()).equals(EXPECTED_TREASURY.toLowerCase());
    expect(springLabs.toLowerCase()).equals(EXPECTED_SPRINGLABS_ISSUER.toLowerCase());
    expect(springLabsTreasury.toLowerCase()).equals(EXPECTED_SPRINGLABS_TREASURY.toLowerCase());
    expect(issuerCount.toString()).equals(EXPECTED_ISSUER_COUNT);
    expect(springLabsActivationStatus.toString()).equals(ACTIVATED);
    expect(mintPrice.toString()).equals(EXPECTED_MINT_PRICE.toString());
    expect(revSplitIssuer.toString()).equals(EXPECTED_REV_SPLIT_ISSUER);

    console.log("COMPLETE GOV STORAGE CHECKS");

    expect(await governance.hasRole(GOVERNANCE_ROLE, EXPECTED_SPRINGLABS_ISSUER)).equals(false);
    expect(await governance.hasRole(PAUSER_ROLE, EXPECTED_SPRINGLABS_ISSUER)).equals(false);
    expect(await governance.hasRole(DEFAULT_ADMIN_ROLE, EXPECTED_SPRINGLABS_ISSUER)).equals(false);
    expect(await governance.hasRole(ISSUER_ROLE, EXPECTED_SPRINGLABS_ISSUER)).equals(true);

    expect(await governance.hasRole(GOVERNANCE_ROLE, EXPECTED_SPRINGLABS_TREASURY)).equals(false);
    expect(await governance.hasRole(PAUSER_ROLE, EXPECTED_SPRINGLABS_TREASURY)).equals(false);
    expect(await governance.hasRole(DEFAULT_ADMIN_ROLE, EXPECTED_SPRINGLABS_TREASURY)).equals(false);
    expect(await governance.hasRole(ISSUER_ROLE, EXPECTED_SPRINGLABS_TREASURY)).equals(false);

    expect(await governance.hasRole(GOVERNANCE_ROLE, TIMELOCK)).equals(true);
    expect(await governance.hasRole(PAUSER_ROLE, TIMELOCK)).equals(false);
    expect(await governance.hasRole(DEFAULT_ADMIN_ROLE, TIMELOCK)).equals(true);
    expect(await governance.hasRole(ISSUER_ROLE, TIMELOCK)).equals(false);

    expect(await governance.hasRole(GOVERNANCE_ROLE, MULTISIG)).equals(false);
    expect(await governance.hasRole(PAUSER_ROLE, MULTISIG)).equals(true);
    expect(await governance.hasRole(DEFAULT_ADMIN_ROLE, MULTISIG)).equals(false);
    expect(await governance.hasRole(ISSUER_ROLE, MULTISIG)).equals(false);

    expect(await governance.hasRole(GOVERNANCE_ROLE, DEPLOYER)).equals(false);
    expect(await governance.hasRole(PAUSER_ROLE, DEPLOYER)).equals(false);
    expect(await governance.hasRole(DEFAULT_ADMIN_ROLE, DEPLOYER)).equals(false);
    expect(await governance.hasRole(ISSUER_ROLE, DEPLOYER)).equals(false);

    expect(await timelock.hasRole(TIMELOCK_ADMIN_ROLE, DEPLOYER)).equals(false);
    expect(await timelock.hasRole(EXECUTOR_ROLE, DEPLOYER)).equals(false);
    expect(await timelock.hasRole(PROPOSER_ROLE, DEPLOYER)).equals(false);
    expect(await timelock.hasRole(DEFAULT_ADMIN_ROLE, DEPLOYER)).equals(false);

    expect(await timelock.hasRole(TIMELOCK_ADMIN_ROLE, TIMELOCK)).equals(true);
    expect(await timelock.hasRole(EXECUTOR_ROLE, TIMELOCK)).equals(false);
    expect(await timelock.hasRole(PROPOSER_ROLE, TIMELOCK)).equals(false);
    expect(await timelock.hasRole(DEFAULT_ADMIN_ROLE, TIMELOCK)).equals(false);

    expect(await timelock.hasRole(TIMELOCK_ADMIN_ROLE, MULTISIG)).equals(false);
    expect(await timelock.hasRole(EXECUTOR_ROLE, MULTISIG)).equals(false);
    expect(await timelock.hasRole(PROPOSER_ROLE, MULTISIG)).equals(true);
    expect(await timelock.hasRole(DEFAULT_ADMIN_ROLE, MULTISIG)).equals(false);

    console.log("COMPLETE ACCESS ROLE CHECKS");

})();