import { supabaseServer } from "@/lib/supabase/server";
import { promptpayPayload } from "@/lib/promptpay";
import QRCode from "qrcode";
import Image from "next/image";
import AutoRefresh from "@/components/AutoRefresh";
import ApproveButton from "@/components/ApproveButton";
export const dynamic = "force-dynamic";
const ST:Record<string,string>={draft:"ร่างเอกสาร",pending:"รอเข้าบริการ",in_progress:"กำลังปฏิบัติงาน",completed:"งานเสร็จสิ้น",cancelled:"ยกเลิก"};
export default async function Track({ params }:{params:{token:string}}) {
  const { data } = await supabaseServer().rpc("get_public_job",{ p_token: params.token });
  if (!data) return <main className="p-8 text-center">ไม่พบเอกสาร ลิงก์อาจไม่ถูกต้อง</main>;
  const exp = data.warranty_expires_at ? Math.ceil((+new Date(data.warranty_expires_at)-Date.now())/864e5) : null;
  const total = Number(data.total_amount);
  const qr = data.promptpay_no && data.payment_status!=="paid" && total>0 ? await QRCode.toDataURL(promptpayPayload(data.promptpay_no,total),{margin:1,width:280}) : null;
  return (<main className="mx-auto max-w-md space-y-4 p-4"><AutoRefresh/>
    <div className="rounded-2xl bg-white p-4 shadow-card">{data.logo_url ? <img src={data.logo_url} alt={data.shop_name} className="h-12"/> : <p className="text-xl font-semibold">{data.shop_name}</p>}
      {data.phone && <a href={`tel:${data.phone}`} className="mt-1 block text-muted">โทร {data.phone}</a>}</div>
    <div className="card"><p className="text-sm text-muted">สถานะงาน</p><p className="text-xl font-semibold">{ST[data.status]??data.status}</p>
      {data.payment_status==="paid" && <p className="mt-1 font-medium text-brand-sky">ชำระเงินแล้ว</p>}
      {exp!==null && <p className="mt-2">{exp>0?`รับประกันอีก ${exp} วัน`:"หมดระยะรับประกันแล้ว"}</p>}</div>
    <div className="card">{(data.items as any[]).map((i,n)=><p key={n} className="flex justify-between py-1"><span>{i.item_name} × {i.quantity}</span><span>{(i.quantity*i.unit_price).toLocaleString()}</span></p>)}
      <p className="mt-3 flex justify-between border-t border-brand-ice pt-3 text-lg font-semibold"><span>รวม</span><span>{total.toLocaleString()} บาท</span></p></div>
    {!data.approved && ["pending","draft"].includes(data.status) && <ApproveButton token={params.token}/>}
    {qr && <div className="card text-center"><p className="mb-2 font-medium">สแกนจ่ายผ่าน PromptPay</p><img src={qr} alt="PromptPay QR" className="mx-auto"/></div>}
    <footer className="flex flex-col items-center gap-1 pt-2 text-sm text-muted"><Image src="/logo.png" alt="GPAi-tech" width={120} height={21}/>
      <p>ระบบติดตามงานซ่อมอัจฉริยะ โดย GPAi-tech</p><p className="font-medium">Verified &amp; Powered by GPAi-tech</p></footer>
  </main>);
}
