"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
export default function Team() {
  const db=supabase(); const [rows,setRows]=useState<any[]>([]); const [name,setName]=useState(""); const [rate,setRate]=useState(0); const [tid,setTid]=useState("");
  const load=async()=>{const {data}=await db.from("tenant_users").select("*").order("created_at"); setRows(data??[]); if(data?.[0]) setTid(data[0].tenant_id);};
  useEffect(()=>{load();},[]);
  const add=async()=>{ if(!name) return; await db.from("tenant_users").insert({tenant_id:tid,role:"technician",name,commission_rate:rate}); setName(""); setRate(0); load(); };
  const setR=async(id:string,v:number)=>{await db.from("tenant_users").update({commission_rate:v}).eq("id",id); load();};
  return (<div className="mx-auto max-w-2xl space-y-4"><h1 className="text-2xl font-semibold">ทีมช่าง</h1>
    <div className="card grid gap-3 md:grid-cols-3"><input className="inp" placeholder="ชื่อช่าง" value={name} onChange={e=>setName(e.target.value)}/>
      <input type="number" className="inp" placeholder="ค่าคอม % ของกำไรงาน" value={rate} onChange={e=>setRate(+e.target.value)}/><button className="btn" onClick={add}>เพิ่มช่าง</button></div>
    <div className="card divide-y divide-brand-ice">{rows.map(t=><div key={t.id} className="space-y-1 py-3">
      <div className="flex items-center justify-between gap-3"><p className="font-medium">{t.name} {t.role==="owner"&&"(เจ้าของ)"}</p>
        <label className="flex items-center gap-2 text-sm">ค่าคอม %<input type="number" className="inp !w-24 !py-2" defaultValue={t.commission_rate} onBlur={e=>setR(t.id,+e.target.value)}/></label></div>
      <p className="text-sm text-brand">{t.line_user_id?"เชื่อม LINE แล้ว":`ผูก LINE: ให้ช่างแอดบอทแล้วพิมพ์ ช่าง ${t.link_code}`}</p></div>)}</div></div>);
}
