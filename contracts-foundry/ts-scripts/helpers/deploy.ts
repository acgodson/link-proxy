import { SupportedNetworks, getNetworkConfig } from "./config";
import {
  getAccount,
  getWallet,
  loadDeployedAddresses,
  storeDeployedAddresses,
  wait,
} from "./utils";
import {
  Controller__factory,
  ControllerVault__factory,
  CustomRouter__factory,
  CustomRouterSchemaHook__factory,
} from "../ethers-contracts";
import { SignProtocolClient, SpMode, EvmChains } from "@ethsign/sp-sdk";

export async function deployController(network: SupportedNetworks) {
  const config = getNetworkConfig(network);
  const signer = getWallet(network);

  const controller = await new Controller__factory(signer).deploy(config.routerAddress);
  await controller.deployed();

  console.log(
    `Controller deployed to ${controller.address} on network ${SupportedNetworks[network]}`
  );

  const deployed = await loadDeployedAddresses();
  deployed.controller[network] = controller.address;
  await storeDeployedAddresses(deployed);

  return controller;
}

export async function deployControllerVault(network: SupportedNetworks) {
  const config = getNetworkConfig(network);
  const signer = getWallet(network);

  const controllerVault = await new ControllerVault__factory(signer).deploy(config.routerAddress);
  await controllerVault.deployed();

  console.log(
    `ControllerVault deployed to ${controllerVault.address} on network ${SupportedNetworks[network]}`
  );

  const deployed = await loadDeployedAddresses();
  deployed.controllerVault[network] = controllerVault.address;
  await storeDeployedAddresses(deployed);

  return controllerVault;
}

export async function deployCustomRouter(
  network: SupportedNetworks,
  tokenAddress: string,
  targetNetwork: SupportedNetworks
) {
  const config = getNetworkConfig(network);
  const targetConfig = getNetworkConfig(targetNetwork);
  const signer = getWallet(network);

  const customRouter = await new CustomRouter__factory(signer).deploy(
    config.routerAddress,
    config.linkTokenAddress,
    "0x0000000000000000000000000000000000000000", // Controller address is set later
    "0x0000000000000000000000000000000000000000", // ControllerVault address is set later
    tokenAddress,
    targetConfig.chainSelector
  );
  await customRouter.deployed();

  console.log(
    `CustomRouter deployed to ${customRouter.address} on network ${SupportedNetworks[network]}`
  );

  const deployed = await loadDeployedAddresses();
  deployed.customRouter[network] = customRouter.address;
  await storeDeployedAddresses(deployed);

  return customRouter;
}

export async function deployCustomRouterSchemaHook(
  network: SupportedNetworks,
  customRouterAddress: string
) {
  const signer = getWallet(network);

  const customRouterSchemaHook = await new CustomRouterSchemaHook__factory(signer).deploy(
    customRouterAddress
  );
  await customRouterSchemaHook.deployed();

  console.log(
    `CustomRouterSchemaHook deployed to ${customRouterSchemaHook.address} on network ${SupportedNetworks[network]}`
  );

  const deployed = await loadDeployedAddresses();
  deployed.customRouterSchemaHook = deployed.customRouterSchemaHook || {};
  deployed.customRouterSchemaHook[network] = customRouterSchemaHook.address;
  await storeDeployedAddresses(deployed);

  return customRouterSchemaHook;
}

export async function createAndStoreSchema(
  network: SupportedNetworks,
  schemaHookAddress: `0x${string}`
) {
  try {
    const account = getAccount(network);
    const client = new SignProtocolClient(SpMode.OnChain as any, {
      account: account,
      chain: EvmChains.sepolia,
    });

    // console.log("sign protocol client", client);
    const schemaRes = await client.createSchema({
      name: "CCIP Attestation",
      hook: schemaHookAddress,
      data: [
        { name: "messageID", type: "bytes" },
        { name: "idempotencyKey", type: "bytes" },
        { name: "amount", type: "uint256" },
      ],
    });
    console.log("Schema Created", schemaRes.schemaId);
    const deployed: any = await loadDeployedAddresses();
    if (!deployed.schemas) deployed.schemas = {};
    deployed.schemas[network] = schemaRes.schemaId;
    await storeDeployedAddresses(deployed);
    return schemaRes.schemaId;
  } catch (e) {
    console.log("error creating attestation", e);
  }
  return;
}

export default {
  deployController,
  deployControllerVault,
  deployCustomRouter,
  createAndStoreSchema,
};
