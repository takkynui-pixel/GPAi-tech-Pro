"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
const CATS:Record<string,string>={electric:"ไฟฟ้า",air:"แอร์",mobile:"มือถือ",computer:"คอมพิวเตอร์"};
const ST:Record<string,string>={pending:"รอเข้าบริการ",in_progress:"กำลังปฏิบัติงาน",completed:"เสร็จสิ้น"};
export default function Calendar() {
  const db=supabase(); const [rows,setRows]=useState<any[]>([]); const [jobs,setJobs]=useState<any[]>([]); const [techs,setTechs]=useState<any[]>([]);
  const [f,setF]=useState({job_id:"",tech:"",start:"",address:""});
  async function load(){
    const since=new Date(Date.now()-864e5).toISOString();
    const [s,j,t]=await Promise.all([
      db.from("job_schedules").select("*, jobs(id,category,status,customers(name,phone)), tenant_users(name)").gte("scheduled_start",since).order("scheduled_start"),
      db.from("jobs").select("id,category,customers(name)").in("status",["pending","in_progress"]).order("created_at",{ascending:false}),
      db.from("tenant_users").select("id,name")]);
    setRows(s.data??[]); setJobs(j.data??[]); setTechs(t.data??[]);
  }
  useEffect(()=>{load();},[]);
  async function add(){
    if(!f.job_id||!f.start) return;
    const st=new Date(f.start);
    await db.from("job_schedules").insert({job_id:f.job_id,assigned_technician_id:f.tech||null,scheduled_start:st.toISOString(),scheduled_end:new Date(+st+36e5).toISOString(),
      address:f.address,google_maps_url:f.address?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.address)}`:null});
    setF({...f,job_id:"",start:"",address:""}); load();
  }
  const setStatus=async(id:string,status:string)=>{ await db.from("jobs").update({status}).eq("id",id); load(); };
  const days:Record<string,any[]>={}; rows.forEach(r=>{const d=new Date(r.scheduled_start).toLocaleDateString("th-TH",{weekday:"long",day:"numeric",month:"long"}); (days[d]??=[]).push(r);});
  return (<div className="mx-auto max-w-3xl space-y-6"><h1 className="text-2xl font-semibold">ปฏิทินงาน</h1>
    <div className="card grid gap-3 md:grid-cols-2"><h2 className="font-medium md:col-span-2">นัดหมายงานใหม่</h2>
      <select className="inp" value={f.job_id} onChange={e=>setF({...f,job_id:e.target.value})}><option value="">เลือกใบงาน</option>
        {jobs.map(j=><option key={j.id} value={j.id}>{CATS[j.category]} · {j.customers?.name}</option>)}</select>
      <select className="inp" value={f.tech} onChange={e=>setF({...f,tech:e.target.value})}><option value="">มอบหมายช่าง (ไม่ระบุ)</option>{techs.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <input type="datetime-local" className="inp" value={f.start} onChange={e=>setF({...f,start:e.target.value})}/>
      <input className="inp" placeholder="ที่อยู่หน้างาน" value={f.address} onChange={e=>setF({...f,address:e.target.value})}/>
      <button className="btn md:col-span-2" onClick={add}>บันทึกนัดหมาย</button></div>
    {Object.keys(days).length===0 && <p className="text-brand">ยังไม่มีนัดหมาย เพิ่มนัดแรกด้านบน</p>}
    {Object.entries(days).map(([d,list])=><section key={d} className="space-y-3"><h2 className="font-medium text-brand">{d}</h2>
      {list.map(r=><div key={r.id} className="card space-y-2">
        <div className="flex justify-between"><p className="font-semibold">{new Date(r.scheduled_start).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})} · {r.jobs?.customers?.name}</p>
          <span className="rounded-full bg-brand-ice px-3 py-1 text-sm">{ST[r.jobs?.status]??r.jobs?.status}</span></div>
        <p className="text-sm text-brand">{CATS[r.jobs?.category]} · ช่าง: {r.tenant_users?.name??"ยังไม่ระบุ"}{r.address?` · ${r.address}`:""}</p>
        <div className="flex flex-wrap gap-2">
          {r.google_maps_url && <a className="btn !bg-brand" href={r.google_maps_url} target="_blank" rel="noreferrer">นำทาง</a>}
          {r.jobs?.customers?.phone && <a className="btn !bg-brand" href={`tel:${r.jobs.customers.phone}`}>โทรหาลูกค้า</a>}
          {r.jobs?.status==="pending" && <button className="btn" onClick={()=>setStatus(r.jobs.id,"in_progress")}>เริ่มงาน</button>}
          {r.jobs?.status==="in_progress" && <button className="btn" onClick={()=>setStatus(r.jobs.id,"completed")}>ปิดงาน</button>}
        </div></div>)}</section>)}
  </div>);
}
