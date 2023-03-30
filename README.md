# Quadrata Web3 Passport

This project is a privacy-preserving, sybil-resistant technology that brings identity, compliance, and reputation to DApps built on public blockchains.

# How it works

Businesses and consumers onboard onto Quadrata by attaching their wallets to an identity passport. The Quadrata Passport is issued as a non-transferrable NFT (ERC1155).
DApps integrated with Quadrata can check passport attributes to verify:
- If the user has a passport.
- If the user owns more than one wallet.
- The user's AML risk score.
- From which country the government id was issued.

# Instructions on how to install locally

```shell
npm install
npx hardhat test
```

# Instructions on how to deploy on testnets
1. Set Environment variable: 
```
cp .env.example .env
```
2. Deploy to testnet (/!\ /!\ Always deploy with a dummy account prior of using the official Quadrata testnet deployer account - this is because we want to make sure nonces align and because of proxy contract, they might get skipped and cause a nonce disconnect /!\ /!\)
```
npx hardhat run scripts/deployment/passport/deployTestnet.ts --network <NETWORK>
```
3. Verify on etherscan
```
npx hardhat verify --network <NETWORK> <ADDRESS>
```

# Gitbook Link for additional instructions
For more advanced development details see [the documentation](https://docs.quadrata.com).

# Social Media
- [Discord](https://discord.gg/67QgzrymHW)
- [Twitter](https://twitter.com/QuadrataNetwork)
