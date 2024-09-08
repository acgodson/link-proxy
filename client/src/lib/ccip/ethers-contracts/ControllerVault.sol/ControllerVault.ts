/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from "../common";

export declare namespace Client {
  export type EVMTokenAmountStruct = { token: string; amount: BigNumberish };

  export type EVMTokenAmountStructOutput = [string, BigNumber] & {
    token: string;
    amount: BigNumber;
  };

  export type Any2EVMMessageStruct = {
    messageId: BytesLike;
    sourceChainSelector: BigNumberish;
    sender: BytesLike;
    data: BytesLike;
    destTokenAmounts: Client.EVMTokenAmountStruct[];
  };

  export type Any2EVMMessageStructOutput = [
    string,
    BigNumber,
    string,
    string,
    Client.EVMTokenAmountStructOutput[]
  ] & {
    messageId: string;
    sourceChainSelector: BigNumber;
    sender: string;
    data: string;
    destTokenAmounts: Client.EVMTokenAmountStructOutput[];
  };
}

export interface ControllerVaultInterface extends utils.Interface {
  functions: {
    "ccipReceive((bytes32,uint64,bytes,bytes,(address,uint256)[]))": FunctionFragment;
    "controller()": FunctionFragment;
    "getRouter()": FunctionFragment;
    "routerDeposits(address,address)": FunctionFragment;
    "setController(address)": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "ccipReceive"
      | "controller"
      | "getRouter"
      | "routerDeposits"
      | "setController"
      | "supportsInterface"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "ccipReceive",
    values: [Client.Any2EVMMessageStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "controller",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "getRouter", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "routerDeposits",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "setController",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "ccipReceive",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "controller", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getRouter", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "routerDeposits",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setController",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;

  events: {
    "PaymentProcessed(bytes32,address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "PaymentProcessed"): EventFragment;
}

export interface PaymentProcessedEventObject {
  requestMessageID: string;
  depositorRouter: string;
  amount: BigNumber;
}
export type PaymentProcessedEvent = TypedEvent<
  [string, string, BigNumber],
  PaymentProcessedEventObject
>;

export type PaymentProcessedEventFilter =
  TypedEventFilter<PaymentProcessedEvent>;

export interface ControllerVault extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ControllerVaultInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    ccipReceive(
      message: Client.Any2EVMMessageStruct,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    controller(overrides?: CallOverrides): Promise<[string]>;

    getRouter(overrides?: CallOverrides): Promise<[string]>;

    routerDeposits(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    setController(
      _controller: string,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;
  };

  ccipReceive(
    message: Client.Any2EVMMessageStruct,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  controller(overrides?: CallOverrides): Promise<string>;

  getRouter(overrides?: CallOverrides): Promise<string>;

  routerDeposits(
    arg0: string,
    arg1: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  setController(
    _controller: string,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  supportsInterface(
    interfaceId: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  callStatic: {
    ccipReceive(
      message: Client.Any2EVMMessageStruct,
      overrides?: CallOverrides
    ): Promise<void>;

    controller(overrides?: CallOverrides): Promise<string>;

    getRouter(overrides?: CallOverrides): Promise<string>;

    routerDeposits(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setController(
      _controller: string,
      overrides?: CallOverrides
    ): Promise<void>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;
  };

  filters: {
    "PaymentProcessed(bytes32,address,uint256)"(
      requestMessageID?: BytesLike | null,
      depositorRouter?: string | null,
      amount?: null
    ): PaymentProcessedEventFilter;
    PaymentProcessed(
      requestMessageID?: BytesLike | null,
      depositorRouter?: string | null,
      amount?: null
    ): PaymentProcessedEventFilter;
  };

  estimateGas: {
    ccipReceive(
      message: Client.Any2EVMMessageStruct,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    controller(overrides?: CallOverrides): Promise<BigNumber>;

    getRouter(overrides?: CallOverrides): Promise<BigNumber>;

    routerDeposits(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setController(
      _controller: string,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    ccipReceive(
      message: Client.Any2EVMMessageStruct,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    controller(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getRouter(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    routerDeposits(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setController(
      _controller: string,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
