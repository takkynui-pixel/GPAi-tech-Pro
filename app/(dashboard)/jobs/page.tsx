"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
const CATS:Record<string,string>={electric:"ไฟฟ้า",air:"แอร์",mobile:"มือถือ",computer:"คอมพิวเตอร์"};
const ST:Record<string,string>={draft:"ร่าง",pending:"รอเข้าบริการ",in_progress:"กำลังทำ",completed:"เสร็จสิ้น",cancelled:"ยกเลิก"};
export default function Jobs() {
  const db=supabase(); const [rows,setRows]=useState<any[]>([]); const [toast,setToast]=useState(""); const [sending,setSending]=useState("");
  const load=async()=>{const {data}=await db.from("jobs").select("*, customers(name,phone)").order("created_at",{ascending:false}).limit(100); setRows(data??[]);};
  useEffect(()=>{load();},[]);
  async function sendLine(j:any){
    setSending(j.id); setToast("");
    try{ const r=await fetch("/api/line/send-job",{method:"POST",body:JSON.stringify({job_id:j.id})}); const d=await r.json();
      if(d.sent) setToast("ส่งให้ลูกค้าทาง LINE แล้ว");
      else if(d.reason==="no_line"){ try{await navigator.clipboard.writeText(`${location.origin}/track/${j.public_share_token}`);}catch{} setToast("ลูกค้ายังไม่ได้ผูก LINE กับร้าน คัดลอกลิงก์ให้แล้ว วางส่งในแชทได้เลย"); }
      else setToast("ส่งไม่สำเร็จ: "+(d.detail??d.reason??"ไม่ทราบสาเหตุ")); }
    catch{ setToast("ส่งไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่"); }
    setSending(""); setTimeout(()=>setToast(""),6000);
  }
  const upd=async(id:string,p:object)=>{await db.from("jobs").update(p).eq("id",id); load();};
  return (<div className="mx-auto max-w-3xl space-y-4"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">ใบงานทั้งหมด</h1><Link href="/jobs/new" className="btn">สร้างใบงาน</Link></div>
    {rows.length===0 && <p className="text-muted">ยังไม่มีใบงาน</p>}
    {rows.map(j=>{const link=`${location.origin}/track/${j.public_share_token}`; return <div key={j.id} className="card space-y-2">
      <div className="flex justify-between"><p className="font-semibold">{j.customers?.name} · {CATS[j.category]}</p><span className="rounded-full bg-brand-ice px-3 py-1 text-sm">{ST[j.status]}</span></div>
      <p className="text-muted">{Number(j.total_amount).toLocaleString()} บาท · {j.payment_status==="paid"?"ชำระแล้ว":"ยังไม่ชำระ"}{j.customer_approved_at?" · ลูกค้าอนุมัติแล้ว":""}</p>
      <div className="flex flex-wrap gap-2">
        {j.status!=="completed" && j.status!=="cancelled" && <button className="btn" onClick={()=>upd(j.id,{status:"completed"})}>ปิดงาน</button>}
        {j.payment_status!=="paid" && <button className="btn !bg-brand-ice !text-brand" onClick={()=>upd(j.id,{payment_status:"paid"})}>รับชำระแล้ว</button>}
        <button className="btn !bg-brand-ice !text-brand" disabled={sending===j.id} onClick={()=>sendLine(j)}>{sending===j.id?"กำลังส่ง...":"ส่ง LINE"}</button>
        <a className="btn !bg-brand-ice !text-brand" href={link} target="_blank" rel="noreferrer">ดูหน้าลูกค้า</a></div></div>;})}
  {toast && <p role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-navy p-4 text-center text-white shadow-card">{toast}</p>}
  </div>);
}
