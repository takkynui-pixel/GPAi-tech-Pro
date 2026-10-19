import { supabaseServer } from "@/lib/supabase/server";
import { promptpayPayload } from "@/lib/promptpay";
import QRCode from "qrcode";
import Image from "next/image";
import AutoRefresh from "@/components/AutoRefresh";
import ApproveButton from "@/components/ApproveButton";
import PrintButton from "@/components/PrintButton";
export const dynamic = "force-dynamic";
const ST:Record<string,string>={draft:"ร่างเอกสาร",pending:"รอเข้าบริการ",in_progress:"กำลังปฏิบัติงาน",completed:"งานเสร็จสิ้น",cancelled:"ยกเลิก"};
const B=(n:number)=>n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
export default async function Track({ params }:{params:{token:string}}) {
  const { data } = await supabaseServer().rpc("get_public_job",{ p_token: params.token });
  if (!data) return <main className="p-8 text-center">ไม่พบเอกสาร ลิงก์อาจไม่ถูกต้อง</main>;
  const items = data.items as {item_name:string;quantity:number;unit_price:number}[];
  const sub = items.reduce((a,i)=>a+i.quantity*i.unit_price,0), discount = Number(data.discount ?? 0), vat = Number(data.vat_amount ?? 0), total = Number(data.total_amount);
  const paid = data.payment_status === "paid";
  const kind = paid ? { th:"ใบเสร็จรับเงิน", en:"Receipt", p:"RC" } : data.status === "completed" ? { th:"ใบแจ้งหนี้", en:"Invoice", p:"INV" } : { th:"ใบเสนอราคา", en:"Quotation", p:"QT" };
  const d = new Date(data.created_at);
  const pt = Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Bangkok",year:"2-digit",month:"2-digit"}).formatToParts(d).map(p=>[p.type,p.value]));
  const docNo = `${kind.p}-${pt.year}${pt.month}-${String(data.doc_seq ?? 0).padStart(4,"0")}`;
  const dateTh = d.toLocaleDateString("th-TH",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Bangkok"});
  const exp = data.warranty_expires_at ? Math.ceil((+new Date(data.warranty_expires_at)-Date.now())/864e5) : null;
  const qr = data.promptpay_no && !paid && total>0 ? await QRCode.toDataURL(promptpayPayload(data.promptpay_no,total),{margin:1,width:220}) : null;
  const info = Object.entries((data.info ?? {}) as Record<string,string>).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(" · ");
  const c = data.customer ?? {};
  const row = "flex justify-between py-1";
  return (<main className="mx-auto max-w-3xl space-y-4 p-3 md:p-6"><AutoRefresh/>
    <div className="card print:hidden"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm text-muted">สถานะงาน</p><p className="text-xl font-semibold">{ST[data.status]??data.status}</p></div>
      {paid && <span className="rounded-full bg-brand-ice px-3 py-1 font-medium text-brand">ชำระเงินแล้ว</span>}</div>
      {exp!==null && <p className="mt-2">{exp>0?`รับประกันอีก ${exp} วัน`:"หมดระยะรับประกันแล้ว"}</p>}</div>

    <article className="rounded-3xl bg-white p-5 shadow-card print:rounded-none print:p-0 print:shadow-none md:p-8">
      <header className="flex items-start justify-between gap-4 border-b border-brand pb-4">
        <div className="min-w-0">{data.logo_url ? <img src={data.logo_url} alt={data.shop_name} className="max-h-16 max-w-[180px] object-contain"/> : <p className="text-xl font-semibold text-brand">{data.shop_name}</p>}</div>
        <div className="shrink-0 text-right"><h1 className="text-2xl font-semibold text-brand md:text-3xl">{kind.th}</h1><p className="font-medium text-brand">{kind.en}</p><p className="mt-1 text-sm">เลขที่ : {docNo}</p></div>
      </header>

      <section className="mt-4 text-sm">
        <h2 className="mb-1 font-semibold text-brand">ข้อมูลลูกค้า</h2>
        <dl className="grid grid-cols-[6.5rem_1fr] gap-x-2 gap-y-0.5">
          <dt className="font-medium">วันที่</dt><dd>: {dateTh}</dd>
          <dt className="font-medium">ชื่อลูกค้า</dt><dd>: {c.name ?? "-"}</dd>
          {c.address && <><dt className="font-medium">ที่อยู่</dt><dd>: {c.address}</dd></>}
          {c.phone && <><dt className="font-medium">เบอร์ติดต่อ</dt><dd>: {c.phone}</dd></>}
        </dl>
      </section>

      <table className="mt-5 w-full text-xs sm:text-sm"><thead><tr className="border-y border-brand text-brand">
        <th className="w-8 py-2 text-left font-semibold">ลำดับ</th><th className="py-2 text-left font-semibold">รายละเอียดงาน</th>
        <th className="w-12 py-2 text-right font-semibold">จำนวน</th><th className="w-20 py-2 text-right font-semibold">ราคา/หน่วย</th><th className="w-24 py-2 text-right font-semibold">ราคารวม</th></tr></thead>
        <tbody>{items.map((i,n)=><tr key={n} className="align-top"><td className="py-2">{n+1}</td><td className="py-2 pr-2">{i.item_name}</td>
          <td className="py-2 text-right">{i.quantity}</td><td className="py-2 text-right">{B(i.unit_price)}</td><td className="py-2 text-right">{B(i.quantity*i.unit_price)}</td></tr>)}
          {info && <tr><td/><td colSpan={4} className="pb-2 text-xs text-muted">{info}</td></tr>}</tbody></table>

      <section className="ml-auto mt-3 w-full border-t border-brand pt-2 text-sm sm:w-72">
        <p className={row}><span>ราคารวม</span><span>{B(sub)}</span></p>
        <p className={row}><span>ส่วนลด</span><span>{discount>0?B(discount):"-"}</span></p>
        <p className={row}><span>ภาษีมูลค่าเพิ่ม (7%)</span><span>{vat>0?B(vat):"-"}</span></p>
        <p className={`${row} border-t border-brand pt-2 text-base font-semibold text-brand`}><span>ราคารวมทั้งหมด</span><span>{B(total)} บาท</span></p>
      </section>

      {(data.bank_account_no || qr) && <section className="mt-6 border-t border-brand pt-4"><h2 className="mb-2 font-semibold">ช่องทางการชำระเงิน</h2>
        <div className="flex flex-wrap items-start justify-between gap-4 text-sm">
          {data.bank_account_no && <div className="space-y-0.5">{data.bank_account_name && <p>ชื่อบัญชี : {data.bank_account_name}</p>}<p>เลขที่บัญชี : {data.bank_account_no}</p>{data.bank_name && <p>ธนาคาร : {data.bank_name}</p>}</div>}
          {qr && <div className="text-center"><img src={qr} alt="PromptPay QR" width={150} height={150}/><p className="text-xs text-muted">สแกนจ่ายผ่าน PromptPay</p></div>}
        </div></section>}

      <footer className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-brand pt-4 text-sm">
        <div><p className="font-semibold text-brand">{data.shop_name}</p>{data.address && <p>{data.address}</p>}{data.phone && <p>โทร {data.phone}</p>}{data.tax_id && <p>เลขประจำตัวผู้เสียภาษี : {data.tax_id}</p>}</div>
        <div className="text-right"><p className="font-semibold text-brand">ขอบคุณ / Thank You</p><p className="flex items-center justify-end gap-1 text-xs text-muted"><Image src="/icon-192.png" alt="" width={14} height={14}/>Verified &amp; Powered by GPAi-tech</p></div>
      </footer>
    </article>

    {!data.approved && ["pending","draft"].includes(data.status) && <div className="print:hidden"><ApproveButton token={params.token}/></div>}
    <PrintButton/>
  </main>);
}
