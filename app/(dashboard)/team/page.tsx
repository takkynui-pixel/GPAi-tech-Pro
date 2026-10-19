"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Stepper from "@/components/Stepper";
export default function Team() {
  const db=supabase(); const [rows,setRows]=useState<any[]>([]); const [name,setName]=useState(""); const [rate,setRate]=useState(10);
  const [draft,setDraft]=useState<Record<string,number>>({}); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  const load=async()=>{const {data,error}=await db.from("tenant_users").select("*"); if(error) setErr(error.message); setRows((data??[]).sort((x:any,y:any)=>(x.role==="owner"?0:1)-(y.role==="owner"?0:1)||String(x.name).localeCompare(String(y.name))));};
  useEffect(()=>{load();},[]);
  const add=async()=>{ if(!name.trim()) return; setBusy(true); setErr(""); const {error}=await db.rpc("add_team_member",{p_name:name.trim(),p_rate:rate}); setBusy(false);
    if(error) return setErr(error.message); setName(""); load(); };
  const save=async(id:string)=>{ setErr(""); const {error}=await db.rpc("set_team_rate",{p_id:id,p_rate:draft[id]}); if(error) return setErr(error.message); setDraft(({[id]:_,...r})=>r); load(); };
  return (<div className="mx-auto max-w-2xl space-y-4"><h1 className="text-2xl font-semibold">ทีมช่าง</h1>
    {err && <p className="rounded-2xl bg-red-50 p-3 text-red-700">{err}</p>}
    <div className="card space-y-3"><h2 className="font-medium">เพิ่มช่าง</h2>
      <input className="inp" placeholder="ชื่อช่าง" value={name} onChange={e=>setName(e.target.value)}/>
      <div className="text-sm">ค่าคอมมิชชัน {rate}% ของกำไรงาน<Stepper value={rate} max={100} slider onChange={setRate}/></div>
      <button className="btn w-full" disabled={busy||!name.trim()} onClick={add}>{busy?"กำลังเพิ่ม...":"เพิ่มช่าง"}</button></div>
    <div className="card divide-y divide-brand-ice">{rows.map(t=>{const v=draft[t.id]??Number(t.commission_rate??0); return <div key={t.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
      <p className="font-medium">{t.name} {t.role==="owner"&&<span className="text-sm font-normal text-muted">(เจ้าของ)</span>}</p>
      <div className="text-sm">ค่าคอม {v}%<Stepper value={v} max={100} slider onChange={n=>setDraft({...draft,[t.id]:n})}/></div>
      {draft[t.id]!==undefined && draft[t.id]!==Number(t.commission_rate??0) && <button className="btn w-full" onClick={()=>save(t.id)}>บันทึกค่าคอม</button>}
      <p className="text-sm text-muted">{t.line_user_id?"เชื่อม LINE แล้ว":`ผูก LINE: ให้ช่างแอดบอทแล้วพิมพ์ ช่าง ${t.link_code}`}</p></div>;})}</div></div>);
}
