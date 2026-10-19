"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Stepper from "@/components/Stepper";
const CATS = {electric:"ไฟฟ้า",air:"แอร์",mobile:"มือถือ",computer:"คอมพิวเตอร์"} as const;
export default function Inventory() {
  const db = supabase(); const [rows,setRows]=useState<any[]>([]);
  const [f,setF]=useState({name:"",category:"electric",cost_price:0,selling_price:0,stock_quantity:0,min_stock_alert:2,unit:"ชิ้น"});
  const load=async()=>{const {data}=await db.from("products_inventory").select("*").order("name"); setRows(data??[]);};
  useEffect(()=>{load();},[]);
  const add=async()=>{ if(!f.name) return; await db.from("products_inventory").insert(f); setF({...f,name:""}); load(); };
  const adj=async(p:any,d:number)=>{ await db.from("products_inventory").update({stock_quantity:Math.max(0,p.stock_quantity+d)}).eq("id",p.id); load(); };
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">สต๊อกอะไหล่</h1>
    <div className="card grid gap-3 md:grid-cols-4">
      <input className="inp md:col-span-2" placeholder="ชื่ออะไหล่ เช่น จอ iPhone 13" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
      <select className="inp" value={f.category} onChange={e=>setF({...f,category:e.target.value})}>{Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
      <input className="inp" placeholder="หน่วย" value={f.unit} onChange={e=>setF({...f,unit:e.target.value})}/>
      {([["cost_price","ราคาทุน"],["selling_price","ราคาขาย"],["stock_quantity","จำนวน"],["min_stock_alert","เตือนเมื่อต่ำกว่า"]] as const).map(([k,l])=>
        <div key={k} className="min-w-0 text-sm">{l}<Stepper value={(f as any)[k]} onChange={v=>setF({...f,[k]:v})}/></div>)}
      <button className="btn md:col-span-4" onClick={add}>เพิ่มอะไหล่</button></div>
    <div className="card divide-y divide-brand-ice">
      {rows.length===0 && <p className="text-muted">ยังไม่มีอะไหล่ เพิ่มรายการแรกด้านบน</p>}
      {rows.map(p=><div key={p.id} className="flex items-center justify-between gap-3 py-3">
        <div><p className="font-medium">{p.name}</p><p className="text-sm text-muted">{CATS[p.category as keyof typeof CATS]} · ทุน {p.cost_price} · ขาย {p.selling_price}</p></div>
        <div className="flex items-center gap-2"><button className="btn !px-4" onClick={()=>adj(p,-1)} aria-label="ลด">−</button>
          <span className={`w-20 text-center font-semibold ${p.stock_quantity<=p.min_stock_alert?"text-red-600":""}`}>{p.stock_quantity} {p.unit}</span>
          <button className="btn !px-4" onClick={()=>adj(p,1)} aria-label="เพิ่ม">+</button></div></div>)}
    </div></div>);
}
