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
  CustomRouterWithAttester as CustomRouter,
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
    schemaId: string;

  if (!(await areRelationshipsVerified())) {
    console.log("Relationships not verified. Deploying new contracts...");

    // deploy attestation schema
    schemaId = await createAndStoreSchema(targetNetwork);

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
    schemaId = await getSchemaId(targetNetwork);
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
  console.log("Request sent, Message ID:", requestMessageId);
  const expectedIdempotencyKey = requestProcessedEvent?.args?.expectedIdempotencyKey;
  console.log("Expected Idempotency Key:", expectedIdempotencyKey);
  

    //TODO: Return expected IdempotencyKey from  the router while waiting for finality
  // Verify key generation on target chain
  // console.log("Verifying key generation on target chain...");
  // const expectedIdempotencyKey = await controller.requestHashToKey(requestHash);
  // console.log("Generated idempotency key:", expectedIdempotencyKey);


  // Generate attestation
  const account = getAccount(targetNetwork);
  const client = new SignProtocolClient(SpMode.OnChain as any, {
    account: account,
    chain: EvmChains.baseSepolia,
  });
  const messageID = requestMessageId;

  await client.createAttestation({
    schemaId,
    recipients: [controller.address, account.address],
    data: {
      messageID,
      idempotencyKey: expectedIdempotencyKey,
      amount: 0,
    },
    indexingValue: messageID.toLowerCase(),
  });

  console.log("Attestation created for key generation");

  // Wait for the message to be delivered
  console.log("Waiting for message delivery...");
  await new Promise((resolve) => setTimeout(resolve, 40000));

  return;

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
    expectedIdempotencyKey,
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
