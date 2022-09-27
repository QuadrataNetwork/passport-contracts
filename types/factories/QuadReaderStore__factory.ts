/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  QuadReaderStore,
  QuadReaderStoreInterface,
} from "../QuadReaderStore";

const _abi = [
  {
    inputs: [],
    name: "DIGEST_TO_SIGN",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "GOVERNANCE_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ISSUER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PAUSER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "READER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "governance",
    outputs: [
      {
        internalType: "contract IQuadGovernance",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "passport",
    outputs: [
      {
        internalType: "contract IQuadPassport",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506101f3806100206000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c806382aefa241161005b57806382aefa2414610121578063e63ab1e914610148578063f36c8f5c1461016f578063f51a01e31461019657600080fd5b806317ba9c4d14610082578063458c4458146100cc5780635aa6e67514610101575b600080fd5b6030546100a29073ffffffffffffffffffffffffffffffffffffffff1681565b60405173ffffffffffffffffffffffffffffffffffffffff90911681526020015b60405180910390f35b6100f37fc757f485a2bb9eadbad5c86f7618c2a7a2ecb41b29f8610fb0e8bea3ed5ab6cf81565b6040519081526020016100c3565b602f546100a29073ffffffffffffffffffffffffffffffffffffffff1681565b6100f37f114e74f6ea3bd819998f78687bfcb11b140da08e9b7d222fa9c1f1ba1f2aa12281565b6100f37f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a81565b6100f37f71840dc4906352362b0cdaf79870196c8e42acafade72d5d5a6d59291253ceb181565b6100f37f37937bf5ff1ecbf00bbd389ab7ca9a190d7e8c0a084b2893ece7923be1d2ec858156fea264697066735822122046749c368552ebb19c15213680c843c5a210654f3a2f8d889775c3d719d22f8e64736f6c63430008100033";

export class QuadReaderStore__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<QuadReaderStore> {
    return super.deploy(overrides || {}) as Promise<QuadReaderStore>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): QuadReaderStore {
    return super.attach(address) as QuadReaderStore;
  }
  connect(signer: Signer): QuadReaderStore__factory {
    return super.connect(signer) as QuadReaderStore__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): QuadReaderStoreInterface {
    return new utils.Interface(_abi) as QuadReaderStoreInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): QuadReaderStore {
    return new Contract(address, _abi, signerOrProvider) as QuadReaderStore;
  }
}
