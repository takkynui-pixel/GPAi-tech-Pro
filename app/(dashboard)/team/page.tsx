"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Stepper from "@/components/Stepper";
type D = { name?: string; rate?: number };
export default function Team() {
  const db=supabase(); const [rows,setRows]=useState<any[]>([]); const [name,setName]=useState(""); const [rate,setRate]=useState(10);
  const [draft,setDraft]=useState<Record<string,D>>({}); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  const load=async()=>{const {data,error}=await db.from("tenant_users").select("*"); if(error) setErr(error.message); setRows((data??[]).sort((x:any,y:any)=>(x.role==="owner"?0:1)-(y.role==="owner"?0:1)||String(x.name).localeCompare(String(y.name))));};
  useEffect(()=>{load();},[]);
  const add=async()=>{ if(!name.trim()) return; setBusy(true); setErr(""); const {error}=await db.rpc("add_team_member",{p_name:name.trim(),p_rate:rate}); setBusy(false); if(error) return setErr(error.message); setName(""); load(); };
  const save=async(t:any)=>{ setErr(""); const d=draft[t.id]??{}; const {error}=await db.rpc("update_team_member",{p_id:t.id,p_name:d.name??t.name,p_rate:d.rate??t.commission_rate}); if(error) return setErr(error.message); setDraft(({[t.id]:_,...r})=>r); load(); };
  const del=async(t:any)=>{ if(!confirm(`ลบช่าง "${t.name}" ?\nงานที่เคยมอบหมายจะไม่ถูกลบ แต่จะไม่มีชื่อช่างกำกับ`)) return; setErr(""); const {error}=await db.rpc("delete_team_member",{p_id:t.id}); if(error) return setErr(error.message); load(); };
  const set=(id:string,p:D)=>setDraft({...draft,[id]:{...draft[id],...p}});
  return (<div className="mx-auto max-w-2xl space-y-4"><h1 className="text-2xl font-semibold">ทีมช่าง</h1>
    {err && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-red-700">{err}</p>}
    <div className="card space-y-3"><h2 className="font-medium">เพิ่มช่าง</h2>
      <input className="inp" placeholder="ชื่อช่าง" value={name} onChange={e=>setName(e.target.value)}/>
      <div className="text-sm">ค่าคอมมิชชัน {rate}% ของกำไรงาน<Stepper value={rate} max={100} slider onChange={setRate}/></div>
      <button className="btn w-full" disabled={busy||!name.trim()} onClick={add}>{busy?"กำลังเพิ่ม...":"เพิ่มช่าง"}</button></div>
    {rows.map(t=>{const d=draft[t.id]; const nm=d?.name??t.name; const v=d?.rate??Number(t.commission_rate??0); const dirty=!!d&&((d.name!==undefined&&d.name!==t.name)||(d.rate!==undefined&&d.rate!==Number(t.commission_rate??0)));
      return <div key={t.id} className="card space-y-3">
        <label className="block text-sm">ชื่อ {t.role==="owner"&&<span className="text-muted">(เจ้าของ)</span>}<input className="inp mt-1" value={nm} onChange={e=>set(t.id,{name:e.target.value})}/></label>
        <div className="text-sm">ค่าคอม {v}%<Stepper value={v} max={100} slider onChange={n=>set(t.id,{rate:n})}/></div>
        <p className="text-sm text-muted">{t.line_user_id?"เชื่อม LINE แล้ว":`ผูก LINE: ให้ช่างแอดบอทแล้วพิมพ์ ช่าง ${t.link_code}`}</p>
        <div className="flex gap-2">{dirty && <button className="btn flex-1" disabled={!nm.trim()} onClick={()=>save(t)}>บันทึก</button>}
          {t.role!=="owner" && <button className="rounded-full bg-red-50 px-5 py-3 font-medium text-red-600 focus-visible:ring-2" onClick={()=>del(t)}>ลบช่าง</button>}</div></div>;})}
  </div>);
}
