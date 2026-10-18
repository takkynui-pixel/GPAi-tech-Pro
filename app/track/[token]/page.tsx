import { supabaseServer } from "@/lib/supabase/server";
import Image from "next/image";
export const dynamic = "force-dynamic";
export default async function Track({ params }:{params:{token:string}}) {
  const { data } = await supabaseServer().rpc("get_public_job",{ p_token: params.token });
  if (!data) return <main className="p-8 text-center">ไม่พบเอกสาร ลิงก์อาจไม่ถูกต้อง</main>;
  const exp = data.warranty_expires_at ? Math.ceil((+new Date(data.warranty_expires_at)-Date.now())/864e5) : null;
  return (<main className="mx-auto max-w-md space-y-4 p-4">
    <div className="rounded-2xl bg-white p-4 shadow-card">{data.logo_url ? <img src={data.logo_url} alt={data.shop_name} className="h-12"/> : <Image src="/logo.png" alt="GPAi-tech" width={200} height={36}/>}
      <p className="mt-2 font-semibold">{data.shop_name}</p></div>
    <div className="card"><p className="text-sm text-brand">สถานะงาน</p><p className="text-xl font-semibold">{data.status}</p>
      {exp!==null && <p className="mt-2">{exp>0?`รับประกันอีก ${exp} วัน`:"หมดระยะรับประกันแล้ว"}</p>}</div>
    <div className="card">{(data.items as any[]).map((i,n)=><p key={n} className="flex justify-between py-1"><span>{i.item_name} × {i.quantity}</span><span>{(i.quantity*i.unit_price).toLocaleString()}</span></p>)}
      <p className="mt-3 flex justify-between border-t border-brand-ice pt-3 text-lg font-semibold"><span>รวม</span><span>{Number(data.total_amount).toLocaleString()} บาท</span></p></div>
  </main>);
}
