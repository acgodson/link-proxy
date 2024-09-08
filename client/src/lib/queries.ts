export async function fetchQueryResponse(
  userAddress: `0x${string}`,
  prompt: any,
  mesageID: string,
  apiKey: string
) {
  let response = await fetch(`${process.env.HOST}/api/attestations?messageId=${mesageID}`);

  let data = await response.json();
  console.log(data);

  if (data && data.attestation.idempotencyKey) {
    console.log("caller may be authorized", data);
  }
  console.log("Retrieved idempotency key:", data.attestation.idempotencyKey);
  console.log("caller's Address:", userAddress);

  const idempotencyKey = data.attestation.idempotencyKey;

  if (idempotencyKey) {
    try {
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
