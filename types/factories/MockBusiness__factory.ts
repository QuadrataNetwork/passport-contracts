/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { MockBusiness, MockBusinessInterface } from "../MockBusiness";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_defi",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32[]",
        name: "attrValues",
        type: "bytes32[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "epochs",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "address[]",
        name: "issuers",
        type: "address[]",
      },
    ],
    name: "GetAttributesBulkEventBusiness",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32[]",
        name: "attrValues",
        type: "bytes32[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "epochs",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "address[]",
        name: "issuers",
        type: "address[]",
      },
    ],
    name: "GetAttributesEventBusiness",
    type: "event",
  },
  {
    inputs: [],
    name: "burnPassports",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "defi",
    outputs: [
      {
        internalType: "contract DeFi",
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
        internalType: "bytes32",
        name: "_attribute",
        type: "bytes32",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32[]",
        name: "_attributes",
        type: "bytes32[]",
      },
    ],
    name: "depositBulk",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32[]",
        name: "_attributes",
        type: "bytes32[]",
      },
    ],
    name: "depositBulkLegacy",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_attribute",
        type: "bytes32",
      },
    ],
    name: "depositLegacy",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5060405161106d38038061106d83398101604081905261002f91610054565b600080546001600160a01b0319166001600160a01b0392909216919091179055610084565b60006020828403121561006657600080fd5b81516001600160a01b038116811461007d57600080fd5b9392505050565b610fda806100936000396000f3fe6080604052600436106100655760003560e01c8063732ea69111610043578063732ea691146100ea578063b214faa5146100fd578063ffa34c011461011057600080fd5b8063171adb551461006a578063258db4441461007f57806338c0f07314610094575b600080fd5b61007d6100783660046109b0565b610123565b005b34801561008b57600080fd5b5061007d6103ee565b3480156100a057600080fd5b506000546100c19073ffffffffffffffffffffffffffffffffffffffff1681565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b61007d6100f8366004610a25565b6104de565b61007d61010b366004610a25565b6105e9565b61007d61011e3660046109b0565b6108b1565b600080546040517f8f867e4800000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff90911690638f867e4890349061018090309088908890600401610a3e565b60006040518083038185885af115801561019e573d6000803e3d6000fd5b50505050506040513d6000823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682016040526101e59190810190610b9d565b90506000815167ffffffffffffffff81111561020357610203610aad565b60405190808252806020026020018201604052801561022c578160200160208202803683370190505b5090506000825167ffffffffffffffff81111561024b5761024b610aad565b604051908082528060200260200182016040528015610274578160200160208202803683370190505b5090506000835167ffffffffffffffff81111561029357610293610aad565b6040519080825280602002602001820160405280156102bc578160200160208202803683370190505b50905060005b84518110156103aa578481815181106102dd576102dd610c69565b6020026020010151600001518482815181106102fb576102fb610c69565b60200260200101818152505084818151811061031957610319610c69565b60200260200101516020015183828151811061033757610337610c69565b60200260200101818152505084818151811061035557610355610c69565b60200260200101516040015182828151811061037357610373610c69565b73ffffffffffffffffffffffffffffffffffffffff90921660209283029190910190910152806103a281610c98565b9150506102c2565b507fd59510f9b997e9f992e89e2acce2cdd7ed04aaec02b80cdebf919731b7a22a238383836040516103de93929190610d48565b60405180910390a1505050505050565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166317ba9c4d6040518163ffffffff1660e01b8152600401602060405180830381865afa158015610459573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061047d9190610dd6565b73ffffffffffffffffffffffffffffffffffffffff1663258db4446040518163ffffffff1660e01b8152600401600060405180830381600087803b1580156104c457600080fd5b505af11580156104d8573d6000803e3d6000fd5b50505050565b600080546040517f97b2670b000000000000000000000000000000000000000000000000000000008152306004820152602481018490528291829173ffffffffffffffffffffffffffffffffffffffff909116906397b2670b90349060440160006040518083038185885af115801561055b573d6000803e3d6000fd5b50505050506040513d6000823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682016040526105a29190810190610ec4565b9250925092507f879b5404b1399f81354a6ab46e13705cbe1c4771a473ea83811fa04fa295e5cd8383836040516105db93929190610d48565b60405180910390a150505050565b600080546040517fb9e1aa030000000000000000000000000000000000000000000000000000000081523060048201526024810184905273ffffffffffffffffffffffffffffffffffffffff9091169063b9e1aa0390349060440160006040518083038185885af1158015610662573d6000803e3d6000fd5b50505050506040513d6000823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682016040526106a99190810190610b9d565b90506000815167ffffffffffffffff8111156106c7576106c7610aad565b6040519080825280602002602001820160405280156106f0578160200160208202803683370190505b5090506000825167ffffffffffffffff81111561070f5761070f610aad565b604051908082528060200260200182016040528015610738578160200160208202803683370190505b5090506000835167ffffffffffffffff81111561075757610757610aad565b604051908082528060200260200182016040528015610780578160200160208202803683370190505b50905060005b845181101561086e578481815181106107a1576107a1610c69565b6020026020010151600001518482815181106107bf576107bf610c69565b6020026020010181815250508481815181106107dd576107dd610c69565b6020026020010151602001518382815181106107fb576107fb610c69565b60200260200101818152505084818151811061081957610819610c69565b60200260200101516040015182828151811061083757610837610c69565b73ffffffffffffffffffffffffffffffffffffffff909216602092830291909101909101528061086681610c98565b915050610786565b507f879b5404b1399f81354a6ab46e13705cbe1c4771a473ea83811fa04fa295e5cd8383836040516108a293929190610d48565b60405180910390a15050505050565b600080546040517f1a0d13f50000000000000000000000000000000000000000000000000000000081528291829173ffffffffffffffffffffffffffffffffffffffff90911690631a0d13f59034906109129030908a908a90600401610a3e565b60006040518083038185885af1158015610930573d6000803e3d6000fd5b50505050506040513d6000823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682016040526109779190810190610ec4565b9250925092507fd59510f9b997e9f992e89e2acce2cdd7ed04aaec02b80cdebf919731b7a22a238383836040516108a293929190610d48565b600080602083850312156109c357600080fd5b823567ffffffffffffffff808211156109db57600080fd5b818501915085601f8301126109ef57600080fd5b8135818111156109fe57600080fd5b8660208260051b8501011115610a1357600080fd5b60209290920196919550909350505050565b600060208284031215610a3757600080fd5b5035919050565b73ffffffffffffffffffffffffffffffffffffffff841681526040602082015281604082015260007f07ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff831115610a9357600080fd5b8260051b8085606085013791909101606001949350505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6040516060810167ffffffffffffffff81118282101715610aff57610aff610aad565b60405290565b604051601f82017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016810167ffffffffffffffff81118282101715610b4c57610b4c610aad565b604052919050565b600067ffffffffffffffff821115610b6e57610b6e610aad565b5060051b60200190565b73ffffffffffffffffffffffffffffffffffffffff81168114610b9a57600080fd5b50565b60006020808385031215610bb057600080fd5b825167ffffffffffffffff811115610bc757600080fd5b8301601f81018513610bd857600080fd5b8051610beb610be682610b54565b610b05565b81815260609182028301840191848201919088841115610c0a57600080fd5b938501935b83851015610c5d5780858a031215610c275760008081fd5b610c2f610adc565b855181528686015187820152604080870151610c4a81610b78565b9082015283529384019391850191610c0f565b50979650505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203610cf0577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b5060010190565b600081518084526020808501945080840160005b83811015610d3d57815173ffffffffffffffffffffffffffffffffffffffff1687529582019590820190600101610d0b565b509495945050505050565b606080825284519082018190526000906020906080840190828801845b82811015610d8157815184529284019290840190600101610d65565b5050508381038285015285518082528683019183019060005b81811015610db657835183529284019291840191600101610d9a565b50508481036040860152610dca8187610cf7565b98975050505050505050565b600060208284031215610de857600080fd5b8151610df381610b78565b9392505050565b600082601f830112610e0b57600080fd5b81516020610e1b610be683610b54565b82815260059290921b84018101918181019086841115610e3a57600080fd5b8286015b84811015610e555780518352918301918301610e3e565b509695505050505050565b600082601f830112610e7157600080fd5b81516020610e81610be683610b54565b82815260059290921b84018101918181019086841115610ea057600080fd5b8286015b84811015610e55578051610eb781610b78565b8352918301918301610ea4565b600080600060608486031215610ed957600080fd5b835167ffffffffffffffff80821115610ef157600080fd5b818601915086601f830112610f0557600080fd5b81516020610f15610be683610b54565b82815260059290921b8401810191818101908a841115610f3457600080fd5b948201945b83861015610f5257855182529482019490820190610f39565b91890151919750909350505080821115610f6b57600080fd5b610f7787838801610dfa565b93506040860151915080821115610f8d57600080fd5b50610f9a86828701610e60565b915050925092509256fea2646970667358221220669db975e36c4e5b17515fffe419a1f13d6fe4498723e946c2d596c86157810364736f6c63430008100033";

export class MockBusiness__factory extends ContractFactory {
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
    _defi: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<MockBusiness> {
    return super.deploy(_defi, overrides || {}) as Promise<MockBusiness>;
  }
  getDeployTransaction(
    _defi: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_defi, overrides || {});
  }
  attach(address: string): MockBusiness {
    return super.attach(address) as MockBusiness;
  }
  connect(signer: Signer): MockBusiness__factory {
    return super.connect(signer) as MockBusiness__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockBusinessInterface {
    return new utils.Interface(_abi) as MockBusinessInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MockBusiness {
    return new Contract(address, _abi, signerOrProvider) as MockBusiness;
  }
}
