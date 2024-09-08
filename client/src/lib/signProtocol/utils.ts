import { Contract, ethers } from "ethers";
import {
  networkConfigs,
  SupportedNetworks,
} from "../../../../contracts-foundry/ts-scripts/helpers/config";
import { encodeFunctionData, getAddress } from "viem";

export async function createNotaryAttestation(
  network: SupportedNetworks,
  messageID: string,
  idempotencyKey: string,
  amount: ethers.BigNumber,
  smartAccount: any,
  routerAddress: string,
  recipients: string[]
) {
  // Get the provider
  const config = networkConfigs[network];
  const provider = new ethers.providers.JsonRpcProvider(config.rpc);

  // Encode schema data
  let schemaData = ethers.utils.defaultAbiCoder.encode(
    ["bytes", "bytes", "uint256"],
    [messageID, idempotencyKey, amount]
  );

  // Get smart account address
  const smartAccountAddress = await smartAccount.getAddress();

  // Prepare the attestation data
  const attestationData = {
    schemaId: ethers.BigNumber.from("0x1f7"), // Your schema ID
    linkedAttestationId: 0,
    attestTimestamp: 0,
    revokeTimestamp: 0,
    attester: smartAccountAddress,
    validUntil: 0,
    dataLocation: 0,
    revoked: false,
    recipients: recipients,
    data: schemaData,
  };

  // Define the ABI for the attest function
  const attestAbi = {
    name: "attest",
    type: "function",
    inputs: [
      {
        type: "tuple",
        name: "attestationData",
        components: [
          { name: "schemaId", type: "uint64" },
          { name: "linkedAttestationId", type: "uint64" },
          { name: "attestTimestamp", type: "uint64" },
          { name: "revokeTimestamp", type: "uint64" },
          { name: "attester", type: "address" },
          { name: "validUntil", type: "uint64" },
          { name: "dataLocation", type: "uint8" },
          { name: "revoked", type: "bool" },
          { name: "recipients", type: "address[]" },
          { name: "data", type: "bytes" },
        ],
      },
      { name: "indexingKey", type: "bytes32" },
      { name: "delegateSignature", type: "bytes" },
      { name: "extraData", type: "bytes" },
    ],
    outputs: [],
  };

  // Encode function data
  const data = encodeFunctionData({
    abi: [attestAbi],
    functionName: "attest",
    args: [attestationData, ethers.utils.id(messageID), "0x", "0x00"],
  });

  // Create the transaction object
  const tx = {
    to: getAddress("0x878c92fd89d8e0b93dc0a3c907a2adc7577e39c5"), // ISP contract address
    from: smartAccountAddress,
    data: data,
    value: 0,
  };

  try {
    // Build and send the UserOperation
    const userOp = await smartAccount.buildUserOp([tx]);
    const userOpResponse = await smartAccount.sendUserOp(userOp);

    // Wait for the transaction to be mined
    const transactionDetails = await userOpResponse.wait();
    console.log("Attestation created successfully:", transactionDetails);

    return transactionDetails;
  } catch (error) {
    console.error("Error creating attestation:", error);
    throw error;
  }
}

export async function callCreateAttestationAPI(
  messageID: string,
  idempotencyKey: string,
  amount: string,
  controllerAddress: string,
  accountAddress: string
) {
  try {
    const response = await fetch("/api/attestations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messageID,
        idempotencyKey,
        amount,
        controllerAddress,
        accountAddress,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create attestation");
    }

    const data = await response.json();
    console.log("Attestation created:", data.attestationID);
    return data.attestationID;
  } catch (error) {
    console.error("Error calling create-attestation API:", error);
    throw error;
  }
}
