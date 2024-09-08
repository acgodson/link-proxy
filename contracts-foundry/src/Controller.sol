// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ControllerVault.sol";
// import "forge-std/console.sol";

contract Controller is CCIPReceiver {
  using SafeERC20 for IERC20;

  enum OperationType {
    Low,
    Medium,
    High
  }
  enum FunctionType {
    GenerateKey,
    SubmitReceipt
  }

  struct IdempotencyData {
    address proxy;
    OperationType predictedTokenUsage;
    bool processed;
    uint256 expirationTime;
  }

  uint256 public expirationPeriod = 1 days;
  ControllerVault public vault;

  mapping(address => bool) public authorizedRouters;
  mapping(bytes32 => IdempotencyData) public idempotencyKeys;
  mapping(bytes32 => bytes32) public requestHashToKey;

  event KeyGenerated(
    bytes32 indexed idempotencyKey,
    address proxy,
    uint64 sourceChainSelector,
    address sourceAddress
  );
  event ReceiptSubmitted(bytes32 indexed idempotencyKey, address token, uint256 usedTokens);

  constructor(address router) CCIPReceiver(router) {}

  function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
    (FunctionType functionType, bytes memory functionPayload) = abi.decode(
      message.data,
      (FunctionType, bytes)
    );

    if (functionType == FunctionType.GenerateKey) {
      _handleGenerateKey(
        functionPayload,
        message.sourceChainSelector,
        abi.decode(message.sender, (address))
      );
    } else {
      revert("Unsupported function");
    }
  }

  function setVault(address _vault) external {
    // TODO: Add necessary access control
    require(address(vault) == address(0), "Vault already set");
    vault = ControllerVault(_vault);
  }

  function registerRouter(address router) external {
    // TODO: Add necessary access control
    authorizedRouters[router] = true;
  }

  function _handleGenerateKey(
    bytes memory functionPayload,
    uint64 sourceChainSelector,
    address sourceAddress
  ) internal {
    (
      address proxy,
      bytes32 requestHash,
      OperationType predictedTokenUsage,
      uint256 fixedNonce
    ) = abi.decode(functionPayload, (address, bytes32, OperationType, uint256));

    bytes32 idempotencyKey = keccak256(abi.encodePacked(proxy, requestHash, fixedNonce));

    require(!idempotencyKeys[idempotencyKey].processed, "Key already processed");

    idempotencyKeys[idempotencyKey] = IdempotencyData({
      proxy: proxy,
      predictedTokenUsage: predictedTokenUsage,
      processed: false,
      expirationTime: block.timestamp + expirationPeriod
    });

    requestHashToKey[requestHash] = idempotencyKey;

    emit KeyGenerated(idempotencyKey, proxy, sourceChainSelector, sourceAddress);
  }

  function submitReceipt(bytes32 idempotencyKey, address token, uint256 usedTokens) external {
    IdempotencyData storage data = idempotencyKeys[idempotencyKey];
    require(!data.processed, "Key already processed");
    // require(block.timestamp <= data.expirationTime, "Key expired");

    data.processed = true;
    emit ReceiptSubmitted(idempotencyKey, token, usedTokens);
  }

  function getIdempotencyData(
    bytes32 key
  )
    public
    view
    returns (
      address proxy,
      OperationType predictedTokenUsage,
      bool processed,
      uint256 expirationTime
    )
  {
    IdempotencyData storage data = idempotencyKeys[key];
    return (data.proxy, data.predictedTokenUsage, data.processed, data.expirationTime);
  }

  function cleanUpExpiredKeys(bytes32[] calldata keys) external {
    for (uint256 i = 0; i < keys.length; i++) {
      bytes32 key = keys[i];
      if (idempotencyKeys[key].expirationTime < block.timestamp) {
        delete idempotencyKeys[key];
      }
    }
  }

  receive() external payable {}
}
