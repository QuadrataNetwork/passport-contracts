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


    it('succeeds', async () => {
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
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
      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

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
      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

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
      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

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

      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

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
    it('succeeds', async () => {
      // No one should be able to withdraw
      await expect(socialReader.connect(issuer).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');
      await expect(socialReader.connect(treasury).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');
      await expect(socialReader.connect(admin).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');

      // Attest and query
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value-25'),
        treasury.address,
        sigAccount
      )
      const fee = await socialReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      await socialReader.connect(issuer).getAttributesLegacy(treasury.address, attrKey, {value: fee})

      // Issuer and Quadrata treasury should be withdrawable
      await socialReader.connect(issuer).withdraw();
      await socialReader.connect(treasury).withdraw();
      await expect(socialReader.connect(admin).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');

      // No one should be able to withdraw anymore
      await expect(socialReader.connect(issuer).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');
      await expect(socialReader.connect(treasury).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');
      await expect(socialReader.connect(admin).withdraw()).to.be.revertedWith('CANNOT_WITHDRAW');
    });
  });

  describe('setQueryFee()', function() {
    it('succeeds', async () => {
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM-RAW-ATTR'))
      const fee = await socialReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])

      expect(fee.toString()).eql("0")

      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-RAW-ATTR'), baseFee)

      const feeAfter = await socialReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey])
      expect(feeAfter.toString()).eql(baseFee)
    });
  });

  describe('getAttributesBulk()', function() {
    it('succeeds', async () => {
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

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

    it('succeeds with multiple attributes', async () => {
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const attrKey2 = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM-2'))
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-2'), baseFee)

      const attrKey3 = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM-3'))
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-3'), baseFee)

      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

      await socialReader.connect(issuer).setAttributes(
        attrKey,
        ethers.utils.id('some-random-value'),
        treasury.address,
        sigAccount
      )
      await socialReader.connect(issuer).setAttributes(
        attrKey2,
        ethers.utils.id('some-random-value2'),
        treasury.address,
        sigAccount
      )
      await socialReader.connect(issuer).setAttributes(
        attrKey3,
        ethers.utils.id('some-random-value3'),
        treasury.address,
        sigAccount
      )
      const fee = await socialReader.connect(issuer).queryFeeBulk(treasury.address, [attrKey, attrKey2, attrKey3])
      const attributes = await socialReader.connect(issuer).callStatic.getAttributesBulk(treasury.address, [attrKey, attrKey2, attrKey3], {value: fee})

      expect(attributes.length).eql(3)
      expect(attributes[0].value).eql(ethers.utils.id('some-random-value'))
      expect(attributes[0].issuer).eql(issuer.address)
      expect(attributes[1].value).eql(ethers.utils.id('some-random-value2'))
      expect(attributes[1].issuer).eql(issuer.address)
      expect(attributes[2].value).eql(ethers.utils.id('some-random-value3'))
      expect(attributes[2].issuer).eql(issuer.address)

      await socialReader.connect(issuer).getAttributesBulk(treasury.address, [attrKey, attrKey2, attrKey3], {value: fee})
    })
  });

  describe('getAttributesBulkLegacy()', function() {
    it('succeeds', async () =>{
      const attrKey = await socialReader.connect(issuer).getAttributeKey(issuer.address, ethers.utils.id('RANDOM'))
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const msg = `I authorize ${issuer.address.toLowerCase()} to attest to my address ${treasury.address.toLowerCase()}`
      const sigAccount = await treasury.signMessage(msg);

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
