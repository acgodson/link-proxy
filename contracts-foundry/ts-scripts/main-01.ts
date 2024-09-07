import { ethers } from "ethers";
import { SupportedNetworks, getNetworkConfig, getDummyTokensFromNetwork } from "./helpers/config";
import {
  getWallet,
  getController,
  getControllerVault,
  getCustomRouter,
  wait,
  requestTokensFromFaucet,
  areRelationshipsVerified,
  setRelationshipsVerified,
  getAccount,
} from "./helpers/utils";
import { deployController, deployControllerVault, deployCustomRouter } from "./helpers/deploy";
import {
  Controller,
  ControllerVault,
  CustomRouter,
  Mock_Token__factory as ERC20__factory,
} from "./ethers-contracts";

async function setupEnvironment(
  sourceNetwork: SupportedNetworks,
  targetNetwork: SupportedNetworks
) {
  let controller: Controller, controllerVault: ControllerVault, customRouter: CustomRouter;

  if (!(await areRelationshipsVerified())) {
    console.log("Relationships not verified. Deploying new contracts...");
    // Deploy contracts
    controller = await deployController(targetNetwork);
    controllerVault = await deployControllerVault(targetNetwork);
    const { ccipBnM } = getDummyTokensFromNetwork(sourceNetwork);
    customRouter = await deployCustomRouter(sourceNetwork, ccipBnM, targetNetwork);

    // Set up relationships
    await controller.setVault(controllerVault.address).then(wait);
    await controllerVault.setController(controller.address).then(wait);
    await customRouter.setController(controller.address).then(wait);
    await customRouter.setControllerVault(controllerVault.address).then(wait);

    // Verify relationships
    console.log("Verifying relationships...");
    const controllerVaultAddress = await controller.vault();
    const vaultControllerAddress = await controllerVault.controller();
    console.assert(
      controllerVaultAddress === controllerVault.address,
      "Controller vault address mismatch"
    );
    console.assert(
      vaultControllerAddress === controller.address,
      "Vault controller address mismatch"
    );

    // Register the router as an authorized router
    const sourceConfig = getNetworkConfig(sourceNetwork);
    await controller.registerRouter(sourceConfig.routerAddress).then(wait);

    // Register admin
    await customRouter.registerAdmin(getWallet(sourceNetwork).address).then(wait);

    await setRelationshipsVerified(true);
    console.log("Setup completed. Relationships verified.");
  } else {
    console.log("Relationships already verified. Skipping deployment.");
    controller = await getController(targetNetwork);
    controllerVault = await getControllerVault(targetNetwork);
    customRouter = await getCustomRouter(sourceNetwork);
  }

  return { controller, controllerVault, customRouter };
}

