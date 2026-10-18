"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
export default function Settings() {
  const db=supabase(); const [t,setT]=useState<any>(null); const [msg,setMsg]=useState("");
  useEffect(()=>{db.from("tenants").select("*").single().then(({data})=>setT(data));},[]);
  if(!t) return <p>กำลังโหลด...</p>;
  const F=[["shop_name","ชื่อร้าน"],["phone","เบอร์โทร"],["address","ที่อยู่"],["promptpay_no","เบอร์ PromptPay / เลขบัตรประชาชน"],["logo_url","ลิงก์โลโก้ร้าน"]];
  return (<div className="mx-auto max-w-lg space-y-3"><h1 className="text-2xl font-semibold">ตั้งค่าร้าน</h1>
    <div className="card grid gap-3">{F.map(([k,l])=><label key={k} className="text-sm">{l}<input className="inp mt-1" value={t[k]??""} onChange={e=>setT({...t,[k]:e.target.value})}/></label>)}
      <button className="btn" onClick={async()=>{const {error}=await db.from("tenants").update({shop_name:t.shop_name,phone:t.phone,address:t.address,promptpay_no:t.promptpay_no,logo_url:t.logo_url}).eq("id",t.id);setMsg(error?error.message:"บันทึกแล้ว")}}>บันทึกการตั้งค่า</button>
      {msg && <p className="text-muted">{msg}</p>}<p className="text-sm text-muted">หน้าร้านสาธารณะ: /s/{t.slug}</p></div></div>);
}
