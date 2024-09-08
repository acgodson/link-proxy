// File: app/api/attestations/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { decodeAbiParameters, fromBytes } from "viem";

const SIGN_PROTOCOL_API = "https://testnet-rpc.sign.global/api";
const SCHEMA_ID = "onchain_evm_11155111_0x1bf";

const SCHEMA = [
  { name: "messageID", type: "string" },
  { name: "idempotencyKey", type: "string" },
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
    return NextResponse.json(
      { error: "messageId is required" },
      { status: 400 }
    );
  }

  try {
    const result = await queryAttestation(messageId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error querying attestation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
