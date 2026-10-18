import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { generateJson } from "@/lib/ai/gemini";
export async function POST(req: Request) {
  const s = supabaseServer(); const { data:{ user } } = await s.auth.getUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  const { text } = await req.json();
  if (!text || text.length > 600) return NextResponse.json({ error: "ข้อความว่างหรือยาวเกินไป" }, { status: 400 });
  const { data: stock } = await s.from("products_inventory").select("id,name,category,selling_price,cost_price,unit");
  const sys = `คุณช่วยช่างสร้างใบเสนอราคาจากคำพูด ตอบเป็น JSON เท่านั้น รูปแบบ {"category":"electric|air|mobile|computer","items":[{"name":string,"product_id":string|null,"quantity":number,"unit_price":number}]}
จับคู่รายการกับสต๊อกนี้ถ้าตรง (ใช้ product_id และ selling_price ของสต๊อก) ถ้าไม่มีในสต๊อกให้ product_id เป็น null และ unit_price เป็น 0 ห้ามเดาราคา: ${JSON.stringify(stock ?? [])}`;
  try {
    const r = await generateJson(sys, [{ text }]);
    const items = (r.items ?? []).map((i: any) => { const p = stock?.find(x => x.id === i.product_id);
      return { product_id: p?.id ?? null, item_name: i.name, quantity: Math.max(1, Number(i.quantity) || 1), unit_price: p ? Number(p.selling_price) : Number(i.unit_price) || 0, unit_cost: p ? Number(p.cost_price) : 0 }; });
    return NextResponse.json({ category: ["electric","air","mobile","computer"].includes(r.category) ? r.category : "electric", items });
  } catch { return NextResponse.json({ error: "AI ประมวลผลไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 502 }); }
}
