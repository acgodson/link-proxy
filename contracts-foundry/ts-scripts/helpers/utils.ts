import { ethers } from "ethers";
import { readFileSync, writeFileSync } from "fs";
import { networkConfigs, SupportedNetworks } from "./config";
import {
  Controller__factory,
  ControllerVault__factory,
  CustomRouter__factory,
} from "../ethers-contracts";
import "dotenv/config";

export interface DeployedAddresses {
  controller: Record<number, string>;
  controllerVault: Record<number, string>;
  customRouter: Record<number, string>;
  erc20s: Record<number, string[]>;
  relationshipsVerified: boolean;
}

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
    const data = readFileSync("./ts-scripts/testnet/deployed-addresses.json", {
      encoding: "utf-8",
    });
    return JSON.parse(data);
  } catch (error) {
    return {
      controller: {},
      controllerVault: {},
      customRouter: {},
      erc20s: {},
      relationshipsVerified: false,
    };
  }
}

export async function storeDeployedAddresses(
  deployed: DeployedAddresses
): Promise<DeployedAddresses> {
  writeFileSync("./ts-scripts/testnet/deployed-addresses.json", JSON.stringify(deployed, null, 2));
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

export async function requestTokensFromFaucet(
  network: SupportedNetworks,
  targetAmount: ethers.BigNumber
) {
  const config = networkConfigs[network];
  if (!config.ccipBnMAddress) {
    throw new Error(`No faucet address available for network ${SupportedNetworks[network]}`);
  }

  const wallet = getWallet(network);
  const faucetABI = [
    "function drip(address to) external",
    "function balanceOf(address account) external view returns (uint256)",
  ];
  const faucetContract = new ethers.Contract(config.ccipBnMAddress, faucetABI, wallet);

  let amount = await faucetContract.balanceOf(wallet.address);
  let loopCount = 0;
  const maxLoops = 10;

  while (amount.lt(targetAmount) && loopCount < maxLoops) {
    console.log(`Current balance: ${ethers.utils.formatEther(amount)}. Requesting more tokens...`);
    const tx = await faucetContract.drip(wallet.address, { gasLimit: 500000 });
    await tx.wait();
    amount = await faucetContract.balanceOf(wallet.address);
    loopCount++;
  }

  console.log(`Final balance: ${ethers.utils.formatEther(amount)} after ${loopCount} drips`);
  return amount;
}

export async function areRelationshipsVerified(): Promise<boolean> {
  const deployed = await loadDeployedAddresses();
  return deployed.relationshipsVerified;
}

export async function setRelationshipsVerified(verified: boolean): Promise<void> {
  const deployed = await loadDeployedAddresses();
  deployed.relationshipsVerified = verified;
  await storeDeployedAddresses(deployed);
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
  areRelationshipsVerified,
  setRelationshipsVerified,
};
