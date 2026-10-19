"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Stepper from "@/components/Stepper";
const CATS:Record<string,string>={electric:"ช่างไฟฟ้า",air:"ช่างแอร์",mobile:"ซ่อมมือถือ",computer:"ซ่อมคอมพิวเตอร์"};
const INFO:Record<string,string[]>={electric:["จำนวนจุด","โหมดคิดราคา (เหมา/ตามจุด)"],air:["ยี่ห้อ","BTU","ชนิดน้ำยา (R32/R410A)"],mobile:["รุ่น","IMEI/Serial","สภาพเครื่องก่อนรับ"],computer:["สเปกเครื่อง","สำรองข้อมูลแล้ว (ใช่/ไม่)"]};
type Item={product_id:string|null;item_name:string;quantity:number;unit_price:number;unit_cost:number};
export default function NewJob() {
  const db=supabase(); const [cat,setCat]=useState("electric"); const [cust,setCust]=useState({name:"",phone:""});
  const [info,setInfo]=useState<Record<string,string>>({}); const [items,setItems]=useState<Item[]>([]); const [stock,setStock]=useState<any[]>([]);
  const [warranty,setWarranty]=useState(30); const [extra,setExtra]=useState(0); const [link,setLink]=useState(""); const [msg,setMsg]=useState("");
  useEffect(()=>{db.from("products_inventory").select("*").eq("category",cat).then(({data})=>setStock(data??[]));},[cat]);
  useEffect(()=>{const d=sessionStorage.getItem("ai_draft"); if(d){const v=JSON.parse(d); setCat(v.category); setItems(v.items); sessionStorage.removeItem("ai_draft");}},[]);
  const total=items.reduce((a,i)=>a+i.quantity*i.unit_price,0);
  const upd=(n:number,p:Partial<Item>)=>setItems(items.map((it,i)=>i===n?{...it,...p}:it));
  async function save(){
    setMsg("กำลังบันทึก...");
    const {data:c,error:e1}=await db.from("customers").insert(cust).select().single(); if(e1) return setMsg("บันทึกลูกค้าไม่สำเร็จ: "+e1.message);
    const {data:j,error:e2}=await db.from("jobs").insert({customer_id:c.id,category:cat,device_or_site_info:info,total_amount:total,
      total_cost:items.reduce((a,i)=>a+i.quantity*i.unit_cost,0),warranty_days:warranty,extra_cost:extra,status:"pending"}).select().single(); if(e2) return setMsg("บันทึกใบงานไม่สำเร็จ: "+e2.message);
    if(items.length) await db.from("job_items").insert(items.map(i=>({...i,job_id:j.id})));
    setLink(`${location.origin}/track/${j.public_share_token}`); setMsg("บันทึกแล้ว");
  }
  return (<div className="mx-auto max-w-2xl space-y-5"><h1 className="text-2xl font-semibold">สร้างใบงานใหม่</h1>
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{Object.entries(CATS).map(([k,v])=>
      <button key={k} onClick={()=>{setCat(k);setInfo({});setItems([]);}} className={`rounded-xl px-3 py-4 font-medium ${cat===k?"bg-brand text-white":"bg-white text-muted shadow-card"}`}>{v}</button>)}</div>
    <div className="card grid gap-3"><h2 className="font-medium">ลูกค้า</h2>
      <input className="inp" placeholder="ชื่อลูกค้า" value={cust.name} onChange={e=>setCust({...cust,name:e.target.value})}/>
      <input className="inp" inputMode="tel" placeholder="เบอร์โทร" value={cust.phone} onChange={e=>setCust({...cust,phone:e.target.value})}/></div>
    <div className="card grid gap-3"><h2 className="font-medium">ข้อมูลเฉพาะ{CATS[cat]}</h2>
      {INFO[cat].map(k=><input key={k} className="inp" placeholder={k} value={info[k]??""} onChange={e=>setInfo({...info,[k]:e.target.value})}/>)}</div>
    <div className="card space-y-3"><h2 className="font-medium">รายการงาน / อะไหล่</h2>
      {items.map((it,n)=><div key={n} className="grid grid-cols-2 gap-2 rounded-2xl bg-brand-bg p-3">
        <input className="inp col-span-2" value={it.item_name} onChange={e=>upd(n,{item_name:e.target.value})}/>
        <div className="min-w-0"><p className="text-xs text-muted">จำนวน</p><Stepper value={it.quantity} min={1} onChange={v=>upd(n,{quantity:v})}/></div>
        <div className="min-w-0"><p className="text-xs text-muted">ราคา/หน่วย (บาท)</p><input type="number" inputMode="decimal" className="inp mt-1" value={it.unit_price} onChange={e=>upd(n,{unit_price:+e.target.value})}/></div></div>)}
      <div className="flex flex-wrap gap-2">
        <select className="inp !w-auto" value="" onChange={e=>{const p=stock.find(s=>s.id===e.target.value); if(p) setItems([...items,{product_id:p.id,item_name:p.name,quantity:1,unit_price:p.selling_price,unit_cost:p.cost_price}]);}}>
          <option value="">+ เลือกจากสต๊อก</option>{stock.map(s=><option key={s.id} value={s.id}>{s.name} (เหลือ {s.stock_quantity})</option>)}</select>
        <button className="btn !bg-brand-ice !text-brand" onClick={()=>setItems([...items,{product_id:null,item_name:"ค่าแรง",quantity:1,unit_price:0,unit_cost:0}])}>+ ค่าแรง/รายการอื่น</button></div>
      <label className="block text-sm">รับประกัน (วัน)<select className="inp mt-1" value={warranty} onChange={e=>setWarranty(+e.target.value)}>{[0,7,30,90].map(d=><option key={d} value={d}>{d?d+" วัน":"ไม่มี"}</option>)}</select></label>
      <label className="block text-sm">ค่าแรง/ค่าเดินทางที่เป็นต้นทุนร้าน (บาท)<input type="number" className="inp mt-1" value={extra} onChange={e=>setExtra(+e.target.value)}/></label>
      <p className="text-right text-2xl font-semibold">รวม {total.toLocaleString()} บาท</p></div>
    <button className="btn w-full text-lg" onClick={save} disabled={!cust.name||!items.length}>บันทึกและสร้างลิงก์ให้ลูกค้า</button>
    {msg && <p className="text-muted">{msg}</p>}
    {link && <div className="card break-all"><p className="mb-2 font-medium">ลิงก์สำหรับลูกค้า</p><a className="text-brand-sky underline" href={link}>{link}</a>
      <a className="btn mt-3 block text-center" href={`https://line.me/R/share?text=${encodeURIComponent("ใบงาน/ใบเสนอราคาของคุณ "+link)}`}>ส่งเข้า LINE</a></div>}
  </div>);
}
