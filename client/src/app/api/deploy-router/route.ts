import { NextRequest, NextResponse } from "next/server";
import { CustomRouter__factory } from "@/lib/ccip/ethers-contracts";
import { ethers } from "ethers";
import {
  getDummyTokensFromNetwork,
  getNetworkConfig,
  SupportedNetworks,
} from "../../../../../contracts-foundry/ts-scripts/helpers/config";

function getWallet(chainId: number): ethers.Wallet {
  const config = getNetworkConfig(chainId as SupportedNetworks);
  const provider = new ethers.providers.JsonRpcProvider({
    skipFetchSetup: true,
    url: config.rpc,
  });
  if (!process.env.PRIVATE_KEY) {
    throw Error("No private key provided (use the PRIVATE_KEY environment variable)");
  }
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

export async function POST(request: NextRequest) {
  try {
    const req: any = await request.json();
    const sourceNetwork = req.sourceNetwork as SupportedNetworks;
    const targetNetwork = req.targetNetwork as SupportedNetworks;

    const wallet = getWallet(sourceNetwork);
    const sourceConfig = getNetworkConfig(sourceNetwork);
    const targetConfig = getNetworkConfig(targetNetwork);

    const factory = new CustomRouter__factory(wallet);

    console.log("Deployment parameters:", {
      linkTokenAddress: sourceConfig.linkTokenAddress,
      routerAddress: sourceConfig.routerAddress,
      controllerAddress: process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS,
      vaultAddress: process.env.NEXT_PUBLIC_VAULT_ADDRESS,
      ccipBnM: getDummyTokensFromNetwork(sourceNetwork).ccipBnM,
      targetChainSelector: targetConfig.chainSelector,
    });

    const router = await factory.deploy(
      sourceConfig.routerAddress,
      sourceConfig.linkTokenAddress,
      process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS!,
      process.env.NEXT_PUBLIC_VAULT_ADDRESS!,
      getDummyTokensFromNetwork(sourceNetwork).ccipBnM,
      targetConfig.chainSelector
    );

    await router.deployed();

    console.log("Router deployed to:", router.address);

    return NextResponse.json({ routerAddress: router.address }, { status: 200 });
  } catch (e) {
    console.error("Error deploying router:", e);
    return NextResponse.json({ error: "Internal Server Error", details: e }, { status: 500 });
  }
}
