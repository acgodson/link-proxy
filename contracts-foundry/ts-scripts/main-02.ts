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
  getSchemaId,
} from "./helpers/utils";
import {
  createAndStoreSchema,
  deployController,
  deployControllerVault,
  deployCustomRouter,
} from "./helpers/deploy";
import {
  Controller,
  ControllerVault,
  CustomRouter,
  // CustomRouterWithAttester as CustomRouter,
  Mock_Token__factory as ERC20__factory,
} from "./ethers-contracts";
import { SignProtocolClient, SpMode, EvmChains } from "@ethsign/sp-sdk";

async function setupEnvironment(
  sourceNetwork: SupportedNetworks,
  targetNetwork: SupportedNetworks
) {
  let controller: Controller,
    controllerVault: ControllerVault,
    customRouter: CustomRouter,
    schemaId: any;

  if (!(await areRelationshipsVerified())) {
    console.log("Relationships not verified. Deploying new contracts...");

    // deploy attestation schema
    schemaId = await createAndStoreSchema(sourceNetwork);

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
    schemaId = await getSchemaId(sourceNetwork);
    controller = await getController(targetNetwork);
    controllerVault = await getControllerVault(targetNetwork);
    customRouter = await getCustomRouter(sourceNetwork);
  }

  return { controller, controllerVault, customRouter, schemaId };
}

async function performCrossChainOperation(
  sourceNetwork: SupportedNetworks,
  targetNetwork: SupportedNetworks,
  controller: Controller,
  controllerVault: ControllerVault,
  customRouter: CustomRouter,
  schemaId: string
) {
  // Prepare test data
  const requestHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test request"));
  const fixedNonce = 12346;
  const operationType = 0; // Low

  // Request tokens from faucet
  const targetAmount = ethers.utils.parseEther("10");
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
  const amount = ethers.utils.parseEther("10");
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

  // Calculate off-chain predicted key
  const offchainPredictedKey = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ["address", "bytes32", "uint256"],
      [customRouter.address, requestHash, fixedNonce]
    )
  );

  // Verify generated key matches
  console.assert(onchainPredictedKey === offchainPredictedKey, "Idempotency Key mismatch");

  // Wait for the message to be delivered
  console.log("Waiting for message delivery...");
  await new Promise((resolve) => setTimeout(resolve, 30000));

  // Check balances before receipt submission
  const sourceRouterBalanceBefore = await bnmToken.balanceOf(customRouter.address);
  console.log("Source Router balance before:", ethers.utils.formatEther(sourceRouterBalanceBefore));

  // Generate attestation
  const account = getAccount(sourceNetwork);
  const client = new SignProtocolClient(SpMode.OnChain as any, {
    account: account,
    chain: EvmChains.sepolia,
  });
  const messageID = requestMessageId;

  const attestationID = await client.createAttestation({
    schemaId,
    recipients: [controller.address, account.address],
    data: {
      messageID,
      idempotencyKey: onchainPredictedKey,
      amount: 0,
    },
    indexingValue: messageID.toLowerCase(),
  });

  console.log("Attestation created for key generation: ", attestationID);

  // Wait for the message to be delivered
  console.log("Waiting for message delivery...");
  await new Promise((resolve) => setTimeout(resolve, 40000));

  // Submit receipt
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
    onchainPredictedKey,
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
    const { controller, controllerVault, customRouter, schemaId } = await setupEnvironment(
      sourceNetwork,
      targetNetwork
    );
    await performCrossChainOperation(
      sourceNetwork,
      targetNetwork,
      controller,
      controllerVault,
      customRouter,
      schemaId
    );

    console.log("Test completed successfully");
  } catch (error) {
    console.error("An error occurred during the test:");
    console.error(error);
    // await setRelationshipsVerified(false);
  }
}

main().catch((error) => {
  console.error("Unhandled error in main function:");
  console.error(error);
  process.exit(1);
});

// Attestation created for key generation:  {
//   attestationId: '0x206',
//   txHash: '0xea814d249158c9b6f070d7d015a548453822ae23ecc77734b5d751697114347c',
//   indexingValue: '0xcdea36aeb92afa9e3e447f1dd89d2b8c653f50a7f346d271651f7a8911595cff'
// }
