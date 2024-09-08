/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BigNumberish,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  CustomRouterWithAttester,
  CustomRouterWithAttesterInterface,
} from "../CustomRouterWithAttester";

const _abi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_router",
        type: "address",
        internalType: "address",
      },
      {
        name: "_link",
        type: "address",
        internalType: "address",
      },
      {
        name: "_controller",
        type: "address",
        internalType: "address",
      },
      {
        name: "_controllerVault",
        type: "address",
        internalType: "address",
      },
      {
        name: "_token",
        type: "address",
        internalType: "address",
      },
      {
        name: "_controllerChainSelector",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "receive",
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "acceptOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "controller",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "controllerChainSelector",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "controllerVault",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "depositToFeeTank",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "feeTank",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "generateKey",
    inputs: [
      {
        name: "requestHash",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "fixedNonce",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "operationType",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "payFeesIn",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "linkToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract LinkTokenInterface",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "messageIdToTokenAmount",
    inputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "quoteCrossChainMessage",
    inputs: [
      {
        name: "targetChain",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "payFeesIn",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "includeToken",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "tokenAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "cost",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerAdmin",
    inputs: [
      {
        name: "admin",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "router",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IRouterClient",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "routerAdmins",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setController",
    inputs: [
      {
        name: "_controller",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setControllerChainSelector",
    inputs: [
      {
        name: "_controllerChainSelector",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setControllerVault",
    inputs: [
      {
        name: "_controllerVault",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitReceipt",
    inputs: [
      {
        name: "reqeustMessageId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "idempotencyKey",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "usedTokens",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "payFeesIn",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "token",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IERC20",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawFromFeeTank",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "OwnershipTransferRequested",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ReceiptProcessed",
    inputs: [
      {
        name: "receiptMessageId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "idempotencyKey",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "usedTokens",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RequestProcessed",
    inputs: [
      {
        name: "messageId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "expectedIdempotencyKey",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "payFeesIn",
        type: "uint8",
        indexed: false,
        internalType: "enum ProxyAIRouter.PayFeesIn",
      },
    ],
    anonymous: false,
  },
] as const;

const _bytecode =
  "0x60c06040523480156200001157600080fd5b506040516200245638038062002456833981016040819052620000349162000201565b8585858585853380600081620000915760405162461bcd60e51b815260206004820152601860248201527f43616e6e6f7420736574206f776e657220746f207a65726f000000000000000060448201526064015b60405180910390fd5b600080546001600160a01b0319166001600160a01b0384811691909117909155811615620000c457620000c48162000139565b5050506001600160a01b0395861660805293851660a052600280549386166001600160a01b0319948516179055600380549286169290931691909117909155600480546001600160401b03909316600160a01b026001600160e01b031990931691909316171790555062000292945050505050565b336001600160a01b03821603620001935760405162461bcd60e51b815260206004820152601760248201527f43616e6e6f74207472616e7366657220746f2073656c66000000000000000000604482015260640162000088565b600180546001600160a01b0319166001600160a01b0383811691821790925560008054604051929316917fed8889f560326eb138920d842192f0eb3dd22b4f139c87a2c57538e05bae12789190a350565b80516001600160a01b0381168114620001fc57600080fd5b919050565b60008060008060008060c087890312156200021b57600080fd5b6200022687620001e4565b95506200023660208801620001e4565b94506200024660408801620001e4565b93506200025660608801620001e4565b92506200026660808801620001e4565b60a08801519092506001600160401b03811681146200028457600080fd5b809150509295509295509295565b60805160a0516121276200032f600039600081816102730152818161062001528181610d3f01528181610e6301528181610f660152818161136f0152818161149301526115960152600081816104160152818161068401528181610da201528181610f370152818161100b0152818161105e01528181611109015281816113d20152818161156701528181611655015261170001526121276000f3fe60806040526004361061012e5760003560e01c80638da5cb5b116100ab578063e88fdbe41161006f578063e88fdbe41461039c578063f2fde38b146103c4578063f77c4791146103e4578063f887ea4014610404578063faccafe914610438578063fc0c546a1461045857600080fd5b80638da5cb5b146102ea5780638ee55c4d1461030857806392eefe9b14610349578063b47b76e314610369578063c38c58131461037c57600080fd5b806352dabd0a116100f257806352dabd0a1461021457806355a15a101461023457806357970e931461026157806379ba5097146102955780638a147a6f146102aa57600080fd5b806312f6c0ac1461013a5780631b62799b1461015c578063211485771461018f57806336050539146101af578063510cd61c146101e757600080fd5b3661013557005b600080fd5b34801561014657600080fd5b5061015a610155366004611d6b565b610478565b005b34801561016857600080fd5b5061017c610177366004611d9b565b6104ae565b6040519081526020015b60405180910390f35b34801561019b57600080fd5b5061015a6101aa366004611de1565b610707565b3480156101bb57600080fd5b506003546101cf906001600160a01b031681565b6040516001600160a01b039091168152602001610186565b3480156101f357600080fd5b5061017c610202366004611de1565b60056020526000908152604090205481565b34801561022057600080fd5b5061015a61022f366004611e0a565b610731565b34801561024057600080fd5b5061017c61024f366004611e0a565b60076020526000908152604090205481565b34801561026d57600080fd5b506101cf7f000000000000000000000000000000000000000000000000000000000000000081565b3480156102a157600080fd5b5061015a6107cd565b3480156102b657600080fd5b506102da6102c5366004611de1565b60066020526000908152604090205460ff1681565b6040519015158152602001610186565b3480156102f657600080fd5b506000546001600160a01b03166101cf565b34801561031457600080fd5b5060045461033090600160a01b900467ffffffffffffffff1681565b60405167ffffffffffffffff9091168152602001610186565b34801561035557600080fd5b5061015a610364366004611de1565b610877565b61015a610377366004611e23565b6108a1565b34801561038857600080fd5b5061015a610397366004611de1565b6108c4565b6103af6103aa366004611e23565b6108f0565b60408051928352602083019190915201610186565b3480156103d057600080fd5b5061015a6103df366004611de1565b61091d565b3480156103f057600080fd5b506002546101cf906001600160a01b031681565b34801561041057600080fd5b506101cf7f000000000000000000000000000000000000000000000000000000000000000081565b34801561044457600080fd5b5061015a610453366004611e0a565b61092e565b34801561046457600080fd5b506004546101cf906001600160a01b031681565b610480610a1e565b6004805467ffffffffffffffff909216600160a01b0267ffffffffffffffff60a01b19909216919091179055565b6000606083156105395760408051600180825281830190925290816020015b60408051808201909152600080825260208201528152602001906001900390816104cd575050604080518082019091526004546001600160a01b0316815260208101859052815191925090829060009061052957610529611e55565b602002602001018190525061057a565b6040805160008082526020820190925290610576565b604080518082019091526000808252602082015281526020019060019003908161054f5790505b5090505b60006040518060a001604052808661059d576002546001600160a01b03166105aa565b6003546001600160a01b03165b604080516001600160a01b0392909216602080840191909152815180840382018152928201825291835280516000815280830182529183019190915281018490526060016001888181111561060157610601611e6b565b600181111561061257610612611e6b565b1461061e576000610640565b7f00000000000000000000000000000000000000000000000000000000000000005b6001600160a01b0316815260200161066860405180602001604052806203d090815250610a73565b90526040516320487ded60e01b81529091506001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906320487ded906106bb908a908590600401611ed1565b602060405180830381865afa1580156106d8573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106fc9190611fab565b979650505050505050565b61070f610a1e565b600380546001600160a01b0319166001600160a01b0392909216919091179055565b3360009081526006602052604090205460ff1661078e5760405162461bcd60e51b815260206004820152601660248201527513db9b1e4818591b5a5b8818d85b8819195c1bdcda5d60521b60448201526064015b60405180910390fd5b33600090815260056020526040812080548392906107ad908490611fda565b90915550506004546107ca906001600160a01b0316333084610ab0565b50565b6001546001600160a01b031633146108205760405162461bcd60e51b815260206004820152601660248201527526bab9ba10313290383937b837b9b2b21037bbb732b960511b6044820152606401610785565b60008054336001600160a01b0319808316821784556001805490911690556040516001600160a01b0390921692909183917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e091a350565b61087f610a1e565b600280546001600160a01b0319166001600160a01b0392909216919091179055565b6108be8484848460018111156108b9576108b9611e6b565b610b1b565b50505050565b6108cc610a1e565b6001600160a01b03166000908152600660205260409020805460ff19166001179055565b60008061091086868686600181111561090b5761090b611e6b565b6111c6565b9150915094509492505050565b610925610a1e565b6107ca81611808565b3360009081526006602052604090205460ff1661098d5760405162461bcd60e51b815260206004820152601760248201527f4f6e6c792061646d696e2063616e2077697468647261770000000000000000006044820152606401610785565b336000908152600560205260409020548111156109e35760405162461bcd60e51b8152602060048201526014602482015273496e73756666696369656e74207265736572766560601b6044820152606401610785565b3360009081526005602052604081208054839290610a02908490611ff3565b90915550506004546107ca906001600160a01b031633836118b1565b6000546001600160a01b03163314610a715760405162461bcd60e51b815260206004820152601660248201527527b7363c9031b0b63630b1363290313c9037bbb732b960511b6044820152606401610785565b565b60408051915160248084019190915281518084039091018152604490920190526020810180516001600160e01b03166397a657c960e01b17905290565b6040516001600160a01b03808516602483015283166044820152606481018290526108be9085906323b872dd60e01b906084015b60408051601f198184030181529190526020810180516001600160e01b03166001600160e01b0319909316929092179091526118e6565b60008481526007602052604090205480610b815760405162461bcd60e51b815260206004820152602160248201527f4e6f20746f6b656e732068656c6420666f722074686973206d657373616765496044820152601960fa1b6064820152608401610785565b80831115610bdb5760405162461bcd60e51b815260206004820152602160248201527f5573656420746f6b656e732063616e6e6f7420657863656564206d61782066656044820152606560f81b6064820152608401610785565b6000610be78483611ff3565b90508015610c14573360009081526005602052604081208054839290610c0e908490611fda565b90915550505b604080516001808252818301909252600091816020015b6040805180820190915260008082526020820152815260200190600190039081610c2b575050604080518082019091526004546001600160a01b03168152602081018790528151919250908290600090610c8757610c87611e55565b6020908102919091018101919091526004546040805130938101939093528201899052606082018890526001600160a01b0316608082015260a0810186905260009060c00160408051808303601f1901815260a083019091526003546001600160a01b031660c083015291506000908060e0810160408051601f198184030181529181529082526020820185905281018590526060016001886001811115610d3157610d31611e6b565b14610d3d576000610d5f565b7f00000000000000000000000000000000000000000000000000000000000000005b6001600160a01b03168152602001610d8760405180602001604052806203d090815250610a73565b9052600480546040516320487ded60e01b81529293506000927f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316926320487ded92610df092600160a01b90910467ffffffffffffffff1691879101611ed1565b602060405180830381865afa158015610e0d573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e319190611fab565b90506001876001811115610e4757610e47611e6b565b03610fd9576040516370a0823160e01b815230600482015281907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa158015610eb2573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ed69190611fab565b1015610f205760405162461bcd60e51b8152602060048201526019602482015278496e73756666696369656e74204c494e4b2062616c616e636560381b6044820152606401610785565b60405163095ea7b360e01b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000081166004830152602482018390527f0000000000000000000000000000000000000000000000000000000000000000169063095ea7b3906044016020604051808303816000875af1158015610faf573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610fd39190612006565b50610ff9565b80341015610ff95760405162461bcd60e51b815260040161078590612023565b600454611030906001600160a01b03167f00000000000000000000000000000000000000000000000000000000000000008a6119b8565b6000600188600181111561104657611046611e6b565b036110f657600480546040516396f4e9f960e01b81527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316926396f4e9f9926110ac92600160a01b90910467ffffffffffffffff1691889101611ed1565b6020604051808303816000875af11580156110cb573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906110ef9190611fab565b905061119f565b600480546040516396f4e9f960e01b81527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316926396f4e9f992869261115992600160a01b90920467ffffffffffffffff1691899101611ed1565b60206040518083038185885af1158015611177573d6000803e3d6000fd5b50505050506040513d601f19601f8201168201806040525081019061119c9190611fab565b90505b60008b8152600760205260408120556111b9818b8b611acd565b5050505050505050505050565b60408051306020820152908101859052606081018390526080810184905260009081908190819060a00160408051601f198184030181529082905261120e9291602001612083565b6040516020818303038152906040529050600061123b86600281111561123657611236611e6b565b611b0d565b336000908152600560205260409020549091508111156112ac5760405162461bcd60e51b815260206004820152602660248201527f496e73756666696369656e7420746f6b656e20666f7220736572766963652070604482015265185e5b595b9d60d21b6064820152608401610785565b33600090815260056020526040812080548392906112cb908490611ff3565b90915550506040805160a0810182526002546001600160a01b031660c0808301919091528251808303909101815260e08201835281526020808201859052825160008082529181018452909282019083611347565b60408051808201909152600080825260208201528152602001906001900390816113205790505b508152602001600188600181111561136157611361611e6b565b1461136d57600061138f565b7f00000000000000000000000000000000000000000000000000000000000000005b6001600160a01b031681526020016113b760405180602001604052806203d090815250610a73565b9052600480546040516320487ded60e01b81529293506000927f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316926320487ded9261142092600160a01b90910467ffffffffffffffff1691879101611ed1565b602060405180830381865afa15801561143d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114619190611fab565b9050600187600181111561147757611477611e6b565b03611609576040516370a0823160e01b815230600482015281907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa1580156114e2573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906115069190611fab565b10156115505760405162461bcd60e51b8152602060048201526019602482015278496e73756666696369656e74204c494e4b2062616c616e636560381b6044820152606401610785565b60405163095ea7b360e01b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000081166004830152602482018390527f0000000000000000000000000000000000000000000000000000000000000000169063095ea7b3906044016020604051808303816000875af11580156115df573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906116039190612006565b50611629565b803410156116295760405162461bcd60e51b815260040161078590612023565b600187600181111561163d5761163d611e6b565b036116ed57600480546040516396f4e9f960e01b81527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316926396f4e9f9926116a392600160a01b90910467ffffffffffffffff1691879101611ed1565b6020604051808303816000875af11580156116c2573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906116e69190611fab565b9550611796565b600480546040516396f4e9f960e01b81527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316926396f4e9f992859261175092600160a01b90920467ffffffffffffffff1691889101611ed1565b60206040518083038185885af115801561176e573d6000803e3d6000fd5b50505050506040513d601f19601f820116820180604052508101906117939190611fab565b95505b60008681526007602090815260409182902085905590516bffffffffffffffffffffffff193060601b1691810191909152603481018b9052605481018a90526074016040516020818303038152906040528051906020012094506117fb868689611b8f565b5050505094509492505050565b336001600160a01b038216036118605760405162461bcd60e51b815260206004820152601760248201527f43616e6e6f74207472616e7366657220746f2073656c660000000000000000006044820152606401610785565b600180546001600160a01b0319166001600160a01b0383811691821790925560008054604051929316917fed8889f560326eb138920d842192f0eb3dd22b4f139c87a2c57538e05bae12789190a350565b6040516001600160a01b0383166024820152604481018290526118e190849063a9059cbb60e01b90606401610ae4565b505050565b600061193b826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b0316611bce9092919063ffffffff16565b8051909150156118e157808060200190518101906119599190612006565b6118e15760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b6064820152608401610785565b801580611a325750604051636eb1769f60e11b81523060048201526001600160a01b03838116602483015284169063dd62ed3e90604401602060405180830381865afa158015611a0c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611a309190611fab565b155b611a9d5760405162461bcd60e51b815260206004820152603660248201527f5361666545524332303a20617070726f76652066726f6d206e6f6e2d7a65726f60448201527520746f206e6f6e2d7a65726f20616c6c6f77616e636560501b6064820152608401610785565b6040516001600160a01b0383166024820152604481018290526118e190849063095ea7b360e01b90606401610ae4565b81837f3472c324864d9ac03ed5f12b363f0175c178e0d4bf61b6a445dad02296f9a25c83604051611b0091815260200190565b60405180910390a3505050565b600080826002811115611b2257611b22611e6b565b03611b365750674563918244f40000919050565b6001826002811115611b4a57611b4a611e6b565b03611b5e5750678ac7230489e80000919050565b6002826002811115611b7257611b72611e6b565b03611b8757506801158e460913d00000919050565b506000919050565b827f2090b227eceabdd08e26957fc5224f002c8a1fd3161880af69444331b8b0ba8a8383604051611bc19291906120a5565b60405180910390a2505050565b6060611bdd8484600085611be5565b949350505050565b606082471015611c465760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b6064820152608401610785565b600080866001600160a01b03168587604051611c6291906120c2565b60006040518083038185875af1925050503d8060008114611c9f576040519150601f19603f3d011682016040523d82523d6000602084013e611ca4565b606091505b50915091506106fc8783838760608315611d1f578251600003611d18576001600160a01b0385163b611d185760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401610785565b5081611bdd565b611bdd8383815115611d345781518083602001fd5b8060405162461bcd60e51b815260040161078591906120de565b803567ffffffffffffffff81168114611d6657600080fd5b919050565b600060208284031215611d7d57600080fd5b611d8682611d4e565b9392505050565b80151581146107ca57600080fd5b60008060008060808587031215611db157600080fd5b611dba85611d4e565b9350602085013592506040850135611dd181611d8d565b9396929550929360600135925050565b600060208284031215611df357600080fd5b81356001600160a01b0381168114611d8657600080fd5b600060208284031215611e1c57600080fd5b5035919050565b60008060008060808587031215611e3957600080fd5b5050823594602084013594506040840135936060013592509050565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052602160045260246000fd5b60005b83811015611e9c578181015183820152602001611e84565b50506000910152565b60008151808452611ebd816020860160208601611e81565b601f01601f19169290920160200192915050565b6000604067ffffffffffffffff8516835260208181850152845160a083860152611efe60e0860182611ea5565b905081860151603f1980878403016060880152611f1b8383611ea5565b88860151888203830160808a01528051808352908601945060009350908501905b80841015611f6e57845180516001600160a01b0316835286015186830152938501936001939093019290860190611f3c565b5060608901516001600160a01b031660a08901526080890151888203830160c08a01529550611f9d8187611ea5565b9a9950505050505050505050565b600060208284031215611fbd57600080fd5b5051919050565b634e487b7160e01b600052601160045260246000fd5b80820180821115611fed57611fed611fc4565b92915050565b81810381811115611fed57611fed611fc4565b60006020828403121561201857600080fd5b8151611d8681611d8d565b60208082526022908201527f496e73756666696369656e74206e617469766520746f6b656e20666f72206665604082015261657360f01b606082015260800190565b600281106107ca57634e487b7160e01b600052602160045260246000fd5b61208c83612065565b828152604060208201526000611bdd6040830184611ea5565b828152604081016120b583612065565b8260208301529392505050565b600082516120d4818460208701611e81565b9190910192915050565b602081526000611d866020830184611ea556fea264697066735822122047be452516b882fc7b488db3a7d6e11311d5b370044f7a3b5958259966e2c4e364736f6c63430008140033";

type CustomRouterWithAttesterConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: CustomRouterWithAttesterConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class CustomRouterWithAttester__factory extends ContractFactory {
  constructor(...args: CustomRouterWithAttesterConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _router: string,
    _link: string,
    _controller: string,
    _controllerVault: string,
    _token: string,
    _controllerChainSelector: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<CustomRouterWithAttester> {
    return super.deploy(
      _router,
      _link,
      _controller,
      _controllerVault,
      _token,
      _controllerChainSelector,
      overrides || {}
    ) as Promise<CustomRouterWithAttester>;
  }
  override getDeployTransaction(
    _router: string,
    _link: string,
    _controller: string,
    _controllerVault: string,
    _token: string,
    _controllerChainSelector: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _router,
      _link,
      _controller,
      _controllerVault,
      _token,
      _controllerChainSelector,
      overrides || {}
    );
  }
  override attach(address: string): CustomRouterWithAttester {
    return super.attach(address) as CustomRouterWithAttester;
  }
  override connect(signer: Signer): CustomRouterWithAttester__factory {
    return super.connect(signer) as CustomRouterWithAttester__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CustomRouterWithAttesterInterface {
    return new utils.Interface(_abi) as CustomRouterWithAttesterInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CustomRouterWithAttester {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as CustomRouterWithAttester;
  }
}
