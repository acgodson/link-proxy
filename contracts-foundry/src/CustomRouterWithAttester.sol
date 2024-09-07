// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./base/ProxyAIRouter.sol";

contract CustomRouterWithAttester is ProxyAIRouter {
  event RequestProcessed(
    bytes32 indexed messageId,
    bytes32 expectedIdempotencyKey,
    PayFeesIn payFeesIn
  );
  event ReceiptProcessed(
    bytes32 indexed receiptMessageId,
    bytes32 indexed idempotencyKey,
    uint256 usedTokens
  );

  constructor(
    address _router,
    address _link,
    address _controller,
    address _controllerVault,
    address _token,
    uint64 _controllerChainSelector
  )
    ProxyAIRouter(_router, _link, _controller, _controllerVault, _token, _controllerChainSelector)
  {}

  function _onRequest(
    bytes32 messageId,
    bytes32 idempotencyKey,
    PayFeesIn payFeesIn
  ) internal override {
    emit RequestProcessed(messageId, idempotencyKey, payFeesIn);
  }

  function _onReceipt(
    bytes32 receiptMessageId,
    bytes32 idempotencyKey,
    uint256 usedTokens
  ) internal override {
    emit ReceiptProcessed(receiptMessageId, idempotencyKey, usedTokens);
  }
}
