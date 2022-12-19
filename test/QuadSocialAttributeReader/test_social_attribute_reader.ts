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
      const sigAccount = await treasury.signMessage(ethers.utils.arrayify(attrKey));
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
});