async function performCrossChainOperation(
  sourceNetwork: SupportedNetworks,
  targetNetwork: SupportedNetworks,
  controller: Controller,
  controllerVault: ControllerVault,
  customRouter: CustomRouter
) {
  // Prepare test data
  const requestHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test request"));
  const fixedNonce = 12346;
  const operationType = 0; // Low

  // Request tokens from faucet
  const targetAmount = ethers.utils.parseEther("5");
  await requestTokensFromFaucet(sourceNetwork, targetAmount);

  // Get token contracts
  const sourceConfig = getNetworkConfig(sourceNetwork);
  const { ccipBnM } = getDummyTokensFromNetwork(sourceNetwork);
  const bnmToken = ERC20__factory.connect(ccipBnM, getWallet(sourceNetwork));
  const linkToken = ERC20__factory.connect(sourceConfig.linkTokenAddress, getWallet(sourceNetwork));

  // Check token balances
  const bnmBalance = await bnmToken.balanceOf(getWallet(sourceNetwork).address);
  const linkBalance = await linkToken.balanceOf(getWallet(sourceNetwork).address);
  console.log("BnM Token balance:", ethers.utils.formatEther(bnmBalance));
  console.log("LINK Token balance:", ethers.utils.formatEther(linkBalance));

  // Approve tokens for the router and deposit to fee tank
  const amount = ethers.utils.parseEther("5");
  await bnmToken.approve(customRouter.address, amount).then(wait);
  await customRouter.depositToFeeTank(amount).then(wait);

  const targetConfig = getNetworkConfig(targetNetwork);
  const messageCost = await customRouter.quoteCrossChainMessage(
    targetConfig.chainSelector,
    1,
    false,
    0
  );

  console.log("Message cost in LINK:", ethers.utils.formatEther(messageCost));

  // send equivalent link to the source Contract
  await linkToken.transfer(customRouter.address, ethers.utils.parseEther("2")).then(wait);

  const generateKeyTx = await customRouter.generateKey(
    requestHash,
    fixedNonce,
    operationType,
    1, // PayFeesIn.Link
    { gasLimit: 300000 }
  );
  const generateKeyReceipt = await generateKeyTx.wait();

  const requestProcessedEvent = generateKeyReceipt.events?.find(
    (e) => e.event === "RequestProcessed"
  );
  const requestMessageId = requestProcessedEvent?.args?.messageId;
  const onchainPredictedKey = requestProcessedEvent?.args?.expectedIdempotencyKey;
  console.log("Request sent, Message ID:", requestMessageId);
  console.log("On-chain Predicted Key:", onchainPredictedKey);

  // Calculate off-chain predicted key
  const offchainPredictedKey = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "bytes32", "uint256"],
      [customRouter.address, requestHash, fixedNonce]
    )
  );
  console.log("Off-chain Predicted Key:", offchainPredictedKey);

  // Verify key match
  console.assert(onchainPredictedKey === offchainPredictedKey, "Idempotency Key mismatch");

  // Wait for the message to be delivered
  console.log("Waiting for message delivery...");
  await new Promise((resolve) => setTimeout(resolve, 40000));

  //TODO: Return expected IdempotencyKey from  the router while waiting for finality

  // Verify key generation on target chain
  // console.log("Verifying key generation on target chain...");
  const expectedIdempotencyKey = await controller.requestHashToKey(requestHash);
  console.log("Generated idempotency key:", expectedIdempotencyKey);

  // Check balances before receipt submission
  const sourceRouterBalanceBefore = await bnmToken.balanceOf(customRouter.address);
  const targetVaultBalanceBefore = await bnmToken.balanceOf(controllerVault.address);
  const targetControllerBalanceBefore = await bnmToken.balanceOf(controller.address);

  console.log("Source Router balance before:", ethers.utils.formatEther(sourceRouterBalanceBefore));
  console.log("Target Vault balance before:", ethers.utils.formatEther(targetVaultBalanceBefore));
  console.log(
    "Target Controller balance before:",
    ethers.utils.formatEther(targetControllerBalanceBefore)
  );

  console.log("Submitting receipt...");
  const usedTokens = ethers.utils.parseEther("2");
  const receiptMessageCost = await customRouter.quoteCrossChainMessage(
    targetConfig.chainSelector,
    1,
    true,
    usedTokens
  );

  // send equivalent link to the source Contract
  await linkToken.transfer(customRouter.address, ethers.utils.parseEther("2")).then(wait);

  const submitReceiptTx = await customRouter.submitReceipt(
    requestMessageId,
    offchainPredictedKey,
    usedTokens,
    1,
    { gasLimit: 500000 }
  );

  await submitReceiptTx.wait();

  // Wait for the receipt to be processed
  console.log("Waiting for receipt processing...");
  await new Promise((resolve) => setTimeout(resolve, 30000));




  console.log("Cross-chain operation completed successfully");
}

async function main() {
  console.log("Starting Cross-Chain Key Generation and Token Transfer Test");

  const sourceNetwork = SupportedNetworks.ETHEREUM_SEPOLIA;
  const targetNetwork = SupportedNetworks.BASE_SEPOLIA;

  try {
    const { controller, controllerVault, customRouter } = await setupEnvironment(
      sourceNetwork,
      targetNetwork
    );
    await performCrossChainOperation(
      sourceNetwork,
      targetNetwork,
      controller,
      controllerVault,
      customRouter
    );

    console.log("Test completed successfully");
  } catch (error) {
    console.error("An error occurred during the test:");
    console.error(error);
    await setRelationshipsVerified(false);
  }
}

main().catch((error) => {
  console.error("Unhandled error in main function:");
  console.error(error);
  process.exit(1);
});
