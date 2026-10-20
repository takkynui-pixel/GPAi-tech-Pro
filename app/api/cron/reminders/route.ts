import { NextResponse } from "next/server";
import { adminDb, getCreds, push } from "@/lib/line";
export const dynamic = "force-dynamic";
const TEXT: Record<string,(s:string,n:string)=>string> = {
  air_cleaning_6m: (s,n)=>`สวัสดีครับคุณ${n} แอร์ที่บ้านถึงรอบล้างทำความสะอาด 6 เดือนแล้ว ติดต่อ ${s} เพื่อจองคิวได้เลยครับ`,
  warranty_expiring: (s,n)=>`สวัสดีครับคุณ${n} การรับประกันงานซ่อมจาก ${s} จะหมดใน 7 วัน หากมีอาการผิดปกติ รีบแจ้งร้านเพื่อตรวจเช็คฟรีนะครับ`,
  pickup_device: (s,n)=>`สวัสดีครับคุณ${n} เครื่องของท่านซ่อมเสร็จแล้ว รบกวนมารับที่ ${s} ได้เลยครับ`,
};
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse("unauthorized", { status: 401 });
  const db = adminDb(); const tokens: Record<string,string> = {};
  const { data } = await db.from("automated_reminders").select("id,tenant_id,reminder_type,customers(name,line_id),tenants(shop_name)")
    .eq("status","pending").lte("scheduled_date", new Date().toISOString().slice(0,10)).limit(200);
  let sent = 0, failed = 0;
  for (const r of (data ?? []) as any[]) {
    let ok = false;
    if (r.customers?.line_id) {
      tokens[r.tenant_id] ??= (await getCreds(db, r.tenant_id)).token;
      ok = (await push(tokens[r.tenant_id], r.customers.line_id, TEXT[r.reminder_type](r.tenants.shop_name, r.customers.name))).ok;
    }
    await db.from("automated_reminders").update({ status: ok ? "sent" : "failed" }).eq("id", r.id);
    ok ? sent++ : failed++;
  }
  return NextResponse.json({ sent, failed });
}
