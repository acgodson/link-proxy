// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@ethsign/sign-protocol-evm/src/interfaces/ISPHook.sol";
import {ISP} from "@ethsign/sign-protocol-evm/src/interfaces/ISP.sol";
import "@ethsign/sign-protocol-evm/src/models/Attestation.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

import {CustomRouter, IERC20 as CustomIERC20} from "./CustomRouter.sol";

contract CustomRouterSchemaHook is ISPHook, AutomationCompatibleInterface {
    CustomRouter public customRouter;
    ISP public spInstance = ISP(0x878c92FD89d8E0B93Dc0a3c907A2adc7577e39c5);

    struct PreSubmission {
        bytes32 requestMessageId;
        bytes32 idempotencyKey;
        uint256 usedTokens;
        uint256 payFeesIn;
        address sender;
        uint256 timestamp;
    }

    constructor(address _customRouter) {
        customRouter = CustomRouter(payable(_customRouter));
    }

    mapping(bytes32 => PreSubmission) public preSubmissions;
    bytes32[] public allRequestMessageIds;

    function preSubmit(
        bytes32 requestMessageId,
        bytes32 idempotencyKey,
        uint256 usedTokens,
        uint256 payFeesIn,
        address sender,
        uint256 timestamp
    ) internal {
        preSubmissions[requestMessageId] = PreSubmission({
            requestMessageId: requestMessageId,
            idempotencyKey: idempotencyKey,
            usedTokens: usedTokens,
            payFeesIn: payFeesIn,
            sender: sender,
            timestamp: timestamp
        });
        allRequestMessageIds.push(requestMessageId);
    }

    function didReceiveAttestation(
        address attester,
        uint64, //schemaId,
        uint64 attestationId,
        bytes calldata //calldata extraData
    ) external payable {
        // Get the attestation from the Sign Protocol contract
        Attestation memory attestation = spInstance.getAttestation(
            attestationId
        );

        // Decode the attestation data
        (
            bytes memory messageID,
            bytes memory idempotencyKey,
            uint256 amount
        ) = abi.decode(attestation.data, (bytes, bytes, uint256));

        // Convert bytes back to bytes32 if needed
        bytes32 messageID32 = bytesToBytes32(messageID);
        bytes32 idempotencyKey32 = bytesToBytes32(idempotencyKey);

        preSubmit(
            messageID32,
            idempotencyKey32,
            amount,
            1,
            attester,
            attestation.attestTimestamp
        );
    }

    function didReceiveAttestation(
        address attester,
        uint64, // schemaId,
        uint64 attestationId,
        IERC20, // resolverFeeERC20Token,
        uint256, //resolverFeeERC20Amount,
        bytes calldata //extraData
    ) external view {}

    function didReceiveRevocation(
        address, //attester,
        uint64, //schemaId,
        uint64 attestationId,
        bytes calldata //extraData
    ) external payable {
        // TODO: perform refunds back to users tank in the customRouter
    }

    function didReceiveRevocation(
        address, // attester,
        uint64, //schemaId,
        uint64 attestationId,
        IERC20, // resolverFeeERC20Token,
        uint256, // resolverFeeERC20Amount,
        bytes calldata //extraData
    ) external view {}

    //For Debugging
    function getPreSubmission(
        bytes32 requestMessageId
    )
        public
        view
        returns (
            bytes32 _requestMessageId,
            bytes32 idempotencyKey,
            uint256 usedTokens,
            uint256 payFeesIn,
            address sender,
            uint256 timestamp
        )
    {
        PreSubmission memory submission = preSubmissions[requestMessageId];
        return (
            submission.requestMessageId,
            submission.idempotencyKey,
            submission.usedTokens,
            submission.payFeesIn,
            submission.sender,
            submission.timestamp
        );
    }

    /// Chainlink Automation Interface functions
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view returns (bool upkeepNeeded, bytes memory performData) {
        bytes32[] memory readySubmissions = new bytes32[](
            allRequestMessageIds.length
        );
        uint256 count = 0;

        for (uint256 i = 0; i < allRequestMessageIds.length; i++) {
            bytes32 requestMessageId = allRequestMessageIds[i];
            PreSubmission memory submission = preSubmissions[requestMessageId];
            if (
                submission.timestamp != 0 &&
                block.timestamp >= submission.timestamp + 30 minutes
            ) {
                readySubmissions[count] = requestMessageId;
                count++;
            }
        }

        upkeepNeeded = count > 0;
        performData = abi.encode(readySubmissions, count);
    }

    function performUpkeep(bytes calldata performData) external override {
        (bytes32[] memory readySubmissions, uint256 count) = abi.decode(
            performData,
            (bytes32[], uint256)
        );

        for (uint256 i = 0; i < count; i++) {
            bytes32 requestMessageId = readySubmissions[i];
            PreSubmission memory submission = preSubmissions[requestMessageId];

            if (
                submission.timestamp != 0 &&
                block.timestamp >= submission.timestamp + 30 minutes
            ) {
                customRouter.submitReceipt(
                    submission.requestMessageId,
                    submission.idempotencyKey,
                    submission.usedTokens,
                    submission.payFeesIn,
                    submission.sender
                );
                delete preSubmissions[requestMessageId];
                _removeRequestMessageId(requestMessageId);
            }
        }
    }

    function _removeRequestMessageId(bytes32 requestMessageId) internal {
        for (uint256 i = 0; i < allRequestMessageIds.length; i++) {
            if (allRequestMessageIds[i] == requestMessageId) {
                allRequestMessageIds[i] = allRequestMessageIds[
                    allRequestMessageIds.length - 1
                ];
                allRequestMessageIds.pop();
                break;
            }
        }
    }

    function bytesToBytes32(
        bytes memory _data
    ) internal pure returns (bytes32 result) {
        require(_data.length == 32, "Invalid input length");
        assembly {
            result := mload(add(_data, 32))
        }
    }
}
