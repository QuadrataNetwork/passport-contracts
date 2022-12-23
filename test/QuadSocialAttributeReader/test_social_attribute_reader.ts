const { ethers, upgrades } = require('hardhat');
import { expect } from 'chai';
import { Contract, BigNumber } from 'ethers';
import { BytesLike } from '@ethersproject/bytes';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

const {
  deployPassportEcosystem,
} = require('../helpers/deployment_and_init.ts');


describe('SocialAttributeReader()', function() {
  let socialReader: Contract;
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

    const SocialAttributeReader = await ethers.getContractFactory('SocialAttributeReader');

    socialReader = await upgrades.deployProxy(
    SocialAttributeReader,
    [governance.address, reader.address],
    {
      initializer: 'initialize',
      kind: 'uups',
      unsafeAllow: ['constructor'],
    });

    await socialReader.deployed();
    await socialReader.connect(admin).setQuadrataFee(baseFee)
  });

  describe('setAttributes()', function() {
    it('fails if issuer is not allowed', async () => {
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))

      await expect(
        socialReader.connect(issuer).setAttributes(
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
        socialReader.connect(issuer).setAttributes(
          ethers.utils.id('COUNTRY'),
          ethers.utils.id('RANDOM-VALUE'),
          treasury.address,
          sigAccount
        )
      ).to.be.revertedWith('ATTR_NAME_NOT_ALLOWED');
    });


    it.only('succeeds', async () => {
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))

      // 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4

      // const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      // const msg = "I 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

      const msg = new Uint8Array([
        ...ethers.utils.toUtf8Bytes("I authorize "),
        ...ethers.utils.arrayify(issuer.address),
        ...ethers.utils.toUtf8Bytes(" to attest to my address "),
        ...ethers.utils.arrayify(treasury.address)])

      const sigAccount = await treasury.signMessage(msg);

      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )
    });

    it('succeeds on first call and then multiple calls with empty signature', async () => {
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      const sigAccount = await treasury.signMessage(ethers.utils.arrayify(attrKey));
      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )

      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-2'),
        treasury.address,
        await treasury.signMessage('BLAHBLAH')
      )

      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-3'),
        treasury.address,
        await treasury.signMessage('RANDOM123824812852123')
      )
    });
  });

  describe('setRevokedAttributes()', function(){
    it('revoked and unrevokes attributes', async () => {
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      const sigAccount = await treasury.signMessage(ethers.utils.arrayify(attrKey));
      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )

      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-2'),
        treasury.address,
        await treasury.signMessage('BLAHBLAH')
      )

      // User revokes
      await socialReader.connect(treasury).setRevokedAttributes(
        attrKey,
        true
      )

      // Write should fail
      await expect(socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-3'),
        treasury.address,
        sigAccount
      )).to.revertedWith(
        "REVOKED_ATTRIBUTE"
      )

      // User unrevokes
      await socialReader.connect(treasury).setRevokedAttributes(
        attrKey,
        false
      )

      // Different sig account to prove you can write without needing sig again once user unrevokes
      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-3'),
        treasury.address,
        await treasury.signMessage('BLAHBLAH')
      )
    });
  });

  describe('queryFee()', function() {
    it('returns baseFee for single attributes', async () =>{
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))

      const fee = await socialReader.connect(issuer).queryFee(
        issuer.address,
        attrKey
      );

      expect(fee.toString()).eql(baseFee)
    });

    it('returns correct fee for primary attributes', async () =>{
      let fee = await socialReader.connect(issuer).queryFee(
        issuer.address,
        ethers.utils.id('COUNTRY')
      )
      expect(fee.toString()).eql('1200000000000000')

      fee = await socialReader.connect(issuer).queryFee(
        issuer.address,
        ethers.utils.id('IS_BUSINESS')
      )
      expect(fee.toString()).eql('0')
    });
  });

  describe('queryFeeBulk()', function() {
    it('returns baseFee for single attributes', async () =>{
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))

      const fee = await socialReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [attrKey]
      );

      expect(fee.toString()).eql(baseFee)
    });

    it('returns (baseFee * n) for multiple attributes', async () =>{
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-2'), baseFee)
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-3'), baseFee)

      const attr1Key = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      const attr2Key = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM-2'))
      const attr3Key = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM-3'))

      const fee = await socialReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [attr1Key, attr2Key, attr3Key]
      )
      expect(fee.toString()).eql(BigNumber.from(baseFee).mul(3).toString())
    });

    it('returns correct fee for primary attributes', async () =>{
      let fee = await socialReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [ethers.utils.id('COUNTRY')]
      )
      expect(fee.toString()).eql('1200000000000000')

      fee = await socialReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [ethers.utils.id('IS_BUSINESS')]
      )
      expect(fee.toString()).eql('0')

      fee = await socialReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [ethers.utils.id('COUNTRY'), ethers.utils.id('IS_BUSINESS')]
      )
      expect(fee.toString()).eql('1200000000000000')
    });

    it('returns correct fee for combined attributes', async () =>{
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)
      const attr1Key = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))

      const fee = await socialReader.connect(issuer).queryFeeBulk(
        issuer.address,
        [attr1Key, ethers.utils.id('COUNTRY'), ethers.utils.id('IS_BUSINESS')]
      )
      expect(fee.toString()).eql('6200000000000007')
    });
  });

  describe('getAttributes()', function() {
    it('succeeds', async () =>{
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const sigAccount = await treasury.signMessage(ethers.utils.arrayify(attrKey));
      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-25'),
        treasury.address,
        sigAccount
      )
      const fee = await socialReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      const attributes = await socialReader.connect(issuer).callStatic.getAttributes(treasury.address, attrKey, {value: fee})

      expect(attributes.length).eql(1)
      expect(attributes[0].value).eql(ethers.utils.id('some-random-value-25'))
      expect(attributes[0].issuer).eql(issuer.address)

      await socialReader.connect(issuer).getAttributes(treasury.address, attrKey, {value: fee})
    });
  });

  describe('getAttributesLegacy()', function() {
    it('succeeds', async () =>{
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const sigAccount = await treasury.signMessage(ethers.utils.arrayify(attrKey));
      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-25'),
        treasury.address,
        sigAccount
      )
      const fee = await socialReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      const attributes = await socialReader.connect(issuer).callStatic.getAttributesLegacy(treasury.address, attrKey, {value: fee})

      expect(attributes.length).eql(3)
      expect(attributes[0][0]).eql(ethers.utils.id('some-random-value-25'))
      expect(attributes[2][0]).eql(issuer.address)

      await socialReader.connect(issuer).getAttributesLegacy(treasury.address, attrKey, {value: fee})
    });
  });

  describe('withdraw()', function() {
    // TODO:
  });
  describe('setQueryFee()', function() {
    // TODO:
  });

  describe('getAttributesBulk()', function() {
    it('succeeds', async () =>{
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const sigAccount = await treasury.signMessage(ethers.utils.arrayify(attrKey));
      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )
      const fee = await socialReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      const attributes = await socialReader.connect(issuer).callStatic.getAttributesBulk(treasury.address, [attrKey], {value: fee})

      expect(attributes.length).eql(1)
      expect(attributes[0].value).eql(ethers.utils.id('some-random-value'))
      expect(attributes[0].issuer).eql(issuer.address)

      await socialReader.connect(issuer).getAttributesBulk(treasury.address, [attrKey], {value: fee})
    });
  });

  describe('getAttributesBulkLegacy()', function() {
    it('succeeds', async () =>{
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const sigAccount = await treasury.signMessage(ethers.utils.arrayify(attrKey));
      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )
      const fee = await socialReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      const attributes = await socialReader.connect(issuer).callStatic.getAttributesBulkLegacy(treasury.address, [attrKey], {value: fee})

      expect(attributes.length).eql(3)
      expect(attributes[0]).eql([ethers.utils.id('some-random-value')])
      expect(parseInt(attributes[1][0])).greaterThan(0)
      expect(attributes[2]).eql([issuer.address])

      await socialReader.connect(issuer).getAttributesBulk(treasury.address, [attrKey], {value: fee})
    });
  });
});
