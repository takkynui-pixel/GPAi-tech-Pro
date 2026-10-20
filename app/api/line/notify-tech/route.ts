import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { adminDb, getCreds, push } from "@/lib/line";
export async function POST(req: Request) {
  const s = supabaseServer(); const { data:{ user } } = await s.auth.getUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  const { schedule_id } = await req.json();
  const { data: sc } = await s.from("job_schedules").select("tenant_id,scheduled_start,address,google_maps_url,assigned_technician_id,jobs(category,customers(name,phone))").eq("id", schedule_id).single();
  if (!sc?.assigned_technician_id) return NextResponse.json({ sent: false });
  const admin = adminDb();
  const { data: t } = await admin.from("tenant_users").select("line_user_id").eq("id", sc.assigned_technician_id).single();
  if (!t?.line_user_id) return NextResponse.json({ sent: false, reason: "technician has no LINE" });
  const j: any = sc.jobs;
  const text = `งานใหม่ ${new Date(sc.scheduled_start).toLocaleString("th-TH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Bangkok"})}\nลูกค้า: ${j?.customers?.name} ${j?.customers?.phone ?? ""}\n${sc.address ?? ""}\n${sc.google_maps_url ?? ""}`;
  const { token } = await getCreds(admin, sc.tenant_id);
  const r = await push(token, t.line_user_id, text);
  return NextResponse.json({ sent: r.ok });
}
