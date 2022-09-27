/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { TestQuadrata, TestQuadrataInterface } from "../TestQuadrata";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "admin",
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
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_attribute",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "_epoch",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "i",
        type: "uint256",
      },
    ],
    name: "checkBeforeEpoch",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_attribute",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "_issuer",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "i",
        type: "uint256",
      },
    ],
    name: "checkIssuer",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_attribute",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "_number",
        type: "uint256",
      },
    ],
    name: "checkNumberAttributes",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_attribute",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_value",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "i",
        type: "uint256",
      },
    ],
    name: "checkValues",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_attribute",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "_value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "i",
        type: "uint256",
      },
    ],
    name: "checkValuesInt",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "reader",
    outputs: [
      {
        internalType: "contract IQuadReader",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_reader",
        type: "address",
      },
    ],
    name: "setReader",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50600080546001600160a01b03191633179055611013806100326000396000f3fe60806040526004361061007b5760003560e01c8063969a29571161004e578063969a29571461011d578063d4fc42c614610130578063ed6a99d514610186578063f851a4401461019957600080fd5b80632361e8cc146100805780636db0f558146100955780637e62344e146100a85780639598da7f146100bb575b600080fd5b61009361008e366004610d53565b6101c6565b005b6100936100a3366004610d53565b610424565b6100936100b6366004610d8e565b610677565b3480156100c757600080fd5b506100936100d6366004610dc3565b600180547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055565b61009361012b366004610de7565b610862565b34801561013c57600080fd5b5060015461015d9073ffffffffffffffffffffffffffffffffffffffff1681565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b610093610194366004610d53565b610ade565b3480156101a557600080fd5b5060005461015d9073ffffffffffffffffffffffffffffffffffffffff1681565b6001546040517ffa1f05e900000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff868116600483015260248201869052600092169063fa1f05e990604401602060405180830381865afa15801561023e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102629190610e2f565b9050803410156102b95760405162461bcd60e51b815260206004820152600e60248201527f4e4f545f454e4f5547485f46454500000000000000000000000000000000000060448201526064015b60405180910390fd5b6001546040517f2a5963e100000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8781166004830152602482018790526000921690632a5963e190849060440160006040518083038185885af1158015610334573d6000803e3d6000fd5b50505050506040513d6000823e601f3d908101601f1916820160405261035d9190810190610ed1565b9050828151116103af5760405162461bcd60e51b815260206004820152601260248201527f4e4f5f4154545249425554455f464f554e44000000000000000000000000000060448201526064016102b0565b838184815181106103c2576103c2610fae565b602002602001015160200151111561041c5760405162461bcd60e51b815260206004820152600e60248201527f4d49534d415443485f45504f434800000000000000000000000000000000000060448201526064016102b0565b505050505050565b6001546040517ffa1f05e900000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff868116600483015260248201869052600092169063fa1f05e990604401602060405180830381865afa15801561049c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104c09190610e2f565b9050803410156105125760405162461bcd60e51b815260206004820152600e60248201527f4e4f545f454e4f5547485f46454500000000000000000000000000000000000060448201526064016102b0565b6001546040517f2a5963e100000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8781166004830152602482018790526000921690632a5963e190849060440160006040518083038185885af115801561058d573d6000803e3d6000fd5b50505050506040513d6000823e601f3d908101601f191682016040526105b69190810190610ed1565b9050828151116106085760405162461bcd60e51b815260206004820152601260248201527f4e4f5f4154545249425554455f464f554e44000000000000000000000000000060448201526064016102b0565b8381848151811061061b5761061b610fae565b60200260200101516000015160001c1461041c5760405162461bcd60e51b815260206004820152600e60248201527f4d49534d415443485f56414c554500000000000000000000000000000000000060448201526064016102b0565b6001546040517ffa1f05e900000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff858116600483015260248201859052600092169063fa1f05e990604401602060405180830381865afa1580156106ef573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107139190610e2f565b9050803410156107655760405162461bcd60e51b815260206004820152600e60248201527f4e4f545f454e4f5547485f46454500000000000000000000000000000000000060448201526064016102b0565b6001546040517f2a5963e100000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8681166004830152602482018690526000921690632a5963e190849060440160006040518083038185885af11580156107e0573d6000803e3d6000fd5b50505050506040513d6000823e601f3d908101601f191682016040526108099190810190610ed1565b90508281511461085b5760405162461bcd60e51b815260206004820152601960248201527f494e56414c49445f4e554d4245525f415454524942555445530000000000000060448201526064016102b0565b5050505050565b6001546040517ffa1f05e900000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff868116600483015260248201869052600092169063fa1f05e990604401602060405180830381865afa1580156108da573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108fe9190610e2f565b9050803410156109505760405162461bcd60e51b815260206004820152600e60248201527f4e4f545f454e4f5547485f46454500000000000000000000000000000000000060448201526064016102b0565b6001546040517f2a5963e100000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8781166004830152602482018790526000921690632a5963e190849060440160006040518083038185885af11580156109cb573d6000803e3d6000fd5b50505050506040513d6000823e601f3d908101601f191682016040526109f49190810190610ed1565b905082815111610a465760405162461bcd60e51b815260206004820152601260248201527f4e4f5f4154545249425554455f464f554e44000000000000000000000000000060448201526064016102b0565b8373ffffffffffffffffffffffffffffffffffffffff16818481518110610a6f57610a6f610fae565b60200260200101516040015173ffffffffffffffffffffffffffffffffffffffff161461041c5760405162461bcd60e51b815260206004820152600f60248201527f4d49534d415443485f495353554552000000000000000000000000000000000060448201526064016102b0565b6001546040517ffa1f05e900000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff868116600483015260248201869052600092169063fa1f05e990604401602060405180830381865afa158015610b56573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610b7a9190610e2f565b905080341015610bcc5760405162461bcd60e51b815260206004820152600e60248201527f4e4f545f454e4f5547485f46454500000000000000000000000000000000000060448201526064016102b0565b6001546040517f2a5963e100000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8781166004830152602482018790526000921690632a5963e190849060440160006040518083038185885af1158015610c47573d6000803e3d6000fd5b50505050506040513d6000823e601f3d908101601f19168201604052610c709190810190610ed1565b905082815111610cc25760405162461bcd60e51b815260206004820152601260248201527f4e4f5f4154545249425554455f464f554e44000000000000000000000000000060448201526064016102b0565b83818481518110610cd557610cd5610fae565b6020026020010151600001511461041c5760405162461bcd60e51b815260206004820152600e60248201527f4d49534d415443485f56414c554500000000000000000000000000000000000060448201526064016102b0565b73ffffffffffffffffffffffffffffffffffffffff81168114610d5057600080fd5b50565b60008060008060808587031215610d6957600080fd5b8435610d7481610d2e565b966020860135965060408601359560600135945092505050565b600080600060608486031215610da357600080fd5b8335610dae81610d2e565b95602085013595506040909401359392505050565b600060208284031215610dd557600080fd5b8135610de081610d2e565b9392505050565b60008060008060808587031215610dfd57600080fd5b8435610e0881610d2e565b9350602085013592506040850135610e1f81610d2e565b9396929550929360600135925050565b600060208284031215610e4157600080fd5b5051919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6040516060810167ffffffffffffffff81118282101715610e9a57610e9a610e48565b60405290565b604051601f8201601f1916810167ffffffffffffffff81118282101715610ec957610ec9610e48565b604052919050565b60006020808385031215610ee457600080fd5b825167ffffffffffffffff80821115610efc57600080fd5b818501915085601f830112610f1057600080fd5b815181811115610f2257610f22610e48565b610f30848260051b01610ea0565b81815284810192506060918202840185019188831115610f4f57600080fd5b938501935b82851015610fa25780858a031215610f6c5760008081fd5b610f74610e77565b855181528686015187820152604080870151610f8f81610d2e565b9082015284529384019392850192610f54565b50979650505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fdfea2646970667358221220547a38a647d2a9211680ee18586c5cd5308d37104091689436bbdf023e2ad0aa64736f6c63430008100033";

export class TestQuadrata__factory extends ContractFactory {
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
  ): Promise<TestQuadrata> {
    return super.deploy(overrides || {}) as Promise<TestQuadrata>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): TestQuadrata {
    return super.attach(address) as TestQuadrata;
  }
  connect(signer: Signer): TestQuadrata__factory {
    return super.connect(signer) as TestQuadrata__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): TestQuadrataInterface {
    return new utils.Interface(_abi) as TestQuadrataInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): TestQuadrata {
    return new Contract(address, _abi, signerOrProvider) as TestQuadrata;
  }
}
