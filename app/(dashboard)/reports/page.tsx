"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
const CATS:Record<string,string>={electric:"ไฟฟ้า",air:"แอร์",mobile:"มือถือ",computer:"คอมพิวเตอร์"};
const baht=(n:number)=>Math.round(n).toLocaleString();
export default function Reports() {
  const db=supabase(); const [month,setMonth]=useState(new Date().toISOString().slice(0,7));
  const [jobs,setJobs]=useState<any[]>([]); const [items,setItems]=useState<any[]>([]); const [techs,setTechs]=useState<any[]>([]);
  useEffect(()=>{(async()=>{
    const s=new Date(month+"-01"), e=new Date(s.getFullYear(),s.getMonth()+1,1);
    const [a,b,c]=await Promise.all([
      db.from("jobs").select("category,total_amount,total_cost,extra_cost,assigned_technician_id").eq("status","completed").gte("created_at",s.toISOString()).lt("created_at",e.toISOString()),
      db.from("job_items").select("item_name,quantity,unit_price,unit_cost,jobs!inner(status,created_at)").not("product_id","is",null).eq("jobs.status","completed").gte("jobs.created_at",s.toISOString()).lt("jobs.created_at",e.toISOString()),
      db.from("tenant_users").select("id,name,commission_rate")]);
    setJobs(a.data??[]); setItems(b.data??[]); setTechs(c.data??[]);
  })();},[month]);
  const rate=(id:string)=>Number(techs.find(t=>t.id===id)?.commission_rate??0);
  const profitOf=(j:any)=>Number(j.total_amount)-Number(j.total_cost)-Number(j.extra_cost??0);
  const comm=(j:any)=>j.assigned_technician_id?profitOf(j)*rate(j.assigned_technician_id)/100:0;
  const rev=jobs.reduce((a,j)=>a+Number(j.total_amount),0), parts=jobs.reduce((a,j)=>a+Number(j.total_cost),0), extra=jobs.reduce((a,j)=>a+Number(j.extra_cost??0),0), cm=jobs.reduce((a,j)=>a+comm(j),0);
  const net=rev-parts-extra-cm;
  const byTech=techs.map(t=>{const js=jobs.filter(j=>j.assigned_technician_id===t.id);return{...t,n:js.length,sales:js.reduce((a,j)=>a+Number(j.total_amount),0),pay:js.reduce((a,j)=>a+comm(j),0)};}).filter(t=>t.n>0);
  const parts_:Record<string,{q:number;rev:number;profit:number}>={}; items.forEach(i=>{const p=(parts_[i.item_name]??={q:0,rev:0,profit:0}); p.q+=i.quantity; p.rev+=i.quantity*i.unit_price; p.profit+=i.quantity*(i.unit_price-i.unit_cost);});
  const top=Object.entries(parts_).sort((a,b)=>b[1].q-a[1].q).slice(0,10);
  const cats=Object.keys(CATS).map(k=>[k,jobs.filter(j=>j.category===k).reduce((a,j)=>a+Number(j.total_amount),0)] as [string,number]); const mx=Math.max(1,...cats.map(c=>c[1]));
  return (<div className="mx-auto max-w-3xl space-y-5"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">รายงานกำไร-ขาดทุน</h1>
    <input type="month" className="inp !w-auto" value={month} onChange={e=>setMonth(e.target.value)}/></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["รายรับ",rev],["ต้นทุนอะไหล่",parts],["ค่าแรง/เดินทาง",extra],["ค่าคอมช่าง",cm]].map(([l,v],i)=>
      <div key={l as string} className={`rounded-2xl p-4 text-white shadow-card ${["bg-brand-sky","bg-brand","bg-brand-light !text-navy","bg-navy"][i]}`}><p className="text-sm">{l}</p><p className="mt-1 text-2xl font-semibold">{baht(v as number)}</p></div>)}</div>
    <div className="card flex items-center justify-between"><span className="font-medium">กำไรสุทธิ ({jobs.length} งาน)</span><span className={`text-3xl font-semibold ${net<0?"text-red-600":""}`}>{baht(net)} บาท</span></div>
    <div className="card space-y-2"><h2 className="font-medium">รายได้แยกหมวดช่าง</h2>{cats.map(([k,v])=><div key={k} className="flex items-center gap-3"><span className="w-28 text-sm">{CATS[k]}</span>
      <div className="h-4 flex-1 rounded-full bg-brand-ice"><div className="h-4 rounded-full bg-brand-sky" style={{width:`${v/mx*100}%`}}/></div><span className="w-20 text-right text-sm">{baht(v)}</span></div>)}</div>
    <div className="card"><h2 className="mb-2 font-medium">ค่าคอม/ค่าตอบแทนช่าง</h2>{byTech.length===0?<p className="text-brand">ยังไม่มีงานที่มอบหมายให้ช่างในเดือนนี้</p>:byTech.map(t=>
      <p key={t.id} className="flex justify-between border-b border-brand-ice py-2"><span>{t.name} · {t.n} งาน · ยอดขาย {baht(t.sales)}</span><span className="font-semibold">{baht(t.pay)} บาท</span></p>)}</div>
    <div className="card"><h2 className="mb-2 font-medium">อะไหล่ขายดี 10 อันดับ</h2>{top.length===0?<p className="text-brand">ยังไม่มีข้อมูล</p>:top.map(([n,p])=>
      <p key={n} className="flex justify-between border-b border-brand-ice py-2"><span>{n} × {p.q}</span><span>ขาย {baht(p.rev)} · กำไร {baht(p.profit)}</span></p>)}</div>
  </div>);
}
