import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { decodeAbiParameters, fromBytes, bytesToHex, bytesToString, toHex } from "viem";
import { EvmChains, SignProtocolClient, SpMode } from "@ethsign/sp-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { ethers } from "ethers";
import { stringify } from "querystring";

const SIGN_PROTOCOL_API = "https://testnet-rpc.sign.global/api";
const SCHEMA_ID = "onchain_evm_11155111_0x1f7";

const SCHEMA = [
  { name: "messageID", type: "bytes" },
  { name: "idempotencyKey", type: "bytes" },
  { name: "amount", type: "uint256" },
];

async function makeAttestationRequest(endpoint: string, options: any) {
  const url = `${SIGN_PROTOCOL_API}/${endpoint}`;
  const res = await axios.request({
    url,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    ...options,
  });

  if (res.status !== 200) {
    throw new Error(JSON.stringify(res.data));
  }

  return res.data;
}

function parseAttestationData(data: `0x${string}`) {
  try {
    const decodedData = decodeAbiParameters(SCHEMA, data);
    const parsedData: Record<string, any> = {};
    SCHEMA.forEach((item, index) => {
      parsedData[item.name] = decodedData[index];
      // if (item.name === "messageId" || item.name === "idempotencyKey") {
      //   const binaryString = decodedData[index] as any;
      //   console.log("binary", binaryString);

      //   const buffer = Buffer.from(binaryString, "binary");
      //   // toHex()
      //   const hexString = "0x" + buffer.toString("hex");
      //   const bytes32Hex = hexString.padEnd(66, "0");
      //   parsedData[item.name] = bytesToHex(buffer, { size: 32 });
      // } else {
      //   parsedData[item.name] = decodedData[index];
      // }
    });
    return parsedData;
  } catch (error) {
    console.error("Error parsing attestation data:", error);
    return null;
  }
}

async function queryAttestation(messageId: string) {
  const response = await makeAttestationRequest("index/attestations", {
    method: "GET",
    params: {
      mode: "onchain",
      schemaId: SCHEMA_ID,
      indexingValue: messageId.toLowerCase(),
    },
  });

  if (!response.success) {
    return {
      success: false,
      message: response?.message ?? "Attestation query failed.",
    };
  }

  if (response.data?.total === 0) {
    return {
      success: false,
      message: "No attestation found for this message ID.",
    };
  }

  const attestation = response.data.rows[0];
  const parsedData = parseAttestationData(attestation.data);

  if (!parsedData) {
    return {
      success: false,
      message: "Failed to parse attestation data.",
    };
  }

  return {
    success: true,
    attestation: {
      id: fromBytes(new Uint8Array(Buffer.from(attestation.id)), {
        size: 32,
        to: "string",
      }),
      messageId: parsedData.messageID,

      idempotencyKey: parsedData.idempotencyKey,
      amount: parsedData.amount.toString(),
    },
  };
}

export async function GET(request: NextRequest) {
  const messageId = request.nextUrl.searchParams.get("messageId");

  console.log(messageId);

  if (!messageId) {
    return NextResponse.json({ error: "messageId is required" }, { status: 400 });
  }

  try {
    const result = await queryAttestation(messageId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error querying attestation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const req = await request.json();
    const { messageID, idempotencyKey, amount, controllerAddress, accountAddress } = req;

    if (!process.env.PRIVATE_KEY) {
      throw new Error("NEXT_PUBLIC_PRIVATE_KEY is not set in environment variables");
    }

    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    const schemaId = "0x1f7";

    // Create a SignProtocolClient instance
    const client = new SignProtocolClient(SpMode.OnChain as any, {
      account: account,
      chain: EvmChains.sepolia, // Adjust if using a different network
    });

    // Create the attestation
    const attestationID = await client.createAttestation({
      schemaId,
      recipients: [controllerAddress, accountAddress],
      data: {
        messageID,
        idempotencyKey,
        amount: ethers.utils.parseEther("1"),
      },
      indexingValue: messageID.toLowerCase(),
    });

    console.log("Local Attestation created:", attestationID);

    return NextResponse.json({ attestationID }, { status: 200 });
  } catch (error) {
    console.error("Error creating local attestation:", error);
    return NextResponse.json(
      { error: "Failed to create attestation", details: (error as Error).message },
      { status: 500 }
    );
  }
}
