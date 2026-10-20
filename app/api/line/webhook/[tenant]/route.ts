import { NextResponse } from "next/server";
import { adminDb, getCreds, handleEvents, validSig } from "@/lib/line";
export async function POST(req: Request, { params }: { params: { tenant: string } }) {
  const raw = await req.text(); const db = adminDb();
  const c = await getCreds(db, params.tenant);
  if (!c.own) return new NextResponse("not configured", { status: 404 });
  if (!validSig(raw, req.headers.get("x-line-signature"), c.secret)) return new NextResponse("invalid signature", { status: 401 });
  await handleEvents(db, JSON.parse(raw).events, c.token, params.tenant);
  return NextResponse.json({ ok: true });
}
