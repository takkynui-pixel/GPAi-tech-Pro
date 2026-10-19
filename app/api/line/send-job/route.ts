import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
export async function POST(req: Request) {
  const s = supabaseServer(); const { data:{ user } } = await s.auth.getUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  const { job_id } = await req.json();
  const { data: j } = await s.from("jobs").select("public_share_token,total_amount,customers(name,line_id),tenants(shop_name)").eq("id", job_id).single(); // RLS: เฉพาะร้านตัวเอง
  const c: any = j?.customers; const shop: any = j?.tenants;
  if (!j) return NextResponse.json({ sent: false, reason: "not_found" }, { status: 404 });
  if (!c?.line_id) return NextResponse.json({ sent: false, reason: "no_line" });
  const link = `${new URL(req.url).origin}/track/${j.public_share_token}`;
  const text = `เรียนคุณ${c.name}\nใบงาน/ใบเสนอราคาจาก ${shop?.shop_name ?? "ร้านของเรา"}\nยอดรวม ${Number(j.total_amount).toLocaleString()} บาท\nดูรายละเอียดและชำระเงิน: ${link}`;
  const r = await fetch("https://api.line.me/v2/bot/message/push", { method:"POST",
    headers:{ "Content-Type":"application/json", Authorization:`Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` },
    body: JSON.stringify({ to: c.line_id, messages:[{ type:"text", text }] }) });
  if (!r.ok) return NextResponse.json({ sent: false, reason: "line_error", detail: (await r.text()).slice(0, 200) });
  return NextResponse.json({ sent: true });
}
