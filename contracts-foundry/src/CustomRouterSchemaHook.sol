// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@ethsign/sign-protocol-evm/src/interfaces/ISPHook.sol";
import "./CustomRouter.sol";

contract CustomRouterSchemaHook is ISPHook {
  CustomRouter public customRouter;

  constructor(address _customRouter) {
    customRouter = CustomRouter(_customRouter);
  }

  function didReceiveAttestation(
    address attester,
    uint64 schemaId,
    uint64 attestationId,
    bytes calldata extraData
  ) external payable {
    // Parse the extraData to get messageId, idempotencyKey, and amount
    (bytes32 messageId, bytes32 idempotencyKey, uint256 amount) = abi.decode(
      extraData,
      (bytes32, bytes32, uint256)
    );

    // Call submitReceipt on CustomRouter
    customRouter.submitReceipt(messageId, idempotencyKey, amount);
  }

  function didReceiveAttestation(
    address attester,
    uint64 schemaId,
    uint64 attestationId,
    IERC20 resolverFeeERC20Token,
    uint256 resolverFeeERC20Amount,
    bytes calldata extraData
  ) external view {
    revert("Not implemented");
  }

  function didReceiveRevocation(
    address attester,
    uint64 schemaId,
    uint64 attestationId,
    bytes calldata extraData
  ) external payable {
    // TODO: perform refunds back to users tank in the customRouter
  }

  function didReceiveRevocation(
    address attester,
    uint64 schemaId,
    uint64 attestationId,
    IERC20 resolverFeeERC20Token,
    uint256 resolverFeeERC20Amount,
    bytes calldata extraData
  ) external view {
    revert("Not implemented");
  }
}
