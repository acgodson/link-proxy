// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";

interface IController {
    function submitReceipt(
        bytes32 idempotencyKey,
        address token,
        uint256 usedTokens
    ) external;
}

contract ControllerVault is CCIPReceiver {
    using SafeERC20 for IERC20;

    address public controller;
    mapping(address => mapping(address => uint256)) public routerDeposits;

    event TokensWithdrawn(
        address indexed router,
        address indexed token,
        uint256 amount
    );

    constructor(address router) CCIPReceiver(router) {}

    function setController(address _controller) external {
        // TODO: Add necessary access control
        require(controller == address(0), "Controller already set");
        controller = _controller;
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        require(controller != address(0), "Controller not set");

        (
            address depositorRouter,
            bytes32 idempotencyKey,
            address token,
            uint256 usedTokens
        ) = abi.decode(message.data, (address, bytes32, address, uint256));

        require(
            message.destTokenAmounts.length == 1,
            "Expected 1 token transfer"
        );

        // Process the received token
        address receivedToken = message.destTokenAmounts[0].token;
        uint256 receivedAmount = message.destTokenAmounts[0].amount;

        require(receivedToken == token, "Token mismatch");
        require(receivedAmount >= usedTokens, "Insufficient tokens received");

        // Call controller to submit receipt
        IController(controller).submitReceipt(
            idempotencyKey,
            token,
            usedTokens
        );
        routerDeposits[depositorRouter][token] += usedTokens;

         IERC20(token).safeTransfer(controller, usedTokens);
    }

    // function withdrawTokens(address token, uint256 amount) external {
    //     uint256 availableAmount = routerDeposits[msg.sender][token];
    //     require(amount <= availableAmount, "Insufficient balance");

    //     routerDeposits[msg.sender][token] -= amount;
    //     IERC20(token).safeTransfer(msg.sender, amount);

    //     emit TokensWithdrawn(msg.sender, token, amount);
    // }
}
