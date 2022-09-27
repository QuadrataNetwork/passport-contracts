/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { SelfDestruct, SelfDestructInterface } from "../SelfDestruct";

const _abi = [
  {
    inputs: [
      {
        internalType: "address payable",
        name: "_treasury",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "dangerZone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5060405161016a38038061016a83398101604081905261002f91610054565b600080546001600160a01b0319166001600160a01b0392909216919091179055610084565b60006020828403121561006657600080fd5b81516001600160a01b038116811461007d57600080fd5b9392505050565b60d8806100926000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806361d027b3146037578063c7af5f6a14607f575b600080fd5b60005460569073ffffffffffffffffffffffffffffffffffffffff1681565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b60856087565b005b60005473ffffffffffffffffffffffffffffffffffffffff16fffea2646970667358221220c63233ff63a519e0293ccf6ed32a33daa87c82d9100a431495db8d752f8a494c64736f6c63430008100033";

export class SelfDestruct__factory extends ContractFactory {
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
    _treasury: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<SelfDestruct> {
    return super.deploy(_treasury, overrides || {}) as Promise<SelfDestruct>;
  }
  getDeployTransaction(
    _treasury: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_treasury, overrides || {});
  }
  attach(address: string): SelfDestruct {
    return super.attach(address) as SelfDestruct;
  }
  connect(signer: Signer): SelfDestruct__factory {
    return super.connect(signer) as SelfDestruct__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): SelfDestructInterface {
    return new utils.Interface(_abi) as SelfDestructInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SelfDestruct {
    return new Contract(address, _abi, signerOrProvider) as SelfDestruct;
  }
}
