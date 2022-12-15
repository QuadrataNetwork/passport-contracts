const { ethers, upgrades } = require('hardhat');
import { expect } from 'chai';
import { Contract } from 'ethers';
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
  const baseQueryFee = '50000000000000000';

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
    [baseQueryFee, governance.address, reader.address],
    {
      initializer: 'initialize',
      kind: 'uups',
      unsafeAllow: ['constructor'],
    });

    await socialReader.deployed();

  });

  describe('writeAttributes()', function() {
    it('fails if issuer is not allowed', async () => {
      await expect(
        socialReader.connect(issuer).writeAttributes(ethers.utils.id('RANDOM_ATTR'), ethers.utils.id('RANDOM-VALUE'), treasury.address)
      ).to.be.revertedWith('NOT_ALLOWED');
    });

    it('succeeds', async () => {
      socialReader.connect(treasury).allowAddress(issuer.address, true);
      socialReader.connect(issuer).writeAttributes(ethers.utils.id('RANDOM_ATTR'), ethers.utils.id('RANDOM-VALUE'), treasury.address)
    });
  });

  describe('queryFee()', function() {
    it.only('returns baseQueryFee for invalid attributes', async () =>{
      const fee = await socialReader.connect(issuer).queryFee(issuer.address, issuer.address, [ethers.utils.id('RANDOM')])
      expect(fee.toString()).eql(baseQueryFee)
    });
  });
});
