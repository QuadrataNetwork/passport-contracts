// it("success - mint a business passport for a smart contract owned account", async () => {
//   const newIsBusiness = id("TRUE");
//   const DeFi = await ethers.getContractFactory("DeFi");
//   const defi = await DeFi.deploy(passport.address, reader.address);
//   await defi.deployed();
//   const sig = await signMint(
//     issuer,
//     mockBusiness,
//     TOKEN_ID,
//     did,
//     aml,
//     country,
//     newIsBusiness,
//     issuedAt
//   );
//   expect(await passport.balanceOf(mockBusiness.address, 1)).equals(0);
//   const protocolTreasury = (await governance.config()).treasury;
//   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
//     "NOT_ENOUGH_BALANCE"
//   );
//   await expect(
//     passport.withdraw(issuerTreasury.address)
//   ).to.be.revertedWith("NOT_ENOUGH_BALANCE");
//   const promise = passport
//     .connect(minterA)
//     .mintPassport(
//       [
//         mockBusiness.address,
//         TOKEN_ID,
//         did,
//         aml,
//         country,
//         newIsBusiness,
//         issuedAt,
//       ],
//       sig,
//       "0x00",
//       {
//         value: MINT_PRICE,
//       }
//     );
//   await promise;
//   expect(await passport.balanceOf(mockBusiness.address, 1)).equals(1);
//   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
//     "NOT_ENOUGH_BALANCE"
//   );
//   const response = await passport.callStatic.withdraw(
//     issuerTreasury.address
//   );
//   expect(response).to.equals(MINT_PRICE);
// });
// it("success - mint a business passport for an EAO", async () => {
//   const newIsBusiness = id("TRUE");
//   const sig = await signMint(
//     issuer,
//     minterA,
//     TOKEN_ID,
//     did,
//     aml,
//     country,
//     newIsBusiness,
//     issuedAt
//   );
//   const sigAccount = await signMessage(minterA, minterA.address);
//   expect(await passport.balanceOf(minterA.address, 1)).equals(0);
//   const protocolTreasury = (await governance.config()).treasury;
//   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
//     "NOT_ENOUGH_BALANCE"
//   );
//   await expect(
//     passport.withdraw(issuerTreasury.address)
//   ).to.not.be.revertedWith("NOT_ENOUGH_BALANCE");
//   const promise = passport
//     .connect(minterA)
//     .mintPassport(
//       [
//         minterA.address,
//         TOKEN_ID,
//         did,
//         aml,
//         country,
//         newIsBusiness,
//         issuedAt,
//       ],
//       sig,
//       sigAccount,
//       {
//         value: MINT_PRICE,
//       }
//     );
//   await promise;
//   expect(await passport.balanceOf(mockBusiness.address, 1)).equals(1);
//   await expect(passport.withdraw(protocolTreasury)).to.be.revertedWith(
//     "NOT_ENOUGH_BALANCE"
//   );
//   const response = await passport.callStatic.withdraw(
//     issuerTreasury.address
//   );
//   expect(response).to.equals(MINT_PRICE);
// });
