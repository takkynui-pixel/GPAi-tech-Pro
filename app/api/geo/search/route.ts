import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { embed } from "@/lib/ai/gemini";
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 200);
  if (!q) return NextResponse.json({ error: "missing q" }, { status: 400 });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await db.rpc("match_shops", { q: JSON.stringify(await embed(q)), n: 5 });
  return NextResponse.json({ results: (data ?? []).map((r: any) => ({ ...r, url: `/s/${r.slug}` })) });
}
