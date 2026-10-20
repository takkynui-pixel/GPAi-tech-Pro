import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { adminDb, getCreds, push } from "@/lib/line";
import { KIND, kindOf } from "@/lib/doc";
export async function POST(req: Request) {
  const s = supabaseServer(); const { data:{ user } } = await s.auth.getUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  const { job_id } = await req.json();
  const { data: j } = await s.from("jobs").select("tenant_id,status,payment_status,public_share_token,total_amount,customers(name,line_id),tenants(shop_name)").eq("id", job_id).single();
  if (!j) return NextResponse.json({ sent: false, reason: "not_found" }, { status: 404 });
  const c: any = j.customers, shop: any = j.tenants;
  if (!c?.line_id) return NextResponse.json({ sent: false, reason: "no_line" });
  const link = `${new URL(req.url).origin}/track/${j.public_share_token}`;
  const text = `เรียนคุณ${c.name}\n${KIND[kindOf(j)].doc}จาก ${shop?.shop_name ?? "ร้านของเรา"}\nยอดรวม ${Number(j.total_amount).toLocaleString()} บาท\nดูรายละเอียด${j.payment_status==="paid"?"":"และชำระเงิน"}: ${link}`;
  const { token } = await getCreds(adminDb(), j.tenant_id);
  const r = await push(token, c.line_id, text);
  if (!r.ok) return NextResponse.json({ sent: false, reason: "line_error", detail: (await r.text()).slice(0, 200) });
  return NextResponse.json({ sent: true });
}
