/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { QuadConstant, QuadConstantInterface } from "../QuadConstant";

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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610177806100206000396000f3fe608060405234801561001057600080fd5b50600436106100675760003560e01c8063e63ab1e911610050578063e63ab1e9146100cc578063f36c8f5c146100f3578063f51a01e31461011a57600080fd5b8063458c44581461006c57806382aefa24146100a5575b600080fd5b6100937fc757f485a2bb9eadbad5c86f7618c2a7a2ecb41b29f8610fb0e8bea3ed5ab6cf81565b60405190815260200160405180910390f35b6100937f114e74f6ea3bd819998f78687bfcb11b140da08e9b7d222fa9c1f1ba1f2aa12281565b6100937f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a81565b6100937f71840dc4906352362b0cdaf79870196c8e42acafade72d5d5a6d59291253ceb181565b6100937f37937bf5ff1ecbf00bbd389ab7ca9a190d7e8c0a084b2893ece7923be1d2ec858156fea2646970667358221220e3f2af481e96f1ff1e3c87860b542f8fb1e6f3d81736d0191b17d4ac38f8af1064736f6c63430008100033";

export class QuadConstant__factory extends ContractFactory {
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
  ): Promise<QuadConstant> {
    return super.deploy(overrides || {}) as Promise<QuadConstant>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): QuadConstant {
    return super.attach(address) as QuadConstant;
  }
  connect(signer: Signer): QuadConstant__factory {
    return super.connect(signer) as QuadConstant__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): QuadConstantInterface {
    return new utils.Interface(_abi) as QuadConstantInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): QuadConstant {
    return new Contract(address, _abi, signerOrProvider) as QuadConstant;
  }
}
