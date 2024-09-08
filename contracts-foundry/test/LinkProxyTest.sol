// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {CCIPLocalSimulator, IRouterClient, BurnMintERC677Helper} from "@chainlink/local/src/ccip/CCIPLocalSimulator.sol";
import {ProxyAIRouter} from "../src/base/ProxyAIRouter.sol";
import {Controller} from "../src/Controller.sol";
import {ControllerVault} from "../src/ControllerVault.sol";
import {CustomRouter} from "../src/CustomRouter.sol";
import "forge-std/console.sol";

contract ProxyAIRouterTest is Test {
  CCIPLocalSimulator public ccipLocalSimulator;
  CustomRouter public sourceRouter;
  Controller public targetController;
  ControllerVault public targetVault;

  uint64 public destinationChainSelector;
  BurnMintERC677Helper public ccipBnMToken;
  IRouterClient public sourceRouterClient;
  IRouterClient public targetRouterClient;

  function setUp() public {
    ccipLocalSimulator = new CCIPLocalSimulator();

    (
      uint64 chainSelector,
      IRouterClient _sourceRouterClient,
      IRouterClient _targetRouterClient,
      ,
      ,
      BurnMintERC677Helper ccipBnM,

    ) = ccipLocalSimulator.configuration();

    destinationChainSelector = chainSelector;
    ccipBnMToken = ccipBnM;
    sourceRouterClient = _sourceRouterClient;
    targetRouterClient = _targetRouterClient;

    // Deploy source contracts
    sourceRouter = new CustomRouter(
      address(sourceRouterClient),
      address(ccipBnMToken), //supposed to be Link Token
      address(0), // Controller address (will be set later)
      address(0), // ControllerVault address (will be set later)
      address(ccipBnMToken),
      destinationChainSelector
    );

    // Deploy target contracts
    targetController = new Controller(address(targetRouterClient));
    targetVault = new ControllerVault(address(targetRouterClient));

    // Set up relationships
    targetController.setVault(address(targetVault));
    targetVault.setController(address(targetController));
    sourceRouter.setController(address(targetController));
    sourceRouter.setControllerVault(address(targetVault));

    // Register the router as an authorized router in the controller
    targetController.registerRouter(address(targetRouterClient));

    // Fund contracts
    deal(address(sourceRouter), 100 ether);
    deal(address(targetController), 100 ether);
    deal(address(targetVault), 100 ether);
  }

  function test_crossChainKeyGenerationAndTokenTransfer() public {
    // Prepare test data
    bytes32 requestHash = keccak256("test request");
    uint256 fixedNonce = 12345;
    ProxyAIRouter.OperationType operationType = ProxyAIRouter.OperationType.Low;

    // Use drip function to get tokens
    uint256 targetAmount = 2 * 1e18;
    uint256 amount = 0;
    uint256 loopCount = 0;
    while (amount < targetAmount && loopCount < 3) {
      ccipBnMToken.drip(address(this));
      amount = ccipBnMToken.balanceOf(address(this));
      loopCount++;
    }
    ccipBnMToken.approve(address(sourceRouter), amount);

    // Register this contract as an admin and deposit to fee tank
    sourceRouter.registerAdmin(address(this));
    sourceRouter.depositToFeeTank(amount);

    // Ensure we have enough balance in the fee tank
    uint256 feeTankBalance = sourceRouter.feeTank(address(this));
    console.log("Fee tank balance:", feeTankBalance);

    // Generate key and send cross-chain message
    uint256 messageCost = sourceRouter.quoteCrossChainMessage(
      destinationChainSelector,
      uint256(ProxyAIRouter.PayFeesIn.Native),
      false, // No token transfer for key generation
      0
    );

    (bytes32 requestMessageId, bytes32 onchainPredictedKey) = sourceRouter.generateKey{
      value: messageCost
    }(requestHash, fixedNonce, uint256(operationType), uint256(ProxyAIRouter.PayFeesIn.Native));

    // Calculate expected idempotency key
    bytes32 offchainPredictedKey = keccak256(
      abi.encodePacked(address(sourceRouter), requestHash, fixedNonce)
    );

    // bytes32 storedIdempotencyKey = targetController.requestHashToKey(requestHash);
    // console.log("Stored idempotency key:");
    // console.logBytes32(storedIdempotencyKey);
    // console.logBytes32(offchainPredictedKey);
    // Verify key generation on the target chain
    (
      address proxy,
      Controller.OperationType predictedTokenUsage,
      bool processed,
      uint256 expirationTime
    ) = targetController.getIdempotencyData(onchainPredictedKey);

    assertEq(onchainPredictedKey, offchainPredictedKey, "Idompotency Key mismatch");
    assertEq(proxy, address(sourceRouter), "Proxy address mismatch");

    assertEq(uint(predictedTokenUsage), uint(operationType), "Operation type mismatch");
    assertFalse(processed, "Key should not be processed yet");
    assertTrue(expirationTime > block.timestamp, "Expiration time should be in the future");

    // Check balances before receipt submission
    uint256 sourceRouterBalanceBefore = ccipBnMToken.balanceOf(address(sourceRouter));
    uint256 targetVaultBalanceBefore = ccipBnMToken.balanceOf(address(targetVault));
    uint256 targetControllerBalanceBefore = ccipBnMToken.balanceOf(address(targetController));

    console.log("Source Router balance before:", sourceRouterBalanceBefore);
    console.log("Target Vault balance before:", targetVaultBalanceBefore);
    console.log("Target Controller balance before:", targetControllerBalanceBefore);

    // Submit receipt
    uint256 usedTokens = 1 * 1e18;
    messageCost = sourceRouter.quoteCrossChainMessage(
      destinationChainSelector,
      uint256(ProxyAIRouter.PayFeesIn.Native),
      true, // Include token transfer for receipt submission
      usedTokens
    );

    sourceRouter.submitReceipt{value: messageCost}(
      requestMessageId,
      onchainPredictedKey,
      usedTokens,
      uint256(ProxyAIRouter.PayFeesIn.Native),
      address(this)
    );

    // Check balances after receipt submission
    uint256 sourceRouterBalanceAfter = ccipBnMToken.balanceOf(address(sourceRouter));
    uint256 targetVaultBalanceAfter = ccipBnMToken.balanceOf(address(targetVault));
    uint256 targetControllerBalanceAfter = ccipBnMToken.balanceOf(address(targetController));

    console.log("Source Router balance after:", sourceRouterBalanceAfter);
    console.log("Target Vault balance after:", targetVaultBalanceAfter);
    console.log("Target Controller balance after:", targetControllerBalanceAfter);

    // // Verify token transfer and receipt processing
    uint256 controllerBalance = ccipBnMToken.balanceOf(address(targetController));
    assertEq(controllerBalance, usedTokens, "Token transfer failed");

    // (, , bool isProcessed, ) = targetController.getIdempotencyData(onchainPredictedKey);
    // assertTrue(isProcessed, "Key should be marked as processed");
    console.log("test Completed");
  }
}
