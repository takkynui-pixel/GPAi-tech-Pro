import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { adminDb } from "@/lib/line";
import { encrypt } from "@/lib/crypto";
async function guard() {
  const s = supabaseServer(); const { data:{ user } } = await s.auth.getUser(); if (!user) return null;
  const { data: t } = await s.from("tenants").select("id,plan_type").single(); const { data: own } = await s.rpc("is_owner");
  return t && own === true ? t : null;
}
export async function POST(req: Request) {
  const t = await guard(); if (!t) return NextResponse.json({ error: "เฉพาะเจ้าของร้านเท่านั้น" }, { status: 403 });
  if (t.plan_type === "free") return NextResponse.json({ error: "ต้องใช้แพ็กเกจ Pro ขึ้นไป" }, { status: 403 });
  const { channel_secret, access_token } = await req.json();
  if (!channel_secret || !access_token) return NextResponse.json({ error: "กรอก Channel secret และ Access token ให้ครบ" }, { status: 400 });
  const chk = await fetch("https://api.line.me/v2/bot/info", { headers:{ Authorization:`Bearer ${access_token}` } });
  if (!chk.ok) return NextResponse.json({ error: "Access token ไม่ถูกต้อง" }, { status: 400 });
  const db = adminDb();
  await db.from("tenant_line_credentials").upsert({ tenant_id: t.id, channel_secret_enc: encrypt(channel_secret), access_token_enc: encrypt(access_token), updated_at: new Date().toISOString() });
  await db.from("tenants").update({ line_connected: true }).eq("id", t.id);
  return NextResponse.json({ ok: true });
}
export async function DELETE() {
  const t = await guard(); if (!t) return NextResponse.json({ error: "เฉพาะเจ้าของร้านเท่านั้น" }, { status: 403 });
  const db = adminDb(); await db.from("tenant_line_credentials").delete().eq("tenant_id", t.id); await db.from("tenants").update({ line_connected: false }).eq("id", t.id);
  return NextResponse.json({ ok: true });
}
