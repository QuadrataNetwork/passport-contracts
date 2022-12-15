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

  describe('writeAttributes()', function() {
    it('fails if issuer is not allowed', async () => {
      await expect(
        socialReader.connect(issuer).writeAttributes(ethers.utils.id('RANDOM_ATTR'), ethers.utils.id('RANDOM-VALUE'), treasury.address)
      ).to.be.revertedWith('NOT_ALLOWED');
    });

    it('fails if attrName is primary attribute is not allowed', async () => {
      await socialReader.connect(treasury).allowAddress(issuer.address, true);

      await expect(
        socialReader.connect(issuer).writeAttributes(ethers.utils.id('COUNTRY'), ethers.utils.id('RANDOM-VALUE'), treasury.address)
      ).to.be.revertedWith('ATTR_NAME_NOT_ALLOWED');
    });


    it('succeeds', async () => {
      await socialReader.connect(treasury).allowAddress(issuer.address, true);
      await socialReader.connect(issuer).writeAttributes(ethers.utils.id('RANDOM_ATTR'), ethers.utils.id('RANDOM-VALUE'), treasury.address)
    });
  });

  describe('queryFeeBulk()', function() {
    it('returns baseFee for single attributes', async () =>{
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const fee = await socialReader.connect(issuer).queryFeeBulk(issuer.address, issuer.address, [ethers.utils.id('RANDOM')])
      expect(fee.toString()).eql(baseFee)
    });

    it('returns (baseFee * n) for multiple attributes', async () =>{
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-2'), baseFee)
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM-3'), baseFee)

      const fee = await socialReader.connect(issuer).queryFeeBulk(
        issuer.address,
        issuer.address,
        [ethers.utils.id('RANDOM'), ethers.utils.id('RANDOM-2'), ethers.utils.id('RANDOM-3')]
      )
      expect(fee.toString()).eql(BigNumber.from(baseFee).mul(3).toString())
    });

    it('returns correct fee for primary attributes', async () =>{
      let fee = await socialReader.connect(issuer).queryFeeBulk(
        issuer.address,
        issuer.address,
        [ethers.utils.id('COUNTRY')]
      )
      expect(fee.toString()).eql('1200000000000000')

      fee = await socialReader.connect(issuer).queryFeeBulk(
        issuer.address,
        issuer.address,
        [ethers.utils.id('IS_BUSINESS')]
      )
      expect(fee.toString()).eql('0')

      fee = await socialReader.connect(issuer).queryFeeBulk(
        issuer.address,
        issuer.address,
        [ethers.utils.id('COUNTRY'), ethers.utils.id('IS_BUSINESS')]
      )
      expect(fee.toString()).eql('1200000000000000')
    });

    it('returns correct fee for combined attributes', async () =>{
      await socialReader.connect(issuer).setQueryFee(ethers.utils.id('RANDOM'), baseFee)

      const fee = await socialReader.connect(issuer).queryFeeBulk(
        issuer.address,
        issuer.address,
        [ethers.utils.id('RANDOM'), ethers.utils.id('COUNTRY'), ethers.utils.id('IS_BUSINESS')]
      )
      expect(fee.toString()).eql('6200000000000007')
    });
  });
});
