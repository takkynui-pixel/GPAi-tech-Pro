"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import Stepper from "@/components/Stepper";
const CATS:Record<string,string>={electric:"ช่างไฟฟ้า",air:"ช่างแอร์",mobile:"ซ่อมมือถือ",computer:"ซ่อมคอมพิวเตอร์"};
const INFO:Record<string,string[]>={electric:["จำนวนจุด","โหมดคิดราคา (เหมา/ตามจุด)"],air:["ยี่ห้อ","BTU","ชนิดน้ำยา (R32/R410A)"],mobile:["รุ่น","IMEI/Serial","สภาพเครื่องก่อนรับ"],computer:["สเปกเครื่อง","สำรองข้อมูลแล้ว (ใช่/ไม่)"]};
type Item={product_id:string|null;item_name:string;quantity:number;unit_price:number;unit_cost:number};
export default function JobForm({ jobId }: { jobId?: string }) {
  const db=supabase(); const edit=!!jobId;
  const [cat,setCat]=useState("electric"); const [cust,setCust]=useState({name:"",phone:"",address:""}); const [info,setInfo]=useState<Record<string,string>>({});
  const [items,setItems]=useState<Item[]>([]); const [stock,setStock]=useState<any[]>([]); const [warranty,setWarranty]=useState(30); const [extra,setExtra]=useState(0);
  const [discount,setDiscount]=useState(0); const [vatOn,setVatOn]=useState(false); const [msg,setMsg]=useState(""); const [saved,setSaved]=useState<{id:string;token:string}|null>(null);
  const [blocked,setBlocked]=useState(""); const [loading,setLoading]=useState(edit); const [busy,setBusy]=useState(false); const [toast,setToast]=useState("");
  useEffect(()=>{db.from("products_inventory").select("*").eq("category",cat).then(({data})=>setStock(data??[]));},[cat]);
  useEffect(()=>{db.from("tenants").select("vat_enabled").single().then(({data})=>setVatOn(!!data?.vat_enabled));},[]);
  useEffect(()=>{ if(edit) return; const d=sessionStorage.getItem("ai_draft"); if(d){const v=JSON.parse(d); setCat(v.category); setItems(v.items); sessionStorage.removeItem("ai_draft");} },[]);
  useEffect(()=>{ if(!jobId) return; (async()=>{
    const {data,error}=await db.from("jobs").select("*, customers(*), job_items(*)").eq("id",jobId).single();
    if(error||!data) setBlocked("ไม่พบใบงานนี้");
    else if(data.customer_approved_at) setBlocked("ลูกค้าอนุมัติใบเสนอราคานี้แล้ว จึงแก้ไขไม่ได้");
    else if(data.status==="completed"||data.status==="cancelled"||data.payment_status==="paid") setBlocked("ใบงานนี้ปิดแล้ว แก้ไขไม่ได้");
    else { setCat(data.category); setInfo(data.device_or_site_info??{}); setWarranty(data.warranty_days??0); setExtra(Number(data.extra_cost??0)); setDiscount(Number(data.discount??0));
      setCust({name:data.customers?.name??"",phone:data.customers?.phone??"",address:data.customers?.address??""});
      setItems((data.job_items??[]).map((i:any)=>({product_id:i.product_id,item_name:i.item_name,quantity:i.quantity,unit_price:Number(i.unit_price),unit_cost:Number(i.unit_cost??0)}))); }
    setLoading(false); })(); },[jobId]);
  const sub=items.reduce((a,i)=>a+i.quantity*i.unit_price,0); const base=Math.max(0,sub-discount); const vat=vatOn?Math.round(base*7)/100:0; const total=base+vat;
  const cost=items.reduce((a,i)=>a+i.quantity*i.unit_cost,0);
  const upd=(n:number,p:Partial<Item>)=>setItems(items.map((it,i)=>i===n?{...it,...p}:it));
  async function save(){
    setBusy(true); setMsg("กำลังบันทึก...");
    if(edit){
      const {error}=await db.rpc("update_quote",{p_job:jobId,p_data:{info,total,cost,extra,discount,vat,warranty,cust_name:cust.name,cust_phone:cust.phone,cust_address:cust.address},p_items:items});
      setBusy(false); if(error) return setMsg("แก้ไขไม่สำเร็จ: "+error.message);
      const {data}=await db.from("jobs").select("id,public_share_token").eq("id",jobId).single(); setSaved({id:data!.id,token:data!.public_share_token}); return setMsg("บันทึกการแก้ไขแล้ว");
    }
    const {data:c,error:e1}=await db.from("customers").insert(cust).select().single(); if(e1){setBusy(false);return setMsg("บันทึกลูกค้าไม่สำเร็จ: "+e1.message);}
    const {data:j,error:e2}=await db.from("jobs").insert({customer_id:c.id,category:cat,device_or_site_info:info,total_amount:total,discount,vat_amount:vat,total_cost:cost,extra_cost:extra,warranty_days:warranty,status:"pending"}).select().single();
    if(e2){setBusy(false);return setMsg("บันทึกใบงานไม่สำเร็จ: "+e2.message);}
    if(items.length) await db.from("job_items").insert(items.map(i=>({...i,job_id:j.id})));
    setBusy(false); setSaved({id:j.id,token:j.public_share_token}); setMsg("บันทึกแล้ว");
  }
  async function sendLine(){
    if(!saved) return; const link=`${location.origin}/track/${saved.token}`;
    try{ const r=await fetch("/api/line/send-job",{method:"POST",body:JSON.stringify({job_id:saved.id})}); const d=await r.json();
      if(d.sent) setToast("ส่งให้ลูกค้าทาง LINE แล้ว");
      else if(d.reason==="no_line"){ try{await navigator.clipboard.writeText(link);}catch{} setToast("ลูกค้ายังไม่ได้ผูก LINE คัดลอกลิงก์ให้แล้ว วางส่งในแชทได้เลย"); }
      else setToast("ส่งไม่สำเร็จ: "+(d.detail??d.reason)); }catch{ setToast("ส่งไม่สำเร็จ ลองใหม่อีกครั้ง"); }
    setTimeout(()=>setToast(""),6000);
  }
  if(loading) return <p>กำลังโหลด...</p>;
  if(blocked) return <div className="card mx-auto max-w-lg space-y-3"><p>{blocked}</p><Link href="/jobs" className="btn block text-center">กลับไปหน้าใบงาน</Link></div>;
  return (<div className="mx-auto max-w-2xl space-y-5"><h1 className="text-2xl font-semibold">{edit?"แก้ไขใบเสนอราคา":"สร้างใบงานใหม่"}</h1>
    {edit && <p className="rounded-2xl bg-brand-ice p-3 text-sm text-brand">แก้ไขได้จนกว่าลูกค้าจะกดอนุมัติ ลูกค้าจะเห็นเป็นฉบับแก้ไขล่าสุดในลิงก์เดิม</p>}
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{Object.entries(CATS).map(([k,v])=>
      <button key={k} disabled={edit&&cat!==k} onClick={()=>{setCat(k);setInfo({});setItems([]);}} className={`rounded-2xl px-3 py-4 font-medium disabled:opacity-40 ${cat===k?"bg-brand text-white":"bg-white text-brand shadow-card"}`}>{v}</button>)}</div>
    <div className="card grid gap-3"><h2 className="font-medium">ลูกค้า</h2>
      <input className="inp" placeholder="ชื่อลูกค้า" value={cust.name} onChange={e=>setCust({...cust,name:e.target.value})}/>
      <input className="inp" inputMode="tel" placeholder="เบอร์โทร" value={cust.phone} onChange={e=>setCust({...cust,phone:e.target.value})}/>
      <input className="inp" placeholder="ที่อยู่ลูกค้า (แสดงในใบเสนอราคา)" value={cust.address} onChange={e=>setCust({...cust,address:e.target.value})}/></div>
    <div className="card grid gap-3"><h2 className="font-medium">ข้อมูลเฉพาะ{CATS[cat]}</h2>
      {INFO[cat].map(k=><input key={k} className="inp" placeholder={k} value={info[k]??""} onChange={e=>setInfo({...info,[k]:e.target.value})}/>)}</div>
    <div className="card space-y-3"><h2 className="font-medium">รายการงาน / อะไหล่</h2>
      {items.map((it,n)=><div key={n} className="grid grid-cols-2 gap-2 rounded-2xl bg-brand-bg p-3">
        <input className="inp col-span-2" value={it.item_name} onChange={e=>upd(n,{item_name:e.target.value})}/>
        <div className="min-w-0"><p className="text-xs text-muted">จำนวน</p><Stepper value={it.quantity} min={1} onChange={v=>upd(n,{quantity:v})}/></div>
        <div className="min-w-0"><p className="text-xs text-muted">ราคา/หน่วย (บาท)</p><input type="number" inputMode="decimal" className="inp mt-1" value={it.unit_price} onChange={e=>upd(n,{unit_price:+e.target.value})}/></div>
        <button className="col-span-2 text-sm text-red-600" onClick={()=>setItems(items.filter((_,i)=>i!==n))}>ลบรายการนี้</button></div>)}
      <div className="flex flex-wrap gap-2">
        <select className="inp !w-auto" value="" onChange={e=>{const p=stock.find(s=>s.id===e.target.value); if(p) setItems([...items,{product_id:p.id,item_name:p.name,quantity:1,unit_price:Number(p.selling_price),unit_cost:Number(p.cost_price)}]);}}>
          <option value="">+ เลือกจากสต๊อก</option>{stock.map(s=><option key={s.id} value={s.id}>{s.name} (เหลือ {s.stock_quantity})</option>)}</select>
        <button className="btn !bg-brand-ice !text-brand" onClick={()=>setItems([...items,{product_id:null,item_name:"ค่าแรง",quantity:1,unit_price:0,unit_cost:0}])}>+ ค่าแรง/รายการอื่น</button></div>
      <label className="block text-sm">รับประกัน (วัน)<select className="inp mt-1" value={warranty} onChange={e=>setWarranty(+e.target.value)}>{[0,7,30,90].map(d=><option key={d} value={d}>{d?d+" วัน":"ไม่มี"}</option>)}</select></label>
      <div className="text-sm">ค่าแรง/ค่าเดินทางที่เป็นต้นทุนร้าน (บาท)<Stepper value={extra} step={50} onChange={setExtra}/></div>
      <div className="text-sm">ส่วนลด (บาท)<Stepper value={discount} step={10} onChange={setDiscount}/></div>
      <div className="space-y-1 text-right"><p className="text-muted">ราคารวม {sub.toLocaleString()} · ส่วนลด {discount.toLocaleString()}{vatOn?` · VAT 7% ${vat.toLocaleString()}`:""}</p><p className="text-2xl font-semibold">รวมทั้งหมด {total.toLocaleString()} บาท</p></div></div>
    <button className="btn w-full text-lg" onClick={save} disabled={busy||!cust.name||!items.length}>{edit?"บันทึกการแก้ไข":"บันทึกและสร้างลิงก์ให้ลูกค้า"}</button>
    {msg && <p className="text-muted" role="status">{msg}</p>}
    {saved && <div className="card space-y-2 break-all"><p className="font-medium">ลิงก์สำหรับลูกค้า</p><a className="text-brand-sky underline" href={`/track/${saved.token}`} target="_blank" rel="noreferrer">{typeof window!=="undefined"?location.origin:""}/track/{saved.token}</a>
      <button className="btn w-full" onClick={sendLine}>{edit?"ส่งใบเสนอราคาฉบับแก้ไขทาง LINE":"ส่งใบเสนอราคาทาง LINE"}</button><Link href="/jobs" className="btn !bg-brand-ice !text-brand block text-center">กลับไปหน้าใบงาน</Link></div>}
    {toast && <p role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-navy p-4 text-center text-white shadow-card">{toast}</p>}
  </div>);
}
