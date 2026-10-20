"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { KIND, Kind, kindOf, docNo } from "@/lib/doc";
const CATS:Record<string,string>={electric:"ไฟฟ้า",air:"แอร์",mobile:"มือถือ",computer:"คอมพิวเตอร์"};
const TABS: (Kind|"all")[] = ["all","quote","invoice","receipt","cancel"];
const chip: Record<Kind,string> = { quote:"bg-brand-ice text-brand", invoice:"bg-amber-100 text-amber-800", receipt:"bg-emerald-100 text-emerald-800", cancel:"bg-gray-100 text-gray-600" };
export default function Jobs() {
  const db=supabase(); const [rows,setRows]=useState<any[]>([]); const [tab,setTab]=useState<Kind|"all">("all"); const [toast,setToast]=useState(""); const [sending,setSending]=useState("");
  const load=async()=>{const {data}=await db.from("jobs").select("*, customers(name,phone)").order("created_at",{ascending:false}).limit(200); setRows(data??[]);};
  useEffect(()=>{load();},[]);
  const upd=async(id:string,p:object)=>{await db.from("jobs").update(p).eq("id",id); load();};
  async function sendLine(j:any){
    setSending(j.id); setToast("");
    try{ const r=await fetch("/api/line/send-job",{method:"POST",body:JSON.stringify({job_id:j.id})}); const d=await r.json();
      if(d.sent) setToast("ส่งให้ลูกค้าทาง LINE แล้ว");
      else if(d.reason==="no_line"){ try{await navigator.clipboard.writeText(`${location.origin}/track/${j.public_share_token}`);}catch{} setToast("ลูกค้ายังไม่ได้ผูก LINE กับร้าน คัดลอกลิงก์ให้แล้ว วางส่งในแชทได้เลย"); }
      else setToast("ส่งไม่สำเร็จ: "+(d.detail??d.reason??"ไม่ทราบสาเหตุ")); }
    catch{ setToast("ส่งไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่"); }
    setSending(""); setTimeout(()=>setToast(""),6000);
  }
  const count=(k:Kind|"all")=>k==="all"?rows.length:rows.filter(j=>kindOf(j)===k).length;
  const list=rows.filter(j=>tab==="all"||kindOf(j)===tab);
  return (<div className="mx-auto max-w-3xl space-y-4"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">ใบงานทั้งหมด</h1><Link href="/jobs/new" className="btn">สร้างใบงาน</Link></div>
    <div role="tablist" aria-label="หมวดเอกสาร" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map(k=><button key={k} role="tab" aria-selected={tab===k} onClick={()=>setTab(k)}
        className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-brand-light ${tab===k?"bg-brand font-medium text-white":"bg-white text-navy shadow-card"}`}>{k==="all"?"ทั้งหมด":KIND[k].tab} <span className={tab===k?"opacity-80":"text-muted"}>{count(k)}</span></button>)}</div>
    {list.length===0 && <p className="text-muted">ไม่มีเอกสารในหมวดนี้</p>}
    {list.map(j=>{const k=kindOf(j); const link=`${location.origin}/track/${j.public_share_token}`; return <div key={j.id} className="card space-y-2">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-semibold">{j.customers?.name} · {CATS[j.category]}</p><p className="text-sm text-muted">{docNo(j)}</p></div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm ${chip[k]}`}>{KIND[k].doc}</span></div>
      <p className="text-muted">{Number(j.total_amount).toLocaleString()} บาท{k!=="receipt"&&k!=="cancel"?` · ${j.payment_status==="paid"?"ชำระแล้ว":"ยังไม่ชำระ"}`:""}{j.customer_approved_at?" · ลูกค้าอนุมัติแล้ว":""}</p>
      <div className="flex flex-wrap gap-2">
        {j.status!=="completed" && j.status!=="cancelled" && <button className="btn" onClick={()=>upd(j.id,{status:"completed"})}>ปิดงาน</button>}
        {j.payment_status!=="paid" && j.status!=="cancelled" && <button className={`btn ${j.status==="completed"?"":"!bg-brand-ice !text-brand"}`} onClick={()=>upd(j.id,{payment_status:"paid"})}>รับชำระแล้ว</button>}
        {k!=="cancel" && <button className="btn !bg-brand-ice !text-brand" disabled={sending===j.id} onClick={()=>sendLine(j)}>{sending===j.id?"กำลังส่ง...":`ส่ง${KIND[k].doc} ทาง LINE`}</button>}
        <a className="btn !bg-brand-ice !text-brand" href={link} target="_blank" rel="noreferrer">ดูหน้าลูกค้า</a></div></div>;})}
    {toast && <p role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-navy p-4 text-center text-white shadow-card">{toast}</p>}
  </div>);
}
