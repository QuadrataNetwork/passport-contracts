const { ethers, upgrades } = require('hardhat');
import { parseEther } from "ethers/lib/utils";
import { expect } from 'chai';
import { Contract, BigNumber } from 'ethers';
import { BytesLike } from '@ethersproject/bytes';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

const {
  deployPassportEcosystem,
} = require('../helpers/deployment_and_init.ts');

describe('QuadFlexKitReader()', function() {
  let flexkitReader: Contract;
  let passport: Contract;
  let governance: Contract;
  let reader: Contract;
  let deployer: SignerWithAddress, // eslint-disable-line no-unused-vars
    admin: SignerWithAddress,
    treasury: SignerWithAddress,
    issuer: SignerWithAddress,
    issuerTreasury: SignerWithAddress;
  const baseURI = 'https://quadrata.io';
  const baseFee = '5000000000000007';
  const quadrataFee = '1000000000000000';


  beforeEach(async () => {
    [deployer, admin, issuer, treasury, issuerTreasury] =
      await ethers.getSigners();
    [governance, passport, reader] = await deployPassportEcosystem(
      admin,
      [issuer],
      treasury,
      [issuerTreasury],
      baseURI
    );

    const FlexKitReader = await ethers.getContractFactory('QuadFlexKitReader');

    flexkitReader = await upgrades.deployProxy(
    FlexKitReader,
    [governance.address, reader.address],
    {
      initializer: 'initialize',
      kind: 'uups',
      unsafeAllow: ['constructor'],
    });

    await flexkitReader.deployed();
    await flexkitReader.connect(admin).setQuadrataFee(quadrataFee)
  });

  describe('setAttributes()', function() {
    it('fails if issuer is not allowed', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))

      await expect(
        flexkitReader.connect(issuer).setAttributes(
          attrKey,
          ethers.utils.id('RANDOM-VALUE'),
          treasury.address,
          await treasury.signMessage('INVALID')
        )
      ).to.be.revertedWith('INVALID_SIGNER');
    });

    it('fails if attrName is primary attribute is not allowed', async () => {
      const sigAccount = await treasury.signMessage(ethers.utils.id('COUNTRY'));

      await expect(
        flexkitReader.connect(issuer).setAttributes(
          ethers.utils.id('COUNTRY'),
          ethers.utils.id('RANDOM-VALUE'),
          treasury.address,
          sigAccount
        )
      ).to.be.revertedWith('ATTR_NAME_NOT_ALLOWED');
    });


    it('succeeds', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )
    });

    it('succeeds on first call and then multiple calls with empty signature', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-2'),
        treasury.address,
        await treasury.signMessage('BLAHBLAH')
      )

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-3'),
        treasury.address,
        await treasury.signMessage('RANDOM123824812852123')
      )
    });
  });

  describe('setRevokedAttributes()', function(){
    it('revoked and unrevokes attributes', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-2'),
        treasury.address,
        await treasury.signMessage('BLAHBLAH')
      )

      // User revokes
      await flexkitReader.connect(treasury).setRevokedAttributes(
        attrKey,
        true
      )

      // Write should fail
      await expect(flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-3'),
        treasury.address,
        sigAccount
      )).to.revertedWith(
        "REVOKED_ATTRIBUTE"
      )

      // User unrevokes
      await flexkitReader.connect(treasury).setRevokedAttributes(
        attrKey,
        false
      )

      // Different sig account to prove you can write without needing sig again once user unrevokes
      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-3'),
        treasury.address,
        await treasury.signMessage('BLAHBLAH')
      )
    });
  });

  describe('queryFee()', function() {
    it('returns baseFee for single attributes no data', async () =>{
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))

      const fee = await flexkitReader.connect(issuer).queryFee(
        issuer.address,
        attrKey
      );

      expect(fee.toString()).eql(BigNumber.from(quadrataFee).toString())
    });

    it('returns baseFee for single attributes with data', async () =>{
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))

      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);
      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-3'),
        treasury.address,
        sigAccount
      )

      const fee = await flexkitReader.connect(issuer).queryFee(
        treasury.address,
        attrKey
      );

      expect(fee.toString()).eql(BigNumber.from(baseFee).add(quadrataFee).toString())
    });


    it('returns correct fee for primary attributes', async () =>{
      let fee = await flexkitReader.connect(issuer).queryFee(
        issuer.address,
        ethers.utils.id('COUNTRY')
      )

      expect(fee.toString()).eql(parseEther("0.0012").toString())


      fee = await flexkitReader.connect(issuer).queryFee(
        issuer.address,
        ethers.utils.id('IS_BUSINESS')
      )
      expect(fee.toString()).eql('0')
    });
  });

  describe('queryFeeBulk()', function() {
    it('returns baseFee for single attributes', async () =>{
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))

      const fee = await flexkitReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [attrKey]
      );

      expect(fee.toString()).eql(BigNumber.from(baseFee).add(quadrataFee).toString())
    });

    it('returns (baseFee * n) for multiple attributes', async () =>{
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-2'), baseFee)
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-3'), baseFee)

      const attr1Key = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      const attr2Key = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM-2'))
      const attr3Key = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM-3'))

      const fee = await flexkitReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [attr1Key, attr2Key, attr3Key]
      )
      expect(fee.toString()).eql(BigNumber.from(baseFee).add(quadrataFee).mul(3).toString())
    });

    it('returns correct fee for primary attributes', async () =>{
      let fee = await flexkitReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [ethers.utils.id('COUNTRY')]
      )

      expect(fee.toString()).eql(parseEther("0.0012").toString())

      fee = await flexkitReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [ethers.utils.id('IS_BUSINESS')]
      )
      expect(fee.toString()).eql('0')

      fee = await flexkitReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [ethers.utils.id('COUNTRY'), ethers.utils.id('IS_BUSINESS')]
      )

      expect(fee.toString()).eql(parseEther("0.0012").toString())
    });

    it('returns correct fee for combined attributes', async () =>{
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)
      const attr1Key = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))

      const fee = await flexkitReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [attr1Key, ethers.utils.id('COUNTRY'), ethers.utils.id('IS_BUSINESS')]
      )
      expect(fee.toString()).eql(BigNumber.from(baseFee).add(quadrataFee).add(parseEther("0.0012")).toString())
    });
  });

  describe('getAttributes()', function() {
    it('succeeds', async () =>{
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)
      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-25'),
        treasury.address,
        sigAccount
      )
      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      const attributes = await flexkitReader.connect(issuer).callStatic.getAttributes(treasury.address, attrKey, {value: fee})

      expect(attributes.length).eql(1)
      expect(attributes[0].value).eql(ethers.utils.id('some-random-value-25'))
      expect(attributes[0].issuer).eql(issuer.address)

      await flexkitReader.connect(issuer).getAttributes(treasury.address, attrKey, {value: fee})
    });
  });

  describe('withdraw()', function() {
    it('succeeds', async () => {
      // No one should be able to withdraw
      await expect(flexkitReader.connect(issuer).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');
      await expect(flexkitReader.connect(treasury).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');
      await expect(flexkitReader.connect(admin).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');

      // Attest and query
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-25'),
        treasury.address,
        sigAccount
      );

      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey]);
      await flexkitReader.connect(issuer).getAttributesLegacy(treasury.address, attrKey, {value: fee});

      // Expect funds to be set properly
      expect(await flexkitReader.connect(issuer).funds(treasury.address)).eq(quadrataFee);
      expect(await flexkitReader.connect(issuer).funds(issuer.address)).eq(baseFee);

      // Issuer and Quadrata treasury should be withdrawable
      await flexkitReader.connect(issuer).withdraw();
      await flexkitReader.connect(treasury).withdraw();

      // Expect funds to be 0 after withdrawal
      expect(await flexkitReader.connect(issuer).funds(treasury.address)).eq(0);
      expect(await flexkitReader.connect(issuer).funds(issuer.address)).eq(0);

      await expect(flexkitReader.connect(admin).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');

      // No one should be able to withdraw anymore
      await expect(flexkitReader.connect(issuer).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');
      await expect(flexkitReader.connect(treasury).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');
      await expect(flexkitReader.connect(admin).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');
    });

    it('succeeds with legacy attributes', async () => {
      // Expect funds to be set properly
      expect(await flexkitReader.connect(issuer).funds(treasury.address)).eq(0);
      expect(await flexkitReader.connect(issuer).funds(issuer.address)).eq(0);

      const fee1 = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [ethers.utils.id('COUNTRY')]);
      await flexkitReader.connect(issuer).getAttributesLegacy(treasury.address, ethers.utils.id('COUNTRY'), {value: fee1});

      // Expect funds to be set properly
      expect(await flexkitReader.connect(issuer).funds(treasury.address)).eq(0);
      expect(await flexkitReader.connect(issuer).funds(issuer.address)).eq(0);
    });

    it('succeeds with no attributes posted', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      // Expect funds to be set properly
      expect(await flexkitReader.connect(issuer).funds(treasury.address)).eq(0);
      expect(await flexkitReader.connect(issuer).funds(issuer.address)).eq(0);

      //First query
      const fee1 = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey]);
      await flexkitReader.connect(issuer).getAttributesLegacy(treasury.address, attrKey, {value: fee1});

      // Expect funds to be set properly - issuer does not get fund since nothing was attested
      expect(await flexkitReader.connect(issuer).funds(treasury.address)).eq(quadrataFee);
      expect(await flexkitReader.connect(issuer).funds(issuer.address)).eq(0);
    });

    it('succeeds with multiple queries', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      // Expect funds to be set properly
      expect(await flexkitReader.connect(issuer).funds(treasury.address)).eq(0);
      expect(await flexkitReader.connect(issuer).funds(issuer.address)).eq(0);

      //First query
      const fee1 = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey]);
      await flexkitReader.connect(issuer).getAttributesLegacy(treasury.address, attrKey, {value: fee1});

      // Expect funds to be set properly - issuer does not get fund since nothing was attested
      expect(await flexkitReader.connect(issuer).funds(treasury.address)).eq(quadrataFee);
      expect(await flexkitReader.connect(issuer).funds(issuer.address)).eq(0);

      // Attest data
      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);
      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-25'),
        treasury.address,
        sigAccount
      )

      //Second query
      const fee2 = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey]);
      await flexkitReader.connect(issuer).getAttributesLegacy(treasury.address, attrKey, {value: fee2});

      // Expect funds to be set properly
      expect(await flexkitReader.connect(issuer).funds(treasury.address)).eq(BigNumber.from(quadrataFee).mul(2).toString());
      expect(await flexkitReader.connect(issuer).funds(issuer.address)).eq(baseFee.toString());

      //Third legacy query
      const fee3 = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [ethers.utils.id('COUNTRY')]);
      await flexkitReader.connect(issuer).getAttributesLegacy(treasury.address, ethers.utils.id('COUNTRY'), {value: fee3});

      // Expect funds to be set properly
      expect(await flexkitReader.connect(issuer).funds(treasury.address)).eq(BigNumber.from(quadrataFee).mul(2).toString());
      expect(await flexkitReader.connect(issuer).funds(issuer.address)).eq(baseFee.toString());
    });

  });

  describe('setQueryFee()', function() {
    it('succeeds', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM-RAW-ATTR'))
      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])

      expect(fee.toString()).eql(quadrataFee)

      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-RAW-ATTR'), baseFee)

      const feeAfter = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])

      expect(feeAfter.toString()).eql(BigNumber.from(baseFee).add(quadrataFee).toString())
    });
  });

  describe('getAttributesLegacy()', function() {
    it('succeeds', async () =>{
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-25'),
        treasury.address,
        sigAccount
      )
      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      const attributes = await flexkitReader.connect(issuer).callStatic.getAttributesLegacy(treasury.address, attrKey, {value: fee})

      expect(attributes.length).eql(3)
      expect(attributes[0][0]).eql(ethers.utils.id('some-random-value-25'))
      expect(attributes[2][0]).eql(issuer.address)

      await flexkitReader.connect(issuer).getAttributesLegacy(treasury.address, attrKey, {value: fee})
    });

    it('succeeds with no data', async () =>{
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      const attributes = await flexkitReader.connect(issuer).callStatic.getAttributesLegacy(treasury.address, attrKey, {value: fee})

      expect(attributes.length).eql(3)
      expect(attributes[0][0]).eql(ethers.constants.HashZero)
      expect(attributes[2][0]).eql(ethers.constants.AddressZero)

      await flexkitReader.connect(issuer).getAttributesLegacy(treasury.address, attrKey, {value: fee})
    });
  });

  describe('getAttributesBulk()', function() {
    it('succeeds', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )
      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      const attributes = await flexkitReader.connect(issuer).callStatic.getAttributesBulk(treasury.address, [attrKey], {value: fee})

      expect(attributes.length).eql(1)
      expect(attributes[0].value).eql(ethers.utils.id('some-random-value'))
      expect(attributes[0].issuer).eql(issuer.address)

      await flexkitReader.connect(issuer).getAttributesBulk(treasury.address, [attrKey], {value: fee})
    });

    it('succeeds with no data', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      const attributes = await flexkitReader.connect(issuer).callStatic.getAttributesBulk(treasury.address, [attrKey], {value: fee})

      expect(attributes.length).eql(1)
      expect(attributes[0].value).eql(ethers.constants.HashZero)
      expect(attributes[0].issuer).eql(ethers.constants.AddressZero)

      await flexkitReader.connect(issuer).getAttributesBulk(treasury.address, [attrKey], {value: fee})
    });


    it('succeeds with multiple attributes', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const attrKey2 = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM-2'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-2'), baseFee)

      const attrKey3 = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM-3'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-3'), baseFee)

      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )
      await flexkitReader.connect(issuer).setAttributes(
        attrKey2,
        ethers.utils.id('some-random-value2'),
        treasury.address,
        sigAccount
      )
      await flexkitReader.connect(issuer).setAttributes(
        attrKey3,
        ethers.utils.id('some-random-value3'),
        treasury.address,
        sigAccount
      )
      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey, attrKey2, attrKey3])
      const attributes = await flexkitReader.connect(issuer).callStatic.getAttributesBulk(treasury.address, [attrKey, attrKey2, attrKey3], {value: fee})

      expect(attributes.length).eql(3)
      expect(attributes[0].value).eql(ethers.utils.id('some-random-value'))
      expect(attributes[0].issuer).eql(issuer.address)
      expect(attributes[1].value).eql(ethers.utils.id('some-random-value2'))
      expect(attributes[1].issuer).eql(issuer.address)
      expect(attributes[2].value).eql(ethers.utils.id('some-random-value3'))
      expect(attributes[2].issuer).eql(issuer.address)

      await flexkitReader.connect(issuer).getAttributesBulk(treasury.address, [attrKey, attrKey2, attrKey3], {value: fee})
    })

    it('fails with not enough eth', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      await expect(
        flexkitReader.connect(issuer).getAttributesBulk(treasury.address, [attrKey], {value: 0})
      ).to.be.revertedWith('INVALID_FEE');

      await expect(
        flexkitReader.connect(issuer).getAttributesBulk(treasury.address, [attrKey], {value: fee + 100})
      ).to.be.revertedWith('INVALID_FEE');
    });
  });

  describe('getAttributesBulkLegacy()', function() {
    it('succeeds', async () =>{
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

      await flexkitReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )
      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      const attributes = await flexkitReader.connect(issuer).callStatic.getAttributesBulkLegacy(treasury.address, [attrKey], {value: fee})

      expect(attributes.length).eql(3)
      expect(attributes[0]).eql([ethers.utils.id('some-random-value')])
      expect(parseInt(attributes[1][0])).greaterThan(0)
      expect(attributes[2]).eql([issuer.address])

      await flexkitReader.connect(issuer).getAttributesBulk(treasury.address, [attrKey], {value: fee})
    });

    it('succeeds with no data', async () =>{
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      const attributes = await flexkitReader.connect(issuer).callStatic.getAttributesBulkLegacy(treasury.address, [attrKey], {value: fee})

      expect(attributes.length).eql(3)
      expect(attributes[0]).eql([ethers.constants.HashZero])
      expect(parseInt(attributes[1][0])).eql(0)
      expect(attributes[2]).eql([ethers.constants.AddressZero])

      await flexkitReader.connect(issuer).getAttributesBulk(treasury.address, [attrKey], {value: fee})
    });

    it('fails with not enough eth', async () => {
      const attrKey = await flexkitReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await flexkitReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const fee = await flexkitReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      await expect(
        flexkitReader.connect(issuer).getAttributesBulkLegacy(treasury.address, [attrKey], {value: 0})
      ).to.be.revertedWith('INVALID_FEE');

      await expect(
        flexkitReader.connect(issuer).getAttributesBulkLegacy(treasury.address, [attrKey], {value: fee + 100})
      ).to.be.revertedWith('INVALID_FEE');
    });
  });
});
