/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  QuadPassportStoreOld,
  QuadPassportStoreOldInterface,
} from "../QuadPassportStoreOld";

const _abi = [
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
        internalType: "contract IQuadGovernanceOld",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pendingGovernance",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610308806100206000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c806382aefa241161005b57806382aefa241461011a57806395d89b4114610141578063f36c8f5c14610149578063f39c38a01461017057600080fd5b806306fdde0314610082578063458c4458146100a05780635aa6e675146100d5575b600080fd5b61008a610190565b604051610097919061022b565b60405180910390f35b6100c77fc757f485a2bb9eadbad5c86f7618c2a7a2ecb41b29f8610fb0e8bea3ed5ab6cf81565b604051908152602001610097565b6000546100f59073ffffffffffffffffffffffffffffffffffffffff1681565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610097565b6100c77f114e74f6ea3bd819998f78687bfcb11b140da08e9b7d222fa9c1f1ba1f2aa12281565b61008a61021e565b6100c77f71840dc4906352362b0cdaf79870196c8e42acafade72d5d5a6d59291253ceb181565b6001546100f59073ffffffffffffffffffffffffffffffffffffffff1681565b6008805461019d9061027e565b80601f01602080910402602001604051908101604052809291908181526020018280546101c99061027e565b80156102165780601f106101eb57610100808354040283529160200191610216565b820191906000526020600020905b8154815290600101906020018083116101f957829003601f168201915b505050505081565b6007805461019d9061027e565b6000602080835283518082850152825b818110156102575785810183015185820160400152820161023b565b818111156102685783604083870101525b50601f01601f1916929092016040019392505050565b600181811c9082168061029257607f821691505b602082108114156102cc577f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b5091905056fea26469706673582212204cdc8c5cda61f5d001574448cd3f91305f007ca556df6495f4b2db62f90c355964736f6c63430008040033";

export class QuadPassportStoreOld__factory extends ContractFactory {
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
  ): Promise<QuadPassportStoreOld> {
    return super.deploy(overrides || {}) as Promise<QuadPassportStoreOld>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): QuadPassportStoreOld {
    return super.attach(address) as QuadPassportStoreOld;
  }
  connect(signer: Signer): QuadPassportStoreOld__factory {
    return super.connect(signer) as QuadPassportStoreOld__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): QuadPassportStoreOldInterface {
    return new utils.Interface(_abi) as QuadPassportStoreOldInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): QuadPassportStoreOld {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as QuadPassportStoreOld;
  }
}
