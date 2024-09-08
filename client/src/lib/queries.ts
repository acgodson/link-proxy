import { ethers } from "ethers";
import { Controller } from "./ccip/ethers-contracts";

export async function fetchQueryResponse(
  userAddress: `0x${string}`,
  prompt: any,
  mesageID: string,
  apiKey: string
) {
  // Retrieeve idempotency key from  API

  let response = await fetch(`http://localhost:3000/api/attestations?messageId=${mesageID}`);

  let data = await response.json();
  console.log(data);

  if (data && data.idempotencyKey) {
    console.log("user is authorized", data);
  }
  console.log("Retrieved idempotency key:", data.idempotencyKey);
  console.log("user Address:", userAddress);

  // Retrieve idempotency key Data
  const idempotencyKey = data.idempotencyKey;

  if (idempotencyKey) {
    try {
      //generate new dempotency key with hash of request
      let headersList = {
        "idempotency-key": idempotencyKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };

      let bodyContent = JSON.stringify({
        prompt: prompt,
        context: "",
      });

      let response = await fetch("https://blueband-db-442d8.web.app/api/query", {
        method: "POST",
        body: bodyContent,
        headers: headersList,
      });

      let data = await response.json();
      return { data: data, key: idempotencyKey };
    } catch (e) {
      console.log(e);
    }
  }
}
