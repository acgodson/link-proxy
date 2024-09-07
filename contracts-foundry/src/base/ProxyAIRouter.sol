// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";

abstract contract ProxyAIRouter is OwnerIsCreator {
  using SafeERC20 for IERC20;

  uint256 constant GAS_LIMIT = 250_000;

  address public controller;
  address public controllerVault;
  IERC20 public token;
  uint64 public controllerChainSelector;
  IRouterClient public immutable router;
  LinkTokenInterface public immutable linkToken;

  mapping(address => uint256) public feeTank;
  mapping(address => bool) public routerAdmins;
  mapping(bytes32 => uint256) public messageIdToTokenAmount;

  enum OperationType {
    Low,
    Medium,
    High
  }
  enum FunctionType {
    GenerateKey,
    SubmitReceipt
  }
  enum PayFeesIn {
    Native,
    LINK
  }

  constructor(
    address _router,
    address _linkToken,
    address _controller,
    address _controllerVault,
    address _token,
    uint64 _controllerChainSelector
  ) {
    router = IRouterClient(_router);
    linkToken = LinkTokenInterface(_linkToken);
    controller = _controller;
    controllerVault = _controllerVault;
    token = IERC20(_token);
    controllerChainSelector = _controllerChainSelector;
  }

  function setController(address _controller) external onlyOwner {
    controller = _controller;
  }

  function setControllerVault(address _controllerVault) external onlyOwner {
    controllerVault = _controllerVault;
  }

  function setControllerChainSelector(uint64 _controllerChainSelector) external onlyOwner {
    controllerChainSelector = _controllerChainSelector;
  }

  function registerAdmin(address admin) external onlyOwner {
    routerAdmins[admin] = true;
  }

  function depositToFeeTank(uint256 amount) external {
    require(routerAdmins[msg.sender], "Only admin can deposit");
    feeTank[msg.sender] += amount;
    token.safeTransferFrom(msg.sender, address(this), amount);
  }

  function withdrawFromFeeTank(uint256 amount) external {
    require(routerAdmins[msg.sender], "Only admin can withdraw");
    require(feeTank[msg.sender] >= amount, "Insufficient reserve");
    feeTank[msg.sender] -= amount;
    token.safeTransfer(msg.sender, amount);
  }

  function generateKey(
    bytes32 requestHash,
    uint256 fixedNonce,
    uint256 operationType,
    uint256 payFeesIn
  ) external payable virtual returns (bytes32, bytes32) {
    return _generateKey(requestHash, fixedNonce, operationType, PayFeesIn(payFeesIn));
  }

  function submitReceipt(
    bytes32 reqeustMessageId,
    bytes32 idempotencyKey,
    uint256 usedTokens,
    uint256 payFeesIn
  ) external payable virtual {
    _submitReceipt(reqeustMessageId, idempotencyKey, usedTokens, PayFeesIn(payFeesIn));
  }

  function _generateKey(
    bytes32 requestHash,
    uint256 fixedNonce,
    uint256 operationType,
    PayFeesIn payFeesIn
  ) internal returns (bytes32 messageId, bytes32 expectedIdempotencyKey) {
   
    bytes memory payload = abi.encode(
      FunctionType.GenerateKey,
      abi.encode(address(this), requestHash, operationType, fixedNonce)
    );

    uint256 maxFee = calculateMaxFee(OperationType(operationType));

    require(feeTank[msg.sender] >= maxFee, "Insufficient token for service payment");
    feeTank[msg.sender] -= maxFee;

    Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
      receiver: abi.encode(controller),
      data: payload,
      tokenAmounts: new Client.EVMTokenAmount[](0),
      extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: GAS_LIMIT})),
      feeToken: payFeesIn == PayFeesIn.LINK ? address(linkToken) : address(0)
    });

    uint256 fees = router.getFee(controllerChainSelector, message);

    if (payFeesIn == PayFeesIn.LINK) {
      require(linkToken.balanceOf(address(this)) >= fees, "Insufficient LINK balance");
      linkToken.approve(address(router), fees);
    } else {
      require(msg.value >= fees, "Insufficient native token for fees");
    }

    if (payFeesIn == PayFeesIn.LINK) {
      messageId = router.ccipSend(controllerChainSelector, message);
    } else {
      messageId = router.ccipSend{value: fees}(controllerChainSelector, message);
    }

    messageIdToTokenAmount[messageId] = maxFee;

    // Predict the idempotency key that will be generated on the destination chain
    expectedIdempotencyKey = keccak256(abi.encodePacked(address(this), requestHash, fixedNonce));

    _onRequest(messageId, expectedIdempotencyKey, payFeesIn);

    return (messageId, expectedIdempotencyKey);
  }

  function _submitReceipt(
    bytes32 requestMessageId,
    bytes32 idempotencyKey,
    uint256 usedTokens,
    PayFeesIn payFeesIn
  ) internal {
    uint256 maxFee = messageIdToTokenAmount[requestMessageId];
    require(maxFee > 0, "No tokens held for this messageId");
    require(usedTokens <= maxFee, "Used tokens cannot exceed max fee");

    uint256 refund = maxFee - usedTokens;
    if (refund > 0) {
      feeTank[msg.sender] += refund;
    }

    Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
    tokenAmounts[0] = Client.EVMTokenAmount({token: address(token), amount: usedTokens});

    bytes memory payload = abi.encode(
      address(this), // depositor router address
      requestMessageId,
      idempotencyKey,
      address(token),
      usedTokens
    );

    Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
      receiver: abi.encode(controllerVault),
      data: payload,
      tokenAmounts: tokenAmounts,
      extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: GAS_LIMIT})),
      feeToken: payFeesIn == PayFeesIn.LINK ? address(linkToken) : address(0)
    });

    uint256 fees = router.getFee(controllerChainSelector, message);

    if (payFeesIn == PayFeesIn.LINK) {
      require(linkToken.balanceOf(address(this)) >= fees, "Insufficient LINK balance");
      linkToken.approve(address(router), fees);
    } else {
      require(msg.value >= fees, "Insufficient native token for fees");
    }

    // Approve the router to spend the tokens
    token.safeApprove(address(router), usedTokens);

    bytes32 messageId;
    if (payFeesIn == PayFeesIn.LINK) {
      messageId = router.ccipSend(controllerChainSelector, message);
    } else {
      messageId = router.ccipSend{value: fees}(controllerChainSelector, message);
    }

    delete messageIdToTokenAmount[requestMessageId];

    _onReceipt(messageId, idempotencyKey, usedTokens);
  }

  function _onRequest(
    bytes32 messageId,
    bytes32 idempotencyKey,
    PayFeesIn payFeesIn
  ) internal virtual {
    // Default implementation (if any)
  }

  function _onReceipt(
    bytes32 receiptMessageId,
    bytes32 idempotencyKey,
    uint256 usedTokens
  ) internal virtual {
    // Default implementation (if any)
  }

  function quoteCrossChainMessage(
    uint64 targetChain,
    uint256 payFeesIn,
    bool includeToken,
    uint256 tokenAmount
  ) public view returns (uint256 cost) {
    Client.EVMTokenAmount[] memory tokenAmounts;
    if (includeToken) {
      tokenAmounts = new Client.EVMTokenAmount[](1);
      tokenAmounts[0] = Client.EVMTokenAmount({token: address(token), amount: tokenAmount});
    } else {
      tokenAmounts = new Client.EVMTokenAmount[](0);
    }

    Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
      receiver: abi.encode(includeToken ? controllerVault : controller),
      data: new bytes(0),
      tokenAmounts: tokenAmounts,
      extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: GAS_LIMIT})),
      feeToken: PayFeesIn(payFeesIn) == PayFeesIn.LINK ? address(linkToken) : address(0)
    });

    cost = router.getFee(targetChain, message);
  }

  function calculateMaxFee(OperationType operationType) internal pure returns (uint256) {
    if (operationType == OperationType.Low) {
      return 5 * 1e18; // 5 tokens
    } else if (operationType == OperationType.Medium) {
      return 10 * 1e18; // 10 tokens
    } else if (operationType == OperationType.High) {
      return 20 * 1e18; // 20 tokens
    }
    return 0;
  }

  receive() external payable {}
}
