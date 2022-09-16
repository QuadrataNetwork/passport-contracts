/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface QuadPassportInterface extends ethers.utils.Interface {
  functions: {
    "DIGEST_TO_SIGN()": FunctionFragment;
    "GOVERNANCE_ROLE()": FunctionFragment;
    "ISSUER_ROLE()": FunctionFragment;
    "PAUSER_ROLE()": FunctionFragment;
    "READER_ROLE()": FunctionFragment;
    "acceptGovernance()": FunctionFragment;
    "attributes(address,bytes32)": FunctionFragment;
    "balanceOf(address,uint256)": FunctionFragment;
    "balanceOfBatch(address[],uint256[])": FunctionFragment;
    "burnPassports()": FunctionFragment;
    "burnPassportsIssuer(address)": FunctionFragment;
    "governance()": FunctionFragment;
    "initialize(address)": FunctionFragment;
    "migrate(address[],address,address)": FunctionFragment;
    "name()": FunctionFragment;
    "passportPaused()": FunctionFragment;
    "pause()": FunctionFragment;
    "paused()": FunctionFragment;
    "pendingGovernance()": FunctionFragment;
    "proxiableUUID()": FunctionFragment;
    "setAttributes((bytes32[],bytes32[],bytes32[],bytes32,uint256,uint256,uint256,uint256),bytes,bytes)": FunctionFragment;
    "setAttributesIssuer(address,(bytes32[],bytes32[],bytes32[],bytes32,uint256,uint256,uint256,uint256),bytes)": FunctionFragment;
    "setGovernance(address)": FunctionFragment;
    "setTokenURI(uint256,string)": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
    "symbol()": FunctionFragment;
    "unpause()": FunctionFragment;
    "upgradeTo(address)": FunctionFragment;
    "upgradeToAndCall(address,bytes)": FunctionFragment;
    "uri(uint256)": FunctionFragment;
    "withdraw(address,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "DIGEST_TO_SIGN",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "GOVERNANCE_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "ISSUER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "PAUSER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "READER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "acceptGovernance",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "attributes",
    values: [string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "balanceOf",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "balanceOfBatch",
    values: [string[], BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "burnPassports",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "burnPassportsIssuer",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "governance",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "initialize", values: [string]): string;
  encodeFunctionData(
    functionFragment: "migrate",
    values: [string[], string, string]
  ): string;
  encodeFunctionData(functionFragment: "name", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "passportPaused",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "pause", values?: undefined): string;
  encodeFunctionData(functionFragment: "paused", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "pendingGovernance",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "proxiableUUID",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setAttributes",
    values: [
      {
        attrKeys: BytesLike[];
        attrValues: BytesLike[];
        attrTypes: BytesLike[];
        did: BytesLike;
        tokenId: BigNumberish;
        verifiedAt: BigNumberish;
        issuedAt: BigNumberish;
        fee: BigNumberish;
      },
      BytesLike,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "setAttributesIssuer",
    values: [
      string,
      {
        attrKeys: BytesLike[];
        attrValues: BytesLike[];
        attrTypes: BytesLike[];
        did: BytesLike;
        tokenId: BigNumberish;
        verifiedAt: BigNumberish;
        issuedAt: BigNumberish;
        fee: BigNumberish;
      },
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "setGovernance",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "setTokenURI",
    values: [BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "symbol", values?: undefined): string;
  encodeFunctionData(functionFragment: "unpause", values?: undefined): string;
  encodeFunctionData(functionFragment: "upgradeTo", values: [string]): string;
  encodeFunctionData(
    functionFragment: "upgradeToAndCall",
    values: [string, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "uri", values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [string, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "DIGEST_TO_SIGN",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "GOVERNANCE_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "ISSUER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "PAUSER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "READER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "acceptGovernance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "attributes", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "balanceOfBatch",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "burnPassports",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "burnPassportsIssuer",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "governance", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "migrate", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "passportPaused",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "pause", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "paused", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "pendingGovernance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "proxiableUUID",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setAttributes",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setAttributesIssuer",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setGovernance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setTokenURI",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "symbol", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "unpause", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "upgradeTo", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "upgradeToAndCall",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "uri", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {
    "AdminChanged(address,address)": EventFragment;
    "BeaconUpgraded(address)": EventFragment;
    "BurnPassportsIssuer(address,address)": EventFragment;
    "GovernanceUpdated(address,address)": EventFragment;
    "Initialized(uint8)": EventFragment;
    "Paused(address)": EventFragment;
    "SetAttributeReceipt(address,address,uint256)": EventFragment;
    "SetPendingGovernance(address)": EventFragment;
    "TransferSingle(address,address,address,uint256,uint256)": EventFragment;
    "URI(string,uint256)": EventFragment;
    "Unpaused(address)": EventFragment;
    "Upgraded(address)": EventFragment;
    "WithdrawEvent(address,address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "BeaconUpgraded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "BurnPassportsIssuer"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "GovernanceUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Initialized"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Paused"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "SetAttributeReceipt"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "SetPendingGovernance"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TransferSingle"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "URI"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Unpaused"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Upgraded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "WithdrawEvent"): EventFragment;
}

export type AdminChangedEvent = TypedEvent<
  [string, string] & { previousAdmin: string; newAdmin: string }
>;

export type BeaconUpgradedEvent = TypedEvent<[string] & { beacon: string }>;

export type BurnPassportsIssuerEvent = TypedEvent<
  [string, string] & { _issuer: string; _account: string }
>;

export type GovernanceUpdatedEvent = TypedEvent<
  [string, string] & { _oldGovernance: string; _governance: string }
>;

export type InitializedEvent = TypedEvent<[number] & { version: number }>;

export type PausedEvent = TypedEvent<[string] & { account: string }>;

export type SetAttributeReceiptEvent = TypedEvent<
  [string, string, BigNumber] & {
    _account: string;
    _issuer: string;
    _fee: BigNumber;
  }
>;

export type SetPendingGovernanceEvent = TypedEvent<
  [string] & { _pendingGovernance: string }
>;

export type TransferSingleEvent = TypedEvent<
  [string, string, string, BigNumber, BigNumber] & {
    operator: string;
    from: string;
    to: string;
    id: BigNumber;
    value: BigNumber;
  }
>;

export type URIEvent = TypedEvent<
  [string, BigNumber] & { value: string; id: BigNumber }
>;

export type UnpausedEvent = TypedEvent<[string] & { account: string }>;

export type UpgradedEvent = TypedEvent<[string] & { implementation: string }>;

export type WithdrawEventEvent = TypedEvent<
  [string, string, BigNumber] & {
    _issuer: string;
    _treasury: string;
    _fee: BigNumber;
  }
>;

export class QuadPassport extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: QuadPassportInterface;

  functions: {
    DIGEST_TO_SIGN(overrides?: CallOverrides): Promise<[string]>;

    GOVERNANCE_ROLE(overrides?: CallOverrides): Promise<[string]>;

    ISSUER_ROLE(overrides?: CallOverrides): Promise<[string]>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<[string]>;

    READER_ROLE(overrides?: CallOverrides): Promise<[string]>;

    acceptGovernance(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    attributes(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [
        ([string, BigNumber, string] & {
          value: string;
          epoch: BigNumber;
          issuer: string;
        })[]
      ]
    >;

    balanceOf(
      account: string,
      id: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    balanceOfBatch(
      accounts: string[],
      ids: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<[BigNumber[]]>;

    burnPassports(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    burnPassportsIssuer(
      _account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    governance(overrides?: CallOverrides): Promise<[string]>;

    initialize(
      _governanceContract: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    migrate(
      _accounts: string[],
      _issuer: string,
      _oldPassport: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    name(overrides?: CallOverrides): Promise<[string]>;

    passportPaused(overrides?: CallOverrides): Promise<[boolean]>;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    paused(overrides?: CallOverrides): Promise<[boolean]>;

    pendingGovernance(overrides?: CallOverrides): Promise<[string]>;

    proxiableUUID(overrides?: CallOverrides): Promise<[string]>;

    setAttributes(
      _config: {
        attrKeys: BytesLike[];
        attrValues: BytesLike[];
        attrTypes: BytesLike[];
        did: BytesLike;
        tokenId: BigNumberish;
        verifiedAt: BigNumberish;
        issuedAt: BigNumberish;
        fee: BigNumberish;
      },
      _sigIssuer: BytesLike,
      _sigAccount: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setAttributesIssuer(
      _account: string,
      _config: {
        attrKeys: BytesLike[];
        attrValues: BytesLike[];
        attrTypes: BytesLike[];
        did: BytesLike;
        tokenId: BigNumberish;
        verifiedAt: BigNumberish;
        issuedAt: BigNumberish;
        fee: BigNumberish;
      },
      _sigIssuer: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setGovernance(
      _governanceContract: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setTokenURI(
      _tokenId: BigNumberish,
      _uri: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    symbol(overrides?: CallOverrides): Promise<[string]>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    upgradeTo(
      newImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    upgradeToAndCall(
      newImplementation: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    uri(_tokenId: BigNumberish, overrides?: CallOverrides): Promise<[string]>;

    withdraw(
      _to: string,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  DIGEST_TO_SIGN(overrides?: CallOverrides): Promise<string>;

  GOVERNANCE_ROLE(overrides?: CallOverrides): Promise<string>;

  ISSUER_ROLE(overrides?: CallOverrides): Promise<string>;

  PAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

  READER_ROLE(overrides?: CallOverrides): Promise<string>;

  acceptGovernance(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  attributes(
    _account: string,
    _attribute: BytesLike,
    overrides?: CallOverrides
  ): Promise<
    ([string, BigNumber, string] & {
      value: string;
      epoch: BigNumber;
      issuer: string;
    })[]
  >;

  balanceOf(
    account: string,
    id: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  balanceOfBatch(
    accounts: string[],
    ids: BigNumberish[],
    overrides?: CallOverrides
  ): Promise<BigNumber[]>;

  burnPassports(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  burnPassportsIssuer(
    _account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  governance(overrides?: CallOverrides): Promise<string>;

  initialize(
    _governanceContract: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  migrate(
    _accounts: string[],
    _issuer: string,
    _oldPassport: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  name(overrides?: CallOverrides): Promise<string>;

  passportPaused(overrides?: CallOverrides): Promise<boolean>;

  pause(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  paused(overrides?: CallOverrides): Promise<boolean>;

  pendingGovernance(overrides?: CallOverrides): Promise<string>;

  proxiableUUID(overrides?: CallOverrides): Promise<string>;

  setAttributes(
    _config: {
      attrKeys: BytesLike[];
      attrValues: BytesLike[];
      attrTypes: BytesLike[];
      did: BytesLike;
      tokenId: BigNumberish;
      verifiedAt: BigNumberish;
      issuedAt: BigNumberish;
      fee: BigNumberish;
    },
    _sigIssuer: BytesLike,
    _sigAccount: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setAttributesIssuer(
    _account: string,
    _config: {
      attrKeys: BytesLike[];
      attrValues: BytesLike[];
      attrTypes: BytesLike[];
      did: BytesLike;
      tokenId: BigNumberish;
      verifiedAt: BigNumberish;
      issuedAt: BigNumberish;
      fee: BigNumberish;
    },
    _sigIssuer: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setGovernance(
    _governanceContract: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setTokenURI(
    _tokenId: BigNumberish,
    _uri: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  supportsInterface(
    interfaceId: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  symbol(overrides?: CallOverrides): Promise<string>;

  unpause(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  upgradeTo(
    newImplementation: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  upgradeToAndCall(
    newImplementation: string,
    data: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  uri(_tokenId: BigNumberish, overrides?: CallOverrides): Promise<string>;

  withdraw(
    _to: string,
    _amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    DIGEST_TO_SIGN(overrides?: CallOverrides): Promise<string>;

    GOVERNANCE_ROLE(overrides?: CallOverrides): Promise<string>;

    ISSUER_ROLE(overrides?: CallOverrides): Promise<string>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

    READER_ROLE(overrides?: CallOverrides): Promise<string>;

    acceptGovernance(overrides?: CallOverrides): Promise<void>;

    attributes(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      ([string, BigNumber, string] & {
        value: string;
        epoch: BigNumber;
        issuer: string;
      })[]
    >;

    balanceOf(
      account: string,
      id: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    balanceOfBatch(
      accounts: string[],
      ids: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber[]>;

    burnPassports(overrides?: CallOverrides): Promise<void>;

    burnPassportsIssuer(
      _account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    governance(overrides?: CallOverrides): Promise<string>;

    initialize(
      _governanceContract: string,
      overrides?: CallOverrides
    ): Promise<void>;

    migrate(
      _accounts: string[],
      _issuer: string,
      _oldPassport: string,
      overrides?: CallOverrides
    ): Promise<void>;

    name(overrides?: CallOverrides): Promise<string>;

    passportPaused(overrides?: CallOverrides): Promise<boolean>;

    pause(overrides?: CallOverrides): Promise<void>;

    paused(overrides?: CallOverrides): Promise<boolean>;

    pendingGovernance(overrides?: CallOverrides): Promise<string>;

    proxiableUUID(overrides?: CallOverrides): Promise<string>;

    setAttributes(
      _config: {
        attrKeys: BytesLike[];
        attrValues: BytesLike[];
        attrTypes: BytesLike[];
        did: BytesLike;
        tokenId: BigNumberish;
        verifiedAt: BigNumberish;
        issuedAt: BigNumberish;
        fee: BigNumberish;
      },
      _sigIssuer: BytesLike,
      _sigAccount: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    setAttributesIssuer(
      _account: string,
      _config: {
        attrKeys: BytesLike[];
        attrValues: BytesLike[];
        attrTypes: BytesLike[];
        did: BytesLike;
        tokenId: BigNumberish;
        verifiedAt: BigNumberish;
        issuedAt: BigNumberish;
        fee: BigNumberish;
      },
      _sigIssuer: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    setGovernance(
      _governanceContract: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setTokenURI(
      _tokenId: BigNumberish,
      _uri: string,
      overrides?: CallOverrides
    ): Promise<void>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    symbol(overrides?: CallOverrides): Promise<string>;

    unpause(overrides?: CallOverrides): Promise<void>;

    upgradeTo(
      newImplementation: string,
      overrides?: CallOverrides
    ): Promise<void>;

    upgradeToAndCall(
      newImplementation: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    uri(_tokenId: BigNumberish, overrides?: CallOverrides): Promise<string>;

    withdraw(
      _to: string,
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "AdminChanged(address,address)"(
      previousAdmin?: null,
      newAdmin?: null
    ): TypedEventFilter<
      [string, string],
      { previousAdmin: string; newAdmin: string }
    >;

    AdminChanged(
      previousAdmin?: null,
      newAdmin?: null
    ): TypedEventFilter<
      [string, string],
      { previousAdmin: string; newAdmin: string }
    >;

    "BeaconUpgraded(address)"(
      beacon?: string | null
    ): TypedEventFilter<[string], { beacon: string }>;

    BeaconUpgraded(
      beacon?: string | null
    ): TypedEventFilter<[string], { beacon: string }>;

    "BurnPassportsIssuer(address,address)"(
      _issuer?: string | null,
      _account?: string | null
    ): TypedEventFilter<
      [string, string],
      { _issuer: string; _account: string }
    >;

    BurnPassportsIssuer(
      _issuer?: string | null,
      _account?: string | null
    ): TypedEventFilter<
      [string, string],
      { _issuer: string; _account: string }
    >;

    "GovernanceUpdated(address,address)"(
      _oldGovernance?: string | null,
      _governance?: string | null
    ): TypedEventFilter<
      [string, string],
      { _oldGovernance: string; _governance: string }
    >;

    GovernanceUpdated(
      _oldGovernance?: string | null,
      _governance?: string | null
    ): TypedEventFilter<
      [string, string],
      { _oldGovernance: string; _governance: string }
    >;

    "Initialized(uint8)"(
      version?: null
    ): TypedEventFilter<[number], { version: number }>;

    Initialized(
      version?: null
    ): TypedEventFilter<[number], { version: number }>;

    "Paused(address)"(
      account?: null
    ): TypedEventFilter<[string], { account: string }>;

    Paused(account?: null): TypedEventFilter<[string], { account: string }>;

    "SetAttributeReceipt(address,address,uint256)"(
      _account?: string | null,
      _issuer?: string | null,
      _fee?: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { _account: string; _issuer: string; _fee: BigNumber }
    >;

    SetAttributeReceipt(
      _account?: string | null,
      _issuer?: string | null,
      _fee?: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { _account: string; _issuer: string; _fee: BigNumber }
    >;

    "SetPendingGovernance(address)"(
      _pendingGovernance?: string | null
    ): TypedEventFilter<[string], { _pendingGovernance: string }>;

    SetPendingGovernance(
      _pendingGovernance?: string | null
    ): TypedEventFilter<[string], { _pendingGovernance: string }>;

    "TransferSingle(address,address,address,uint256,uint256)"(
      operator?: string | null,
      from?: string | null,
      to?: string | null,
      id?: null,
      value?: null
    ): TypedEventFilter<
      [string, string, string, BigNumber, BigNumber],
      {
        operator: string;
        from: string;
        to: string;
        id: BigNumber;
        value: BigNumber;
      }
    >;

    TransferSingle(
      operator?: string | null,
      from?: string | null,
      to?: string | null,
      id?: null,
      value?: null
    ): TypedEventFilter<
      [string, string, string, BigNumber, BigNumber],
      {
        operator: string;
        from: string;
        to: string;
        id: BigNumber;
        value: BigNumber;
      }
    >;

    "URI(string,uint256)"(
      value?: null,
      id?: BigNumberish | null
    ): TypedEventFilter<[string, BigNumber], { value: string; id: BigNumber }>;

    URI(
      value?: null,
      id?: BigNumberish | null
    ): TypedEventFilter<[string, BigNumber], { value: string; id: BigNumber }>;

    "Unpaused(address)"(
      account?: null
    ): TypedEventFilter<[string], { account: string }>;

    Unpaused(account?: null): TypedEventFilter<[string], { account: string }>;

    "Upgraded(address)"(
      implementation?: string | null
    ): TypedEventFilter<[string], { implementation: string }>;

    Upgraded(
      implementation?: string | null
    ): TypedEventFilter<[string], { implementation: string }>;

    "WithdrawEvent(address,address,uint256)"(
      _issuer?: string | null,
      _treasury?: string | null,
      _fee?: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { _issuer: string; _treasury: string; _fee: BigNumber }
    >;

    WithdrawEvent(
      _issuer?: string | null,
      _treasury?: string | null,
      _fee?: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { _issuer: string; _treasury: string; _fee: BigNumber }
    >;
  };

  estimateGas: {
    DIGEST_TO_SIGN(overrides?: CallOverrides): Promise<BigNumber>;

    GOVERNANCE_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    ISSUER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    READER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    acceptGovernance(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    attributes(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    balanceOf(
      account: string,
      id: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    balanceOfBatch(
      accounts: string[],
      ids: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    burnPassports(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    burnPassportsIssuer(
      _account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    governance(overrides?: CallOverrides): Promise<BigNumber>;

    initialize(
      _governanceContract: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    migrate(
      _accounts: string[],
      _issuer: string,
      _oldPassport: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    name(overrides?: CallOverrides): Promise<BigNumber>;

    passportPaused(overrides?: CallOverrides): Promise<BigNumber>;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    paused(overrides?: CallOverrides): Promise<BigNumber>;

    pendingGovernance(overrides?: CallOverrides): Promise<BigNumber>;

    proxiableUUID(overrides?: CallOverrides): Promise<BigNumber>;

    setAttributes(
      _config: {
        attrKeys: BytesLike[];
        attrValues: BytesLike[];
        attrTypes: BytesLike[];
        did: BytesLike;
        tokenId: BigNumberish;
        verifiedAt: BigNumberish;
        issuedAt: BigNumberish;
        fee: BigNumberish;
      },
      _sigIssuer: BytesLike,
      _sigAccount: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setAttributesIssuer(
      _account: string,
      _config: {
        attrKeys: BytesLike[];
        attrValues: BytesLike[];
        attrTypes: BytesLike[];
        did: BytesLike;
        tokenId: BigNumberish;
        verifiedAt: BigNumberish;
        issuedAt: BigNumberish;
        fee: BigNumberish;
      },
      _sigIssuer: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setGovernance(
      _governanceContract: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setTokenURI(
      _tokenId: BigNumberish,
      _uri: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    symbol(overrides?: CallOverrides): Promise<BigNumber>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    upgradeTo(
      newImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    upgradeToAndCall(
      newImplementation: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    uri(_tokenId: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    withdraw(
      _to: string,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    DIGEST_TO_SIGN(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    GOVERNANCE_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ISSUER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    READER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    acceptGovernance(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    attributes(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    balanceOf(
      account: string,
      id: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    balanceOfBatch(
      accounts: string[],
      ids: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    burnPassports(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    burnPassportsIssuer(
      _account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    governance(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    initialize(
      _governanceContract: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    migrate(
      _accounts: string[],
      _issuer: string,
      _oldPassport: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    name(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    passportPaused(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    paused(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    pendingGovernance(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    proxiableUUID(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    setAttributes(
      _config: {
        attrKeys: BytesLike[];
        attrValues: BytesLike[];
        attrTypes: BytesLike[];
        did: BytesLike;
        tokenId: BigNumberish;
        verifiedAt: BigNumberish;
        issuedAt: BigNumberish;
        fee: BigNumberish;
      },
      _sigIssuer: BytesLike,
      _sigAccount: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setAttributesIssuer(
      _account: string,
      _config: {
        attrKeys: BytesLike[];
        attrValues: BytesLike[];
        attrTypes: BytesLike[];
        did: BytesLike;
        tokenId: BigNumberish;
        verifiedAt: BigNumberish;
        issuedAt: BigNumberish;
        fee: BigNumberish;
      },
      _sigIssuer: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setGovernance(
      _governanceContract: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setTokenURI(
      _tokenId: BigNumberish,
      _uri: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    symbol(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    upgradeTo(
      newImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    upgradeToAndCall(
      newImplementation: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    uri(
      _tokenId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    withdraw(
      _to: string,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
