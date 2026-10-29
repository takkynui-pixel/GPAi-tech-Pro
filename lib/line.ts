import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { decrypt } from "./crypto";
export const adminDb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
// Pro/Enterprise ที่เชื่อม LINE OA ของร้านเอง → ใช้ token ของร้าน ไม่เช่นนั้นใช้บอทกลาง
export async function getCreds(db: SupabaseClient, tenantId: string) {
  const { data: t } = await db.from("tenants").select("plan_type,line_connected").eq("id", tenantId).single();
  if (t && t.plan_type !== "free" && t.line_connected) {
    const { data: c } = await db.from("tenant_line_credentials").select("*").eq("tenant_id", tenantId).single();
    if (c) { try { return { own: true, token: decrypt(c.access_token_enc), secret: decrypt(c.channel_secret_enc) }; } catch {} }
  }
  return { own: false, token: process.env.LINE_CHANNEL_ACCESS_TOKEN!, secret: process.env.LINE_CHANNEL_SECRET! };
}
const post = (url: string, token: string, body: object) => fetch(url, { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify(body) });
export const push = (token: string, to: string, text: string) => post("https://api.line.me/v2/bot/message/push", token, { to, messages:[{ type:"text", text }] });
export const reply = (token: string, replyToken: string, text: string) => post("https://api.line.me/v2/bot/message/reply", token, { replyToken, messages:[{ type:"text", text }] });
export function validSig(raw: string, sig: string | null, secret: string) {
  const a = Buffer.from(sig ?? ""), b = Buffer.from(createHmac("sha256", secret).update(raw).digest("base64")); return a.length === b.length && timingSafeEqual(a, b);
}
// tenantId = โหมด LINE OA ของร้านเอง (ผูกเฉพาะร้านนั้น) / ไม่ระบุ = บอทกลาง (ลูกค้าต้องพิมพ์ "ร้าน <รหัส> <เบอร์>")
export async function handleEvents(db: SupabaseClient, events: any[], token: string, tenantId?: string) {
  for (const ev of events ?? []) {
    const uid = ev.source?.userId; if (!uid) continue;
    if (ev.type === "follow") { await reply(token, ev.replyToken, tenantId ? "ขอบคุณที่เพิ่มเพื่อนครับ พิมพ์เบอร์โทร 10 หลักที่ให้ไว้กับร้าน เพื่อรับแจ้งเตือนสถานะงาน" : "ขอบคุณที่เพิ่มเพื่อนครับ พิมพ์ \"ร้าน <รหัสร้าน> <เบอร์โทร>\" ตามที่ร้านแจ้ง เช่น ร้าน a1b2c3 0812345678"); continue; }
    if (ev.type !== "message" || ev.message?.type !== "text") continue;
    const text: string = ev.message.text.trim();
    const tech = text.match(/^ช่าง\s*([0-9a-f]{6})$/i);
    if (tech) { let q = db.from("tenant_users").update({ line_user_id: uid }).eq("link_code", tech[1].toLowerCase()); if (tenantId) q = q.eq("tenant_id", tenantId);
      const { data } = await q.select("name"); await reply(token, ev.replyToken, data?.length ? `เชื่อม LINE ให้ ${data[0].name} แล้ว จะได้รับแจ้งงานที่มอบหมายทางนี้ครับ` : "ไม่พบรหัสช่าง โปรดตรวจสอบกับเจ้าของร้าน"); continue; }
    let tid = tenantId, phoneRaw = text;
    if (!tid) { const m = text.match(/^ร้าน\s*([0-9a-f]{6})\s+(.+)$/i);
      if (!m) { if (/^ร้าน/.test(text)) await reply(token, ev.replyToken, "กรุณาพิมพ์ในรูปแบบ \"ร้าน <รหัสร้าน> <เบอร์โทร>\" เช่น ร้าน a1b2c3 0812345678 (ขอรหัสร้านจากร้านที่ใช้บริการ)"); continue; } // ข้อความทั่วไป: เงียบ
      const { data: t } = await db.from("tenants").select("id").eq("line_code", m[1].toLowerCase()).maybeSingle(); if (!t) { await reply(token, ev.replyToken, "ไม่พบรหัสร้านนี้ โปรดตรวจสอบกับทางร้านครับ"); continue; }
      tid = t.id; phoneRaw = m[2]; }
    if (tenantId && !/^[\d\s\-+()]+$/.test(text)) continue; // โหมด OA ของร้าน: ตอบเฉพาะข้อความที่เป็นเบอร์โทร ข้อความอื่นเงียบ
    const phone = phoneRaw.replace(/\D/g, "");
    if (!/^0\d{9}$/.test(phone)) { await reply(token, ev.replyToken, "รบกวนระบุเบอร์โทร 10 หลักครับ เช่น 0812345678"); continue; }
    const { data } = await db.from("customers").update({ line_id: uid }).eq("tenant_id", tid).eq("phone", phone).select("id");
    await reply(token, ev.replyToken, data?.length ? "เชื่อมต่อ LINE สำเร็จแล้วครับ ร้านจะแจ้งเตือนผ่านช่องทางนี้" : "ไม่พบเบอร์นี้ในระบบของร้าน โปรดตรวจสอบกับทางร้านครับ");
  }
}
