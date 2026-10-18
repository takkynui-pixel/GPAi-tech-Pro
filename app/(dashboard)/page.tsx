import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Home() {
  const s = supabaseServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: jobs }, { data: low }] = await Promise.all([
    s.from("jobs").select("id,category,total_amount,total_cost,status,created_at").order("created_at",{ascending:false}).limit(50),
    s.from("low_stock").select("id,name,stock_quantity,unit")]);
  const done = (jobs??[]).filter(j=>j.status==="completed");
  const rev = done.reduce((a,j)=>a+Number(j.total_amount),0), profit = rev - done.reduce((a,j)=>a+Number(j.total_cost),0);
  const stat = [["งานทั้งหมด",jobs?.length??0],["รายรับ (บาท)",rev.toLocaleString()],["กำไรเบื้องต้น (บาท)",profit.toLocaleString()],["อะไหล่ใกล้หมด",low?.length??0]];
  return (<div className="space-y-6">
    <h1 className="text-2xl font-semibold">ภาพรวมวันนี้</h1>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stat.map(([l,v],i)=><div key={l as string} className={`rounded-2xl p-5 text-white shadow-card ${["bg-brand-sky","bg-brand","bg-brand-light text-navy","bg-navy"][i]}`}><p className="text-sm opacity-90">{l}</p><p className="mt-2 text-3xl font-semibold">{v}</p></div>)}
    </div>
    <div className="card"><h2 className="mb-3 font-medium">อะไหล่ใกล้หมด</h2>
      {low?.length ? low.map(p=><p key={p.id} className="flex justify-between border-b border-brand-ice py-2"><span>{p.name}</span><span className="font-medium text-red-600">เหลือ {p.stock_quantity} {p.unit}</span></p>) : <p className="text-brand">สต๊อกปกติทุกรายการ</p>}
    </div></div>);
}
