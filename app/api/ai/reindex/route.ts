import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { embed } from "@/lib/ai/gemini";
const C: Record<string,string> = { electric:"ช่างไฟฟ้า", air:"ช่างแอร์ล้างแอร์ซ่อมแอร์", mobile:"ซ่อมมือถือ", computer:"ซ่อมคอมพิวเตอร์" };
export async function POST() {
  const s = supabaseServer(); const { data:{ user } } = await s.auth.getUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  const { data: t } = await s.from("tenants").select("id,shop_name,address,categories_enabled").single();
  if (!t) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });
  const { data: it } = await s.from("job_items").select("item_name").limit(300);
  const freq: Record<string,number> = {}; (it ?? []).forEach(i => freq[i.item_name] = (freq[i.item_name] ?? 0) + 1);
  const common = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,15).map(x=>x[0]);
  const content = `${t.shop_name} ที่อยู่ ${t.address ?? ""} บริการ ${(t.categories_enabled as string[]).map(c=>C[c]).join(", ")} งานที่ทำบ่อย ${common.join(", ")}`;
  try {
    const v = await embed(content);
    const { error } = await s.from("shop_geo_embeddings").upsert({ tenant_id: t.id, content, embedding: JSON.stringify(v), updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
    if (error) throw error; return NextResponse.json({ ok: true, content });
  } catch { return NextResponse.json({ error: "อัปเดตไม่สำเร็จ" }, { status: 502 }); }
}
