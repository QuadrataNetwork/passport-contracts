/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { DeFi, DeFiInterface } from "../DeFi";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_passport",
        type: "address",
      },
      {
        internalType: "contract QuadReader",
        name: "_reader",
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
    name: "GetAttributesBulkEvent",
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
    name: "GetAttributesEvent",
    type: "event",
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
    ],
    name: "deposit",
    outputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "value",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "issuer",
            type: "address",
          },
        ],
        internalType: "struct IQuadPassportStore.Attribute[]",
        name: "",
        type: "tuple[]",
      },
    ],
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
        internalType: "bytes32[]",
        name: "_attributes",
        type: "bytes32[]",
      },
    ],
    name: "depositBulk",
    outputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "value",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "issuer",
            type: "address",
          },
        ],
        internalType: "struct IQuadPassportStore.Attribute[]",
        name: "",
        type: "tuple[]",
      },
    ],
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
        internalType: "bytes32[]",
        name: "_attributes",
        type: "bytes32[]",
      },
    ],
    name: "depositBulkLegacy",
    outputs: [
      {
        internalType: "bytes32[]",
        name: "",
        type: "bytes32[]",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
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
    ],
    name: "depositLegacy",
    outputs: [
      {
        internalType: "bytes32[]",
        name: "",
        type: "bytes32[]",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "payable",
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
  {
    inputs: [],
    name: "reader",
    outputs: [
      {
        internalType: "contract QuadReader",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5060405161109538038061109583398101604081905261002f91610078565b600080546001600160a01b039384166001600160a01b031991821617909155600180549290931691161790556100b2565b6001600160a01b038116811461007557600080fd5b50565b6000806040838503121561008b57600080fd5b825161009681610060565b60208401519092506100a781610060565b809150509250929050565b610fd4806100c16000396000f3fe6080604052600436106100655760003560e01c806397b2670b1161004357806397b2670b14610103578063b9e1aa0314610116578063d4fc42c61461012957600080fd5b806317ba9c4d1461006a5780631a0d13f5146100c15780638f867e48146100e3575b600080fd5b34801561007657600080fd5b506000546100979073ffffffffffffffffffffffffffffffffffffffff1681565b60405173ffffffffffffffffffffffffffffffffffffffff90911681526020015b60405180910390f35b6100d46100cf36600461095e565b610156565b6040516100b893929190610a37565b6100f66100f136600461095e565b610275565b6040516100b89190610ac5565b6100d4610111366004610b34565b610549565b6100f6610124366004610b34565b610667565b34801561013557600080fd5b506001546100979073ffffffffffffffffffffffffffffffffffffffff1681565b6001546040517f91dc669f000000000000000000000000000000000000000000000000000000008152606091829182916000918291829173ffffffffffffffffffffffffffffffffffffffff909116906391dc669f9034906101c0908d908d908d90600401610b60565b60006040518083038185885af11580156101de573d6000803e3d6000fd5b50505050506040513d6000823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682016040526102259190810190610d69565b9250925092507fcbc30d216c0bf0ce4977b30da9208f213cf7dcc4b18d84938d49b3324d0eb3d483838360405161025e93929190610a37565b60405180910390a191989097509095509350505050565b6001546040517f5d79ed9b00000000000000000000000000000000000000000000000000000000815260609160009173ffffffffffffffffffffffffffffffffffffffff90911690635d79ed9b9034906102d790899089908990600401610b60565b60006040518083038185885af11580156102f5573d6000803e3d6000fd5b50505050506040513d6000823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016820160405261033c9190810190610e49565b90506000815167ffffffffffffffff81111561035a5761035a610bcf565b604051908082528060200260200182016040528015610383578160200160208202803683370190505b5090506000825167ffffffffffffffff8111156103a2576103a2610bcf565b6040519080825280602002602001820160405280156103cb578160200160208202803683370190505b5090506000835167ffffffffffffffff8111156103ea576103ea610bcf565b604051908082528060200260200182016040528015610413578160200160208202803683370190505b50905060005b84518110156105015784818151811061043457610434610f10565b60200260200101516000015184828151811061045257610452610f10565b60200260200101818152505084818151811061047057610470610f10565b60200260200101516020015183828151811061048e5761048e610f10565b6020026020010181815250508481815181106104ac576104ac610f10565b6020026020010151604001518282815181106104ca576104ca610f10565b73ffffffffffffffffffffffffffffffffffffffff90921660209283029190910190910152806104f981610f3f565b915050610419565b507fcbc30d216c0bf0ce4977b30da9208f213cf7dcc4b18d84938d49b3324d0eb3d483838360405161053593929190610a37565b60405180910390a150919695505050505050565b6001546040517f1dbd73d600000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff848116600483015260248201849052606092839283926000928392839290911690631dbd73d690349060440160006040518083038185885af11580156105d1573d6000803e3d6000fd5b50505050506040513d6000823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682016040526106189190810190610d69565b9250925092507f4eeaef896886392a597e523dbfd6604cb903fd51e82b682aa92632b0487bb6de83838360405161065193929190610a37565b60405180910390a1919450925090509250925092565b6001546040517f2a5963e100000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff848116600483015260248201849052606092600092911690632a5963e190349060440160006040518083038185885af11580156106e6573d6000803e3d6000fd5b50505050506040513d6000823e601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016820160405261072d9190810190610e49565b90506000815167ffffffffffffffff81111561074b5761074b610bcf565b604051908082528060200260200182016040528015610774578160200160208202803683370190505b5090506000825167ffffffffffffffff81111561079357610793610bcf565b6040519080825280602002602001820160405280156107bc578160200160208202803683370190505b5090506000835167ffffffffffffffff8111156107db576107db610bcf565b604051908082528060200260200182016040528015610804578160200160208202803683370190505b50905060005b84518110156108f25784818151811061082557610825610f10565b60200260200101516000015184828151811061084357610843610f10565b60200260200101818152505084818151811061086157610861610f10565b60200260200101516020015183828151811061087f5761087f610f10565b60200260200101818152505084818151811061089d5761089d610f10565b6020026020010151604001518282815181106108bb576108bb610f10565b73ffffffffffffffffffffffffffffffffffffffff90921660209283029190910190910152806108ea81610f3f565b91505061080a565b507f4eeaef896886392a597e523dbfd6604cb903fd51e82b682aa92632b0487bb6de83838360405161092693929190610a37565b60405180910390a1509195945050505050565b73ffffffffffffffffffffffffffffffffffffffff8116811461095b57600080fd5b50565b60008060006040848603121561097357600080fd5b833561097e81610939565b9250602084013567ffffffffffffffff8082111561099b57600080fd5b818601915086601f8301126109af57600080fd5b8135818111156109be57600080fd5b8760208260051b85010111156109d357600080fd5b6020830194508093505050509250925092565b600081518084526020808501945080840160005b83811015610a2c57815173ffffffffffffffffffffffffffffffffffffffff16875295820195908201906001016109fa565b509495945050505050565b606080825284519082018190526000906020906080840190828801845b82811015610a7057815184529284019290840190600101610a54565b5050508381038285015285518082528683019183019060005b81811015610aa557835183529284019291840191600101610a89565b50508481036040860152610ab981876109e6565b98975050505050505050565b602080825282518282018190526000919060409081850190868401855b82811015610b2757815180518552868101518786015285015173ffffffffffffffffffffffffffffffffffffffff168585015260609093019290850190600101610ae2565b5091979650505050505050565b60008060408385031215610b4757600080fd5b8235610b5281610939565b946020939093013593505050565b73ffffffffffffffffffffffffffffffffffffffff841681526040602082015281604082015260007f07ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff831115610bb557600080fd5b8260051b8085606085013791909101606001949350505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6040516060810167ffffffffffffffff81118282101715610c2157610c21610bcf565b60405290565b604051601f82017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016810167ffffffffffffffff81118282101715610c6e57610c6e610bcf565b604052919050565b600067ffffffffffffffff821115610c9057610c90610bcf565b5060051b60200190565b600082601f830112610cab57600080fd5b81516020610cc0610cbb83610c76565b610c27565b82815260059290921b84018101918181019086841115610cdf57600080fd5b8286015b84811015610cfa5780518352918301918301610ce3565b509695505050505050565b600082601f830112610d1657600080fd5b81516020610d26610cbb83610c76565b82815260059290921b84018101918181019086841115610d4557600080fd5b8286015b84811015610cfa578051610d5c81610939565b8352918301918301610d49565b600080600060608486031215610d7e57600080fd5b835167ffffffffffffffff80821115610d9657600080fd5b818601915086601f830112610daa57600080fd5b81516020610dba610cbb83610c76565b82815260059290921b8401810191818101908a841115610dd957600080fd5b948201945b83861015610df757855182529482019490820190610dde565b91890151919750909350505080821115610e1057600080fd5b610e1c87838801610c9a565b93506040860151915080821115610e3257600080fd5b50610e3f86828701610d05565b9150509250925092565b60006020808385031215610e5c57600080fd5b825167ffffffffffffffff811115610e7357600080fd5b8301601f81018513610e8457600080fd5b8051610e92610cbb82610c76565b81815260609182028301840191848201919088841115610eb157600080fd5b938501935b83851015610f045780858a031215610ece5760008081fd5b610ed6610bfe565b855181528686015187820152604080870151610ef181610939565b9082015283529384019391850191610eb6565b50979650505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203610f97577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b506001019056fea2646970667358221220c30189957c712de5dc166c1d122af928e32e6bf4b17db8ce6b3098c0840a2b0664736f6c63430008100033";

export class DeFi__factory extends ContractFactory {
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
    _passport: string,
    _reader: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<DeFi> {
    return super.deploy(_passport, _reader, overrides || {}) as Promise<DeFi>;
  }
  getDeployTransaction(
    _passport: string,
    _reader: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_passport, _reader, overrides || {});
  }
  attach(address: string): DeFi {
    return super.attach(address) as DeFi;
  }
  connect(signer: Signer): DeFi__factory {
    return super.connect(signer) as DeFi__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): DeFiInterface {
    return new utils.Interface(_abi) as DeFiInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): DeFi {
    return new Contract(address, _abi, signerOrProvider) as DeFi;
  }
}
