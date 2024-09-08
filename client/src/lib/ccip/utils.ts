import { ethers } from "ethers";
import {
  networkConfigs,
  SupportedNetworks,
} from "../../../../contracts-foundry/ts-scripts/helpers/config";

import {
  Controller__factory,
  ControllerVault__factory,
  CustomRouter__factory,
  CustomRouterSchemaHook__factory,
  Mock_Token__factory as ERC20__factory,
} from "./ethers-contracts";
import { PaymasterMode } from "@biconomy/account";

export interface DeployedAddresses {
  controller: Record<number, string>;
  controllerVault: Record<number, string>;
  customRouter: Record<number, string>;
  erc20s: Record<number, string[]>;
  schemas: Record<number, string>;
  customRouterSchemaHook: Record<number, string>;
  relationshipsVerified: boolean;
}

export function getWallet(network: SupportedNetworks): ethers.Wallet {
  const config = networkConfigs[network];
  const provider = new ethers.providers.JsonRpcProvider(config.rpc);
  if (!process.env.NEXT_PUBLIC_PRIVATE_KEY) {
    throw Error("No private key provided (use the NEXT_PUBLIC_PRIVATE_KEY environment variable)");
  }
  return new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY, provider);
}

export function getAccount(network: SupportedNetworks) {
  if (!process.env.NEXT_PUBLIC_PRIVATE_KEY) {
    throw Error("No private key provided (use the NEXT_PUBLIC_PRIVATE_KEY environment variable)");
  }
  // Note: This function might need adjustment based on how you're handling accounts in the client-side
  return { address: getWallet(network).address };
}

export async function loadDeployedAddresses(): Promise<DeployedAddresses> {
  try {
    const data = localStorage.getItem("l-deployed-addresses");
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading deployed addresses:", error);
  }
  return {
    controller: {},
    controllerVault: {},
    customRouter: {},
    erc20s: {},
    schemas: {},
    customRouterSchemaHook: {},
    relationshipsVerified: false,
  };
}

export async function storeDeployedAddresses(
  deployed: DeployedAddresses
): Promise<DeployedAddresses> {
  localStorage.setItem("l-deployed-addresses", JSON.stringify(deployed));
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

export async function getSchemaId(network: SupportedNetworks) {
  const deployed = (await loadDeployedAddresses()).schemas[network];
  if (!deployed) {
    throw new Error(`No deployed schema on network ${SupportedNetworks[network]}`);
  }
  return deployed;
}

export async function getCustomRouterSchemaHook(network: SupportedNetworks) {
  const deployed = (await loadDeployedAddresses()).customRouterSchemaHook[network];
  if (!deployed) {
    throw new Error(`No deployed schema hook on network ${SupportedNetworks[network]}`);
  }
  return CustomRouterSchemaHook__factory.connect(deployed, getWallet(network));
}

export const wait = (tx: ethers.ContractTransaction) => tx.wait();

export async function areRelationshipsVerified(): Promise<boolean> {
  const deployed = await loadDeployedAddresses();
  return deployed.relationshipsVerified;
}

export async function setRelationshipsVerified(verified: boolean): Promise<void> {
  const deployed = await loadDeployedAddresses();
  deployed.relationshipsVerified = verified;
  await storeDeployedAddresses(deployed);
}

export async function requestTokensFromFaucet(
  network: SupportedNetworks,
  targetAmount: ethers.BigNumber,
  smartAccount: any
) {
  const config = networkConfigs[network];
  if (!config.ccipBnMAddress) {
    throw new Error(`No faucet address available for network ${SupportedNetworks[network]}`);
  }

  const provider = ethers.providers.getDefaultProvider(config.rpc);
  const faucetABI = [
    "function drip(address to) external",
    "function balanceOf(address account) external view returns (uint256)",
  ];
  const faucetContract = new ethers.Contract(config.ccipBnMAddress, faucetABI, provider);

  const userAddress = await smartAccount.getAddress();
  let currentBalance = await faucetContract.balanceOf(userAddress);

  if (currentBalance.gte(targetAmount)) {
    console.log(
      `Current balance (${ethers.utils.formatEther(
        currentBalance
      )}) already meets or exceeds target amount.`
    );
    return currentBalance;
  }

  const dripAmount = ethers.utils.parseEther("4");
  const numberOfDrips = targetAmount.sub(currentBalance).div(dripAmount).add(1).toNumber();

  const maxDrips = 5;

  const dripCount = Math.min(numberOfDrips, maxDrips);
  console.log(`Preparing ${dripCount} drip transactions...`);

  const transactions = [];
  for (let i = 0; i < dripCount; i++) {
    const dripTx = await faucetContract.populateTransaction.drip(userAddress);
    transactions.push({
      to: config.ccipBnMAddress,
      data: dripTx.data,
      value: 0,
    });
  }

  try {
    // Build the UserOperation for the batch of transactions
    const userOp = await smartAccount.buildUserOp(transactions, {
      paymasterServiceData: {
        mode: PaymasterMode.SPONSORED,
      },
    });

    // Send the UserOperation
    const userOpResponse = await smartAccount.sendUserOp(userOp);

    // Wait for the transaction to be mined
    const transactionDetails = await userOpResponse.wait();

    console.log("Faucet drip transaction hash:", transactionDetails.receipt);

    // Check final balance
    const finalBalance = await faucetContract.balanceOf(userAddress);
    console.log(
      `Final balance: ${ethers.utils.formatEther(finalBalance)} after ${dripCount} drips`
    );
    return finalBalance;
  } catch (error) {
    console.error("Error requesting tokens from faucet:", error);
    throw error;
  }
}

export default {
  getWallet,
  getAccount,
  loadDeployedAddresses,
  storeDeployedAddresses,
  getController,
  getControllerVault,
  getCustomRouter,
  getSchemaId,
  getCustomRouterSchemaHook,
  wait,
  requestTokensFromFaucet,
  areRelationshipsVerified,
  setRelationshipsVerified,
};
