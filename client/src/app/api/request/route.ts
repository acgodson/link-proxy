import { NextRequest, NextResponse } from "next/server";
import { Controller__factory } from "@/lib/./ethers-contracts";

import { fetchQueryResponse } from "@/lib/queries";
import { getChain } from "@/lib/wormhole/utils";
import { ethers } from "ethers";

function getWallet(chainId: number): ethers.Wallet {
  console.log("getting ready to connect", chainId);
  const rpc = getChain(chainId).rpc;

  const provider = new ethers.providers.JsonRpcProvider({
    skipFetchSetup: true,
    url: rpc,
  });
  if (!process.env.PRIVATE_KEY) {
    throw Error(
      "No private key provided (use the PRIVATE_KEY environment variable)"
    );
  }
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

export async function POST(request: NextRequest) {
  try {
    const req: any = await request.json();

    const prompt = req.prompt as string;
    const userAddress = req.user as string;
    const targetWallet = getWallet(14);
    const controllerAddress = "0x52567724E0260319652dce08671980E8Bcc08776";
    const controller = Controller__factory.connect(
      controllerAddress,
      targetWallet
    );

    const requestHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(prompt)
    );

    const result: any = await fetchQueryResponse(
      controller,
      userAddress as `0x${string}`,
      prompt,
      requestHash,
      process.env.OPENAI_API_KEY as string
    );

    const responseBody = `re: ${result.data.text}\n`;
    console.log(responseBody);

    return NextResponse.json(
      { result: result.data.text, key: result.key },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error", e },
      { status: 500 }
    );
  }
}
