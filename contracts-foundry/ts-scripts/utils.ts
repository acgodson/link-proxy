// utils.ts

import { ethers } from "ethers";
import { readFileSync, writeFileSync } from "fs";
import { networkConfigs, SupportedNetworks, DeployedAddresses } from "./config";
import {
  Controller__factory,
  ControllerVault__factory,
  CustomRouter__factory,
} from "./ethers-contracts";
import "dotenv/config";

export function getWallet(network: SupportedNetworks): ethers.Wallet {
  const config = networkConfigs[network];
  const provider = new ethers.providers.JsonRpcProvider(config.rpc);
  if (!process.env.PRIVATE_KEY) {
    throw Error("No private key provided (use the PRIVATE_KEY environment variable)");
  }
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

export async function loadDeployedAddresses(): Promise<DeployedAddresses> {
  try {
    const data = readFileSync("./deployed-addresses.json", { encoding: "utf-8" });
    return JSON.parse(data);
  } catch (error) {
    return { controller: {}, controllerVault: {}, customRouter: {}, erc20s: {} };
  }
}

export async function storeDeployedAddresses(
  deployed: DeployedAddresses
): Promise<DeployedAddresses> {
  writeFileSync("./deployed-addresses.json", JSON.stringify(deployed, null, 2));
  return deployed;
}

export async function getController(network: SupportedNetworks) {
  const deployed = (await loadDeployedAddresses()).controller[network];
  if (!deployed) {
    throw new Error(`No deployed controller on network ${SupportedNetworks[network]}`);
  }
  return Controller__factory.connect(deployed, getWallet(network));
}

export async function getControllerVault(network: SupportedNetworks) {
  const deployed = (await loadDeployedAddresses()).controllerVault[network];
  if (!deployed) {
    throw new Error(`No deployed controller vault on network ${SupportedNetworks[network]}`);
  }
  return ControllerVault__factory.connect(deployed, getWallet(network));
}

export async function getCustomRouter(network: SupportedNetworks) {
  const deployed = (await loadDeployedAddresses()).customRouter[network];
  if (!deployed) {
    throw new Error(`No deployed custom router on network ${SupportedNetworks[network]}`);
  }
  return CustomRouter__factory.connect(deployed, getWallet(network));
}

export const wait = (tx: ethers.ContractTransaction) => tx.wait();

// Add a function to interact with the faucet (if available)
export async function requestTokensFromFaucet(network: SupportedNetworks) {
  const config = networkConfigs[network];
  if (!config.faucetAddress) {
    throw new Error(`No faucet address available for network ${SupportedNetworks[network]}`);
  }

  const wallet = getWallet(network);
  const faucetABI = ["function drip(address to) external"];
  const faucetContract = new ethers.Contract(config.faucetAddress, faucetABI, wallet);

  const tx = await faucetContract.drip(wallet.address);
  await tx.wait();
  console.log(`Tokens requested from faucet on ${SupportedNetworks[network]}`);
}

export default {
  getWallet,
  loadDeployedAddresses,
  storeDeployedAddresses,
  getController,
  getControllerVault,
  getCustomRouter,
  wait,
  requestTokensFromFaucet,
};
