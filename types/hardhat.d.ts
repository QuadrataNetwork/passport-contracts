/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "AccessControlEnumerableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.AccessControlEnumerableUpgradeable__factory>;
    getContractFactory(
      name: "AccessControlUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.AccessControlUpgradeable__factory>;
    getContractFactory(
      name: "IAccessControlEnumerableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IAccessControlEnumerableUpgradeable__factory>;
    getContractFactory(
      name: "IAccessControlUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IAccessControlUpgradeable__factory>;
    getContractFactory(
      name: "IERC1822ProxiableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1822ProxiableUpgradeable__factory>;
    getContractFactory(
      name: "IBeaconUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IBeaconUpgradeable__factory>;
    getContractFactory(
      name: "ERC1967UpgradeUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1967UpgradeUpgradeable__factory>;
    getContractFactory(
      name: "Initializable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Initializable__factory>;
    getContractFactory(
      name: "UUPSUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UUPSUpgradeable__factory>;
    getContractFactory(
      name: "PausableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.PausableUpgradeable__factory>;
    getContractFactory(
      name: "ReentrancyGuardUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ReentrancyGuardUpgradeable__factory>;
    getContractFactory(
      name: "IERC1155MetadataURIUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155MetadataURIUpgradeable__factory>;
    getContractFactory(
      name: "IERC1155Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155Upgradeable__factory>;
    getContractFactory(
      name: "IERC20PermitUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20PermitUpgradeable__factory>;
    getContractFactory(
      name: "IERC20MetadataUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20MetadataUpgradeable__factory>;
    getContractFactory(
      name: "IERC20Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Upgradeable__factory>;
    getContractFactory(
      name: "ContextUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ContextUpgradeable__factory>;
    getContractFactory(
      name: "ERC165Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC165Upgradeable__factory>;
    getContractFactory(
      name: "IERC165Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC165Upgradeable__factory>;
    getContractFactory(
      name: "IAllowList",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IAllowList__factory>;
    getContractFactory(
      name: "IQuadGovernance",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IQuadGovernance__factory>;
    getContractFactory(
      name: "IQuadPassport",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IQuadPassport__factory>;
    getContractFactory(
      name: "IQuadReader",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IQuadReader__factory>;
    getContractFactory(
      name: "IQuadSoulbound",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IQuadSoulbound__factory>;
    getContractFactory(
      name: "QuadGovernance",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadGovernance__factory>;
    getContractFactory(
      name: "QuadPassport",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadPassport__factory>;
    getContractFactory(
      name: "QuadReader",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadReader__factory>;
    getContractFactory(
      name: "QuadSoulbound",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadSoulbound__factory>;
    getContractFactory(
      name: "QuadConstant",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadConstant__factory>;
    getContractFactory(
      name: "QuadGovernanceStore",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadGovernanceStore__factory>;
    getContractFactory(
      name: "QuadPassportStore",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadPassportStore__factory>;
    getContractFactory(
      name: "QuadReaderStore",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadReaderStore__factory>;
    getContractFactory(
      name: "DeFi",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.DeFi__factory>;
    getContractFactory(
      name: "MockBusiness",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MockBusiness__factory>;
    getContractFactory(
      name: "ERC1155Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155Upgradeable__factory>;
    getContractFactory(
      name: "ERC1155BurnableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155BurnableUpgradeable__factory>;
    getContractFactory(
      name: "ERC1155PausableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155PausableUpgradeable__factory>;
    getContractFactory(
      name: "ERC1155SupplyUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155SupplyUpgradeable__factory>;
    getContractFactory(
      name: "IERC1155MetadataURIUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155MetadataURIUpgradeable__factory>;
    getContractFactory(
      name: "IERC1155ReceiverUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155ReceiverUpgradeable__factory>;
    getContractFactory(
      name: "IERC1155Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC1155Upgradeable__factory>;
    getContractFactory(
      name: "ERC1155PresetMinterPauserUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155PresetMinterPauserUpgradeable__factory>;
    getContractFactory(
      name: "ERC1155HolderUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155HolderUpgradeable__factory>;
    getContractFactory(
      name: "ERC1155ReceiverUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1155ReceiverUpgradeable__factory>;
    getContractFactory(
      name: "IQuadGovernanceOld",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IQuadGovernanceOld__factory>;
    getContractFactory(
      name: "IQuadPassportOld",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IQuadPassportOld__factory>;
    getContractFactory(
      name: "IQuadReaderOld",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IQuadReaderOld__factory>;
    getContractFactory(
      name: "IUniswapAnchoredView",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IUniswapAnchoredView__factory>;
    getContractFactory(
      name: "QuadGovernanceOld",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadGovernanceOld__factory>;
    getContractFactory(
      name: "QuadPassportOld",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadPassportOld__factory>;
    getContractFactory(
      name: "QuadReaderOld",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadReaderOld__factory>;
    getContractFactory(
      name: "QuadGovernanceStoreOld",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadGovernanceStoreOld__factory>;
    getContractFactory(
      name: "QuadPassportStoreOld",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadPassportStoreOld__factory>;
    getContractFactory(
      name: "QuadReaderStoreOld",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadReaderStoreOld__factory>;
    getContractFactory(
      name: "QuadGovernanceUpgrade",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadGovernanceUpgrade__factory>;
    getContractFactory(
      name: "QuadPassportUpgrade",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadPassportUpgrade__factory>;
    getContractFactory(
      name: "QuadReaderUpgrade",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QuadReaderUpgrade__factory>;
    getContractFactory(
      name: "TestQuadrata",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TestQuadrata__factory>;

    getContractAt(
      name: "AccessControlEnumerableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.AccessControlEnumerableUpgradeable>;
    getContractAt(
      name: "AccessControlUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.AccessControlUpgradeable>;
    getContractAt(
      name: "IAccessControlEnumerableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IAccessControlEnumerableUpgradeable>;
    getContractAt(
      name: "IAccessControlUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IAccessControlUpgradeable>;
    getContractAt(
      name: "IERC1822ProxiableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1822ProxiableUpgradeable>;
    getContractAt(
      name: "IBeaconUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IBeaconUpgradeable>;
    getContractAt(
      name: "ERC1967UpgradeUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1967UpgradeUpgradeable>;
    getContractAt(
      name: "Initializable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Initializable>;
    getContractAt(
      name: "UUPSUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.UUPSUpgradeable>;
    getContractAt(
      name: "PausableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.PausableUpgradeable>;
    getContractAt(
      name: "ReentrancyGuardUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ReentrancyGuardUpgradeable>;
    getContractAt(
      name: "IERC1155MetadataURIUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155MetadataURIUpgradeable>;
    getContractAt(
      name: "IERC1155Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155Upgradeable>;
    getContractAt(
      name: "IERC20PermitUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20PermitUpgradeable>;
    getContractAt(
      name: "IERC20MetadataUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20MetadataUpgradeable>;
    getContractAt(
      name: "IERC20Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Upgradeable>;
    getContractAt(
      name: "ContextUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ContextUpgradeable>;
    getContractAt(
      name: "ERC165Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC165Upgradeable>;
    getContractAt(
      name: "IERC165Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC165Upgradeable>;
    getContractAt(
      name: "IAllowList",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IAllowList>;
    getContractAt(
      name: "IQuadGovernance",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IQuadGovernance>;
    getContractAt(
      name: "IQuadPassport",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IQuadPassport>;
    getContractAt(
      name: "IQuadReader",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IQuadReader>;
    getContractAt(
      name: "IQuadSoulbound",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IQuadSoulbound>;
    getContractAt(
      name: "QuadGovernance",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadGovernance>;
    getContractAt(
      name: "QuadPassport",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadPassport>;
    getContractAt(
      name: "QuadReader",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadReader>;
    getContractAt(
      name: "QuadSoulbound",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadSoulbound>;
    getContractAt(
      name: "QuadConstant",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadConstant>;
    getContractAt(
      name: "QuadGovernanceStore",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadGovernanceStore>;
    getContractAt(
      name: "QuadPassportStore",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadPassportStore>;
    getContractAt(
      name: "QuadReaderStore",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadReaderStore>;
    getContractAt(
      name: "DeFi",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.DeFi>;
    getContractAt(
      name: "MockBusiness",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MockBusiness>;
    getContractAt(
      name: "ERC1155Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155Upgradeable>;
    getContractAt(
      name: "ERC1155BurnableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155BurnableUpgradeable>;
    getContractAt(
      name: "ERC1155PausableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155PausableUpgradeable>;
    getContractAt(
      name: "ERC1155SupplyUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155SupplyUpgradeable>;
    getContractAt(
      name: "IERC1155MetadataURIUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155MetadataURIUpgradeable>;
    getContractAt(
      name: "IERC1155ReceiverUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155ReceiverUpgradeable>;
    getContractAt(
      name: "IERC1155Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC1155Upgradeable>;
    getContractAt(
      name: "ERC1155PresetMinterPauserUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155PresetMinterPauserUpgradeable>;
    getContractAt(
      name: "ERC1155HolderUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155HolderUpgradeable>;
    getContractAt(
      name: "ERC1155ReceiverUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1155ReceiverUpgradeable>;
    getContractAt(
      name: "IQuadGovernanceOld",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IQuadGovernanceOld>;
    getContractAt(
      name: "IQuadPassportOld",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IQuadPassportOld>;
    getContractAt(
      name: "IQuadReaderOld",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IQuadReaderOld>;
    getContractAt(
      name: "IUniswapAnchoredView",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IUniswapAnchoredView>;
    getContractAt(
      name: "QuadGovernanceOld",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadGovernanceOld>;
    getContractAt(
      name: "QuadPassportOld",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadPassportOld>;
    getContractAt(
      name: "QuadReaderOld",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadReaderOld>;
    getContractAt(
      name: "QuadGovernanceStoreOld",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadGovernanceStoreOld>;
    getContractAt(
      name: "QuadPassportStoreOld",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadPassportStoreOld>;
    getContractAt(
      name: "QuadReaderStoreOld",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadReaderStoreOld>;
    getContractAt(
      name: "QuadGovernanceUpgrade",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadGovernanceUpgrade>;
    getContractAt(
      name: "QuadPassportUpgrade",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadPassportUpgrade>;
    getContractAt(
      name: "QuadReaderUpgrade",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QuadReaderUpgrade>;
    getContractAt(
      name: "TestQuadrata",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TestQuadrata>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}
