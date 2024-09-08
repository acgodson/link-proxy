import { NextRequest, NextResponse } from "next/server";

import { fetchQueryResponse } from "@/lib/queries";

export async function POST(request: NextRequest) {
  try {
    const req: any = await request.json();

    const prompt = req.prompt as string;
    const userAddress = req.user as string;
    const mesageID = req.messageId as string;

    const result: any = await fetchQueryResponse(
      userAddress as `0x${string}`,
      prompt,
      mesageID,
      process.env.OPENAI_API_KEY as string
    );

    const responseBody = `re: ${result.data.text}\n`;
    console.log(responseBody);

    return NextResponse.json({ result: result.data.text, key: result.key }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error", e }, { status: 500 });
  }
}
