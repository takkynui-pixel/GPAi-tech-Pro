import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { generateJson } from "@/lib/ai/gemini";
export async function POST(req: Request) {
  const s = supabaseServer(); const { data:{ user } } = await s.auth.getUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  const { symptom, category, image, job_id } = await req.json();
  if (!symptom && !image) return NextResponse.json({ error: "ใส่อาการหรือรูปอย่างน้อยหนึ่งอย่าง" }, { status: 400 });
  const sys = `คุณเป็นผู้ช่วยช่างผู้เชี่ยวชาญ (หมวด: ${category}) วิเคราะห์อาการเสียจากข้อความ/รูป ตอบภาษาไทยเป็น JSON เท่านั้น
{"likely_causes":[string],"checks":[string ขั้นตอนตรวจเช็คตามลำดับ],"suggested_parts":[string],"tools":[string],"est_minutes":number,"safety_note":string|null,"confidence":"low|medium|high"}
ถ้าข้อมูลไม่พอให้ confidence เป็น low และบอกว่าต้องตรวจหน้างาน ห้ามยืนยันสาเหตุเกินหลักฐาน`;
  const parts: any[] = [{ text: `อาการ: ${symptom ?? "(ไม่ได้ระบุ ดูจากรูป)"}` }];
  if (image) parts.push({ inline_data: { mime_type: "image/jpeg", data: image } });
  try {
    const result = await generateJson(sys, parts);
    await s.from("ai_job_diagnostics").insert({ job_id: job_id ?? null, category, symptom, ai_result: result });
    return NextResponse.json(result);
  } catch { return NextResponse.json({ error: "AI วิเคราะห์ไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 502 }); }
}
