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

interface IQuadReaderInterface extends ethers.utils.Interface {
  functions: {
    "balanceOf(address,bytes32)": FunctionFragment;
    "calculatePaymentETH(bytes32,address)": FunctionFragment;
    "getAttributes(address,bytes32)": FunctionFragment;
    "getAttributesBulk(address,bytes32[])": FunctionFragment;
    "getAttributesBulkLegacy(address,bytes32[])": FunctionFragment;
    "getAttributesETH(address,uint256,bytes32)": FunctionFragment;
    "getAttributesLegacy(address,bytes32)": FunctionFragment;
    "hasPassportByIssuer(address,bytes32,address)": FunctionFragment;
    "latestEpoch(address,bytes32)": FunctionFragment;
    "queryFee(address,bytes32)": FunctionFragment;
    "queryFeeBulk(address,bytes32[])": FunctionFragment;
    "withdraw(address,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "balanceOf",
    values: [string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "calculatePaymentETH",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "getAttributes",
    values: [string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getAttributesBulk",
    values: [string, BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getAttributesBulkLegacy",
    values: [string, BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getAttributesETH",
    values: [string, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getAttributesLegacy",
    values: [string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "hasPassportByIssuer",
    values: [string, BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "latestEpoch",
    values: [string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "queryFee",
    values: [string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "queryFeeBulk",
    values: [string, BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [string, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "calculatePaymentETH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAttributes",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAttributesBulk",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAttributesBulkLegacy",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAttributesETH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAttributesLegacy",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "hasPassportByIssuer",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "latestEpoch",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "queryFee", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "queryFeeBulk",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {
    "QueryBulkEvent(address,address,bytes32[])": EventFragment;
    "QueryEvent(address,address,bytes32)": EventFragment;
    "QueryFeeReceipt(address,uint256)": EventFragment;
    "WithdrawEvent(address,address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "QueryBulkEvent"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "QueryEvent"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "QueryFeeReceipt"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "WithdrawEvent"): EventFragment;
}

export type QueryBulkEventEvent = TypedEvent<
  [string, string, string[]] & {
    _account: string;
    _caller: string;
    _attributes: string[];
  }
>;

export type QueryEventEvent = TypedEvent<
  [string, string, string] & {
    _account: string;
    _caller: string;
    _attribute: string;
  }
>;

export type QueryFeeReceiptEvent = TypedEvent<
  [string, BigNumber] & { _receiver: string; _fee: BigNumber }
>;

export type WithdrawEventEvent = TypedEvent<
  [string, string, BigNumber] & {
    _issuer: string;
    _treasury: string;
    _fee: BigNumber;
  }
>;

export class IQuadReader extends BaseContract {
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

  interface: IQuadReaderInterface;

  functions: {
    balanceOf(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    calculatePaymentETH(
      _attribute: BytesLike,
      _account: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getAttributes(
      _account: string,
      _attribute: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getAttributesBulk(
      _account: string,
      _attributes: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getAttributesBulkLegacy(
      _account: string,
      _attributes: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getAttributesETH(
      _account: string,
      _tokenId: BigNumberish,
      _attribute: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getAttributesLegacy(
      _account: string,
      _attribute: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    hasPassportByIssuer(
      _account: string,
      _attribute: BytesLike,
      _issuer: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    latestEpoch(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    queryFee(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    queryFeeBulk(
      _account: string,
      _attributes: BytesLike[],
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    withdraw(
      _to: string,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  balanceOf(
    _account: string,
    _attribute: BytesLike,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  calculatePaymentETH(
    _attribute: BytesLike,
    _account: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getAttributes(
    _account: string,
    _attribute: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getAttributesBulk(
    _account: string,
    _attributes: BytesLike[],
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getAttributesBulkLegacy(
    _account: string,
    _attributes: BytesLike[],
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getAttributesETH(
    _account: string,
    _tokenId: BigNumberish,
    _attribute: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getAttributesLegacy(
    _account: string,
    _attribute: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  hasPassportByIssuer(
    _account: string,
    _attribute: BytesLike,
    _issuer: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  latestEpoch(
    _account: string,
    _attribute: BytesLike,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  queryFee(
    _account: string,
    _attribute: BytesLike,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  queryFeeBulk(
    _account: string,
    _attributes: BytesLike[],
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  withdraw(
    _to: string,
    _amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    balanceOf(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    calculatePaymentETH(
      _attribute: BytesLike,
      _account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAttributes(
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

    getAttributesBulk(
      _account: string,
      _attributes: BytesLike[],
      overrides?: CallOverrides
    ): Promise<
      ([string, BigNumber, string] & {
        value: string;
        epoch: BigNumber;
        issuer: string;
      })[]
    >;

    getAttributesBulkLegacy(
      _account: string,
      _attributes: BytesLike[],
      overrides?: CallOverrides
    ): Promise<
      [string[], BigNumber[], string[]] & {
        values: string[];
        epochs: BigNumber[];
        issuers: string[];
      }
    >;

    getAttributesETH(
      _account: string,
      _tokenId: BigNumberish,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[], string[]]>;

    getAttributesLegacy(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [string[], BigNumber[], string[]] & {
        values: string[];
        epochs: BigNumber[];
        issuers: string[];
      }
    >;

    hasPassportByIssuer(
      _account: string,
      _attribute: BytesLike,
      _issuer: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    latestEpoch(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    queryFee(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    queryFeeBulk(
      _account: string,
      _attributes: BytesLike[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    withdraw(
      _to: string,
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "QueryBulkEvent(address,address,bytes32[])"(
      _account?: string | null,
      _caller?: string | null,
      _attributes?: null
    ): TypedEventFilter<
      [string, string, string[]],
      { _account: string; _caller: string; _attributes: string[] }
    >;

    QueryBulkEvent(
      _account?: string | null,
      _caller?: string | null,
      _attributes?: null
    ): TypedEventFilter<
      [string, string, string[]],
      { _account: string; _caller: string; _attributes: string[] }
    >;

    "QueryEvent(address,address,bytes32)"(
      _account?: string | null,
      _caller?: string | null,
      _attribute?: null
    ): TypedEventFilter<
      [string, string, string],
      { _account: string; _caller: string; _attribute: string }
    >;

    QueryEvent(
      _account?: string | null,
      _caller?: string | null,
      _attribute?: null
    ): TypedEventFilter<
      [string, string, string],
      { _account: string; _caller: string; _attribute: string }
    >;

    "QueryFeeReceipt(address,uint256)"(
      _receiver?: string | null,
      _fee?: null
    ): TypedEventFilter<
      [string, BigNumber],
      { _receiver: string; _fee: BigNumber }
    >;

    QueryFeeReceipt(
      _receiver?: string | null,
      _fee?: null
    ): TypedEventFilter<
      [string, BigNumber],
      { _receiver: string; _fee: BigNumber }
    >;

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
    balanceOf(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    calculatePaymentETH(
      _attribute: BytesLike,
      _account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAttributes(
      _account: string,
      _attribute: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getAttributesBulk(
      _account: string,
      _attributes: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getAttributesBulkLegacy(
      _account: string,
      _attributes: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getAttributesETH(
      _account: string,
      _tokenId: BigNumberish,
      _attribute: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getAttributesLegacy(
      _account: string,
      _attribute: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    hasPassportByIssuer(
      _account: string,
      _attribute: BytesLike,
      _issuer: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    latestEpoch(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    queryFee(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    queryFeeBulk(
      _account: string,
      _attributes: BytesLike[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    withdraw(
      _to: string,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    balanceOf(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    calculatePaymentETH(
      _attribute: BytesLike,
      _account: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getAttributes(
      _account: string,
      _attribute: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getAttributesBulk(
      _account: string,
      _attributes: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getAttributesBulkLegacy(
      _account: string,
      _attributes: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getAttributesETH(
      _account: string,
      _tokenId: BigNumberish,
      _attribute: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getAttributesLegacy(
      _account: string,
      _attribute: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    hasPassportByIssuer(
      _account: string,
      _attribute: BytesLike,
      _issuer: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    latestEpoch(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    queryFee(
      _account: string,
      _attribute: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    queryFeeBulk(
      _account: string,
      _attributes: BytesLike[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    withdraw(
      _to: string,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
