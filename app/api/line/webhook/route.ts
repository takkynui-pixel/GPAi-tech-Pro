import { NextResponse } from "next/server";
import { adminDb, handleEvents, validSig } from "@/lib/line";
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSig(raw, req.headers.get("x-line-signature"), process.env.LINE_CHANNEL_SECRET!)) return new NextResponse("invalid signature", { status: 401 });
  await handleEvents(adminDb(), JSON.parse(raw).events, process.env.LINE_CHANNEL_ACCESS_TOKEN!);
  return NextResponse.json({ ok: true });
}
