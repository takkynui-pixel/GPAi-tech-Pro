import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
const reply = (token:string, text:string) => fetch("https://api.line.me/v2/bot/message/reply",{ method:"POST",
  headers:{ "Content-Type":"application/json", Authorization:`Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` }, body:JSON.stringify({ replyToken:token, messages:[{type:"text",text}] }) });
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = Buffer.from(req.headers.get("x-line-signature") ?? "");
  const exp = Buffer.from(createHmac("sha256", process.env.LINE_CHANNEL_SECRET!).update(raw).digest("base64"));
  if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) return new NextResponse("invalid signature", { status: 401 });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  for (const ev of JSON.parse(raw).events ?? []) {
    const uid = ev.source?.userId; if (!uid) continue;
    if (ev.type === "follow") await reply(ev.replyToken, "ขอบคุณที่เพิ่มเพื่อนครับ พิมพ์เบอร์โทรที่ให้ไว้กับร้าน (10 หลัก) เพื่อรับแจ้งเตือนสถานะงานและรอบล้างแอร์");
    if (ev.type === "message" && ev.message?.type === "text") {
      const m = ev.message.text.trim().match(/^ช่าง\s*([0-9a-f]{6})$/i);
      if (m) { const { data } = await db.from("tenant_users").update({ line_user_id: uid }).eq("link_code", m[1].toLowerCase()).select("name");
        await reply(ev.replyToken, data?.length ? `เชื่อม LINE ให้ ${data[0].name} แล้ว จะได้รับแจ้งงานที่มอบหมายทางนี้ครับ` : "ไม่พบรหัสช่าง โปรดตรวจสอบกับเจ้าของร้าน"); continue; }
      const phone = ev.message.text.replace(/\D/g, "");
      if (!/^0\d{9}$/.test(phone)) { await reply(ev.replyToken, "รบกวนพิมพ์เบอร์โทร 10 หลักครับ เช่น 0812345678"); continue; }
      const { data } = await db.from("customers").update({ line_id: uid }).eq("phone", phone).select("id");
      await reply(ev.replyToken, data?.length ? "เชื่อมต่อ LINE สำเร็จแล้วครับ ร้านจะแจ้งเตือนผ่านช่องทางนี้" : "ไม่พบเบอร์นี้ในระบบ โปรดตรวจสอบกับทางร้านครับ");
    }
  }
  return NextResponse.json({ ok: true });
}
