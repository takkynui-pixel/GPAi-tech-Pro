"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
const CATS:Record<string,string>={electric:"ไฟฟ้า",air:"แอร์",mobile:"มือถือ",computer:"คอมพิวเตอร์"};
const ST:Record<string,string>={draft:"ร่าง",pending:"รอเข้าบริการ",in_progress:"กำลังทำ",completed:"เสร็จสิ้น",cancelled:"ยกเลิก"};
export default function Jobs() {
  const db=supabase(); const [rows,setRows]=useState<any[]>([]);
  const load=async()=>{const {data}=await db.from("jobs").select("*, customers(name,phone)").order("created_at",{ascending:false}).limit(100); setRows(data??[]);};
  useEffect(()=>{load();},[]);
  const upd=async(id:string,p:object)=>{await db.from("jobs").update(p).eq("id",id); load();};
  return (<div className="mx-auto max-w-3xl space-y-4"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">ใบงานทั้งหมด</h1><Link href="/jobs/new" className="btn">สร้างใบงาน</Link></div>
    {rows.length===0 && <p className="text-muted">ยังไม่มีใบงาน</p>}
    {rows.map(j=>{const link=`${location.origin}/track/${j.public_share_token}`; return <div key={j.id} className="card space-y-2">
      <div className="flex justify-between"><p className="font-semibold">{j.customers?.name} · {CATS[j.category]}</p><span className="rounded-full bg-brand-ice px-3 py-1 text-sm">{ST[j.status]}</span></div>
      <p className="text-muted">{Number(j.total_amount).toLocaleString()} บาท · {j.payment_status==="paid"?"ชำระแล้ว":"ยังไม่ชำระ"}{j.customer_approved_at?" · ลูกค้าอนุมัติแล้ว":""}</p>
      <div className="flex flex-wrap gap-2">
        {j.status!=="completed" && j.status!=="cancelled" && <button className="btn" onClick={()=>upd(j.id,{status:"completed"})}>ปิดงาน</button>}
        {j.payment_status!=="paid" && <button className="btn !bg-brand-ice !text-brand" onClick={()=>upd(j.id,{payment_status:"paid"})}>รับชำระแล้ว</button>}
        <a className="btn !bg-brand-ice !text-brand" href={`https://line.me/R/share?text=${encodeURIComponent("ใบงานของคุณ "+link)}`}>ส่ง LINE</a>
        <a className="btn !bg-brand-ice !text-brand" href={link} target="_blank" rel="noreferrer">ดูหน้าลูกค้า</a></div></div>;})}
  </div>);
}
