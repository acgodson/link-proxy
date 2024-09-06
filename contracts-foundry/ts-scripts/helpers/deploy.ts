import { SupportedNetworks, getNetworkConfig } from "./config";
import { getWallet, loadDeployedAddresses, storeDeployedAddresses, wait } from "./utils";
import {
  Controller__factory,
  ControllerVault__factory,
  CustomRouter__factory,
} from "../ethers-contracts";

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

export default {
  deployController,
  deployControllerVault,
  deployCustomRouter,
};
