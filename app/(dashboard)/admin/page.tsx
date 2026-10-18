"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
export default function Admin() {
  const db=supabase(); const [rows,setRows]=useState<any[]|null>(null); const [denied,setDenied]=useState(false);
  const load=async()=>{const {data,error}=await db.rpc("admin_list_tenants"); if(error) setDenied(true); else setRows(data);};
  useEffect(()=>{load();},[]);
  const upd=async(t:any,p:{status?:string;plan?:string})=>{await db.rpc("admin_update_tenant",{p_id:t.id,p_status:p.status??t.status,p_plan:p.plan??t.plan_type}); load();};
  if(denied) return <p className="card">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>;
  if(!rows) return <p>กำลังโหลด...</p>;
  return (<div className="mx-auto max-w-4xl space-y-4"><h1 className="text-2xl font-semibold">ผู้ดูแลระบบ · ร้านทั้งหมด ({rows.length})</h1>
    {rows.map(t=><div key={t.id} className="card flex flex-wrap items-center justify-between gap-3">
      <div><p className="font-semibold">{t.shop_name} <span className="text-sm font-normal text-brand">/{t.slug}</span></p>
        <p className="text-sm text-brand">{t.jobs_count} งาน · {t.users_count} ผู้ใช้ · สมัคร {new Date(t.created_at).toLocaleDateString("th-TH")}</p></div>
      <div className="flex gap-2"><select className="inp !w-auto !py-2" value={t.plan_type} onChange={e=>upd(t,{plan:e.target.value})}>{["free","pro","enterprise"].map(p=><option key={p}>{p}</option>)}</select>
        <button className={`btn ${t.status==="active"?"!bg-red-600":""}`} onClick={()=>upd(t,{status:t.status==="active"?"suspended":"active"})}>{t.status==="active"?"ระงับร้าน":"เปิดใช้งานร้าน"}</button></div></div>)}
  </div>);
}
