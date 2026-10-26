"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { KIND, Kind, kindOf, docNo } from "@/lib/doc";
const CATS:Record<string,string>={electric:"ไฟฟ้า",air:"แอร์",mobile:"มือถือ",computer:"คอมพิวเตอร์"};
const MON=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const f=(n:number)=>Math.round(n).toLocaleString("th-TH");
const dayKey=(d:Date)=>`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function LineChart({ pts }: { pts:{ l:string; v:number; n:number }[] }) {
  const W=600,H=170,pad=8; const ref=useRef<HTMLDivElement>(null); const [h,setH]=useState<number|null>(null);
  const max=Math.max(1,...pts.map(p=>p.v)); const x=(i:number)=>pts.length<2?W/2:pad+i*(W-2*pad)/(pts.length-1); const y=(v:number)=>H-pad-(v/max)*(H-2*pad-12);
  let d=""; pts.forEach((p,i)=>{ if(!i) d=`M${x(0)},${y(p.v)}`; else { const m=(x(i-1)+x(i))/2; d+=` C${m},${y(pts[i-1].v)} ${m},${y(p.v)} ${x(i)},${y(p.v)}`; } });
  const move=(e:React.PointerEvent)=>{ const r=ref.current!.getBoundingClientRect(); setH(Math.max(0,Math.min(pts.length-1,Math.round(((e.clientX-r.left)/r.width)*(pts.length-1))))); };
  const hp=h!==null?pts[h]:null; const left=h!==null?Math.max(18,Math.min(82,x(h)/W*100)):0;
  return (<div ref={ref} className="relative touch-pan-y select-none" onPointerMove={move} onPointerDown={move} onPointerLeave={()=>setH(null)}>
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-44 w-full" role="img" aria-label={`กราฟยอดขาย ${pts.length} วัน ยอดสูงสุด ${f(max)} บาท`}>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F5BEA" stopOpacity=".25"/><stop offset="1" stopColor="#2F5BEA" stopOpacity="0"/></linearGradient></defs>
      {pts.length>1 && <><path d={`${d} L${x(pts.length-1)},${H} L${x(0)},${H} Z`} fill="url(#lg)"/><path d={d} fill="none" stroke="#2F5BEA" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/></>}</svg>
    {hp && h!==null && <><div className="pointer-events-none absolute inset-y-0 w-px bg-brand-light" style={{left:`${x(h)/W*100}%`}}/>
      <div className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand shadow" style={{left:`${x(h)/W*100}%`,top:`${y(hp.v)/H*100}%`}}/>
      <div className="pointer-events-none absolute -top-1 -translate-x-1/2 rounded-xl bg-navy px-3 py-2 text-xs text-white shadow-card" style={{left:`${left}%`}}><p>{hp.l}</p><p className="font-semibold">{f(hp.v)} บาท · {hp.n} งาน</p></div></>}
    <div className="mt-1 flex justify-between text-xs text-muted"><span>{pts[0]?.l}</span><span>{pts[pts.length-1]?.l}</span></div></div>);
}
function BarChart({ bars }: { bars:{ l:string; v:number; n:number; cur:boolean }[] }) {
  const [sel,setSel]=useState<number|null>(null); const max=Math.max(1,...bars.map(b=>b.v)); const avg=bars.reduce((a,b)=>a+b.v,0)/Math.max(1,bars.length);
  return (<div className="relative"><div className="relative flex h-44 items-end gap-2">
    <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-brand" style={{bottom:`${avg/max*100}%`}}><span className="absolute -top-5 left-0 text-xs text-brand">เฉลี่ย {f(avg)}</span></div>
    {bars.map((b,i)=><button key={i} aria-label={`${b.l} ${f(b.v)} บาท ${b.n} งาน`} className="group relative flex h-full flex-1 items-end focus-visible:outline-none"
      onMouseEnter={()=>setSel(i)} onMouseLeave={()=>setSel(null)} onFocus={()=>setSel(i)} onBlur={()=>setSel(null)} onClick={()=>setSel(sel===i?null:i)}>
      <span className={`block w-full rounded-t-2xl transition-all ${b.cur?"bg-gradient-to-t from-brand to-brand-light":"bg-brand-ice group-hover:bg-brand-light/60 group-focus-visible:ring-2 group-focus-visible:ring-brand-light"}`} style={{height:`${Math.max(4,b.v/max*100)}%`}}/>
      {sel===i && <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl bg-navy px-3 py-2 text-xs text-white shadow-card">{b.l} · {f(b.v)} บาท · {b.n} งาน</span>}</button>)}</div>
    <div className="mt-2 flex gap-2">{bars.map((b,i)=><span key={i} className={`flex-1 text-center text-xs ${b.cur?"font-medium text-brand":"text-muted"}`}>{b.l}</span>)}</div></div>);
}
export default function Dashboard() {
  const db=supabase(); const [jobs,setJobs]=useState<any[]>([]); const [stock,setStock]=useState<any[]>([]); const [loading,setLoading]=useState(true);
  const [days,setDays]=useState(30); const [cat,setCat]=useState<string|null>(null); const [at,setAt]=useState<Date|null>(null);
  const load=useCallback(async()=>{
    const since=new Date(); since.setMonth(since.getMonth()-5); since.setDate(1); since.setHours(0,0,0,0);
    const [j,p]=await Promise.all([
      db.from("jobs").select("id,category,total_amount,total_cost,extra_cost,status,payment_status,customer_approved_at,created_at,doc_seq,customers(name)").gte("created_at",since.toISOString()).order("created_at",{ascending:false}).limit(1000),
      db.from("products_inventory").select("id,name,stock_quantity,min_stock_alert,unit").order("stock_quantity")]);
    setJobs(j.data??[]); setStock((p.data??[]).filter((x:any)=>x.stock_quantity<=x.min_stock_alert)); setAt(new Date()); setLoading(false);
  },[]);
  useEffect(()=>{ load(); const t=setInterval(load,60000); return()=>clearInterval(t); },[load]);
  const live=useMemo(()=>jobs.filter(j=>j.status!=="cancelled"),[jobs]);
  const sel=useMemo(()=>live.filter(j=>!cat||j.category===cat),[live,cat]);
  const now=new Date(); const inMonth=(j:any)=>{const d=new Date(j.created_at);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();};
  const m=sel.filter(inMonth); const mTotal=m.reduce((a,j)=>a+Number(j.total_amount),0); const mPaid=m.filter(j=>j.payment_status==="paid").reduce((a,j)=>a+Number(j.total_amount),0);
  const mProfit=m.reduce((a,j)=>a+Number(j.total_amount)-Number(j.total_cost)-Number(j.extra_cost??0),0);
  const cancelled=jobs.filter(j=>j.status==="cancelled"&&(!cat||j.category===cat)&&inMonth(j)).length;
  const trend=useMemo(()=>{ const map:Record<string,{v:number;n:number}>={}; sel.forEach(j=>{const k=dayKey(new Date(j.created_at)); const o=(map[k]??={v:0,n:0}); o.v+=Number(j.total_amount); o.n++;});
    return Array.from({length:days},(_,i)=>{const d=new Date(); d.setDate(d.getDate()-(days-1-i)); const o=map[dayKey(d)]??{v:0,n:0}; return {l:`${d.getDate()} ${MON[d.getMonth()]}`,...o};}); },[sel,days]);
  const trendTotal=trend.reduce((a,p)=>a+p.v,0);
  const bars=useMemo(()=>Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1); const js=sel.filter(j=>{const x=new Date(j.created_at);return x.getMonth()===d.getMonth()&&x.getFullYear()===d.getFullYear();});
    return {l:MON[d.getMonth()],v:js.reduce((a,j)=>a+Number(j.total_amount),0),n:js.length,cur:i===5};}),[sel]);
  const byCat=Object.keys(CATS).map(k=>[k,live.filter(j=>j.category===k&&inMonth(j)).reduce((a,j)=>a+Number(j.total_amount),0)] as [string,number]); const cMax=Math.max(1,...byCat.map(c=>c[1]));
  const kinds=(["quote","invoice","receipt"] as Kind[]).map(k=>[k,sel.filter(j=>kindOf(j)===k).length] as [Kind,number]); const kMax=Math.max(1,...kinds.map(k=>k[1]));
  const pending=sel.filter(j=>kindOf(j)==="quote"&&!j.customer_approved_at);
  function exportCsv(){ const rows=[["เลขที่เอกสาร","วันที่","ลูกค้า","หมวด","ประเภท","ยอดรวม (บาท)","สถานะชำระ"],...sel.map(j=>[docNo(j),new Date(j.created_at).toLocaleDateString("th-TH"),j.customers?.name??"",CATS[j.category],KIND[kindOf(j)].doc,Number(j.total_amount),j.payment_status==="paid"?"ชำระแล้ว":"ยังไม่ชำระ"])];
    const csv="\ufeff"+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n"); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); a.download=`รายงานยอดขาย-${new Date().toISOString().slice(0,10)}.csv`; a.click(); }
  const pill="rounded-full bg-white px-5 py-3 text-sm shadow-card hover:bg-brand-ice focus-visible:ring-2 focus-visible:ring-brand-light";
  if(loading) return <p className="text-muted">กำลังโหลดข้อมูล...</p>;
  return (<div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2"><button className={pill} onClick={exportCsv}>⬇ ดาวน์โหลดรายงาน (CSV)</button><button className={pill} onClick={load}>↻ รีเฟรช</button>
      <span className="rounded-full bg-white px-5 py-3 text-sm shadow-card">ข้อมูล ณ {at?.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})} น.</span>
      {cat && <button className="rounded-full bg-brand px-5 py-3 text-sm text-white" onClick={()=>setCat(null)}>กรอง: {CATS[cat]} ✕</button>}</div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <section className="rounded-3xl bg-gradient-to-br from-brand to-brand-sky p-5 text-white shadow-card"><div className="flex items-start justify-between"><p className="font-medium">ยอดขายเดือนนี้</p><Link href="/jobs" className="rounded-full bg-white px-4 py-2 text-sm text-brand">ดูใบงาน</Link></div>
        <p className="mt-4 text-4xl font-semibold">{f(mTotal)} <span className="text-lg font-normal">บาท</span></p>
        <p className="mt-1 text-sm opacity-90">{m.length} งาน · กำไรเบื้องต้น {f(mProfit)} บาท</p>
        <div className="mt-4 flex h-2 gap-1" aria-hidden><span className="rounded-full bg-white" style={{flex:Math.max(mPaid,0.01)}}/><span className="rounded-full bg-rose-300" style={{flex:Math.max(mTotal-mPaid,0.01)}}/></div>
        <div className="mt-2 flex flex-wrap gap-x-4 text-sm"><span>● ชำระแล้ว {f(mPaid)}</span><span>● ค้างชำระ {f(mTotal-mPaid)}</span><span>● ยกเลิก {cancelled}</span></div></section>
      <section className="card md:col-span-2"><div className="flex items-start justify-between gap-2"><h2 className="font-medium">แนวโน้มยอดขาย</h2>
        <div className="flex gap-1" role="group" aria-label="ช่วงเวลา">{[7,30,90].map(d=><button key={d} aria-pressed={days===d} onClick={()=>setDays(d)} className={`rounded-full px-3 py-1 text-sm ${days===d?"bg-brand text-white":"bg-brand-ice text-brand"}`}>{d} วัน</button>)}</div></div>
        <p className="mt-1 text-3xl font-semibold">{f(trendTotal)} <span className="text-base font-normal text-muted">บาท ใน {days} วัน</span></p><div className="mt-3"><LineChart pts={trend}/></div></section>
      <section className="card"><h2 className="mb-3 font-medium">สถานะเอกสาร</h2><div className="space-y-4">{kinds.map(([k,n])=><Link href="/jobs" key={k} className="block rounded-2xl hover:bg-brand-bg"><div className="flex justify-between"><span className="font-medium">{KIND[k].tab}</span><span className="font-semibold">{n}</span></div>
        <div className="mt-1 h-2 rounded-full bg-brand-ice"><div className="h-2 rounded-full bg-brand" style={{width:`${n/kMax*100}%`}}/></div></Link>)}</div></section>
      <section className="card md:col-span-2"><div className="flex items-baseline justify-between"><h2 className="font-medium">ยอดขายรายเดือน</h2><span className="text-sm text-muted">ย้อนหลัง 6 เดือน</span></div><div className="mt-6"><BarChart bars={bars}/></div></section>
      <section className="card"><h2 className="mb-1 font-medium">ยอดขายตามหมวดช่าง</h2><p className="mb-3 text-xs text-muted">เดือนนี้ · กดเพื่อกรองทั้งหน้า</p><div className="space-y-3">{byCat.map(([k,v])=>
        <button key={k} aria-pressed={cat===k} onClick={()=>setCat(cat===k?null:k)} className={`block w-full rounded-2xl p-2 text-left focus-visible:ring-2 focus-visible:ring-brand-light ${cat===k?"bg-brand-ice":"hover:bg-brand-bg"}`}>
          <div className="flex justify-between text-sm"><span className="font-medium">{CATS[k]}</span><span>{f(v)}</span></div><div className="mt-1 h-2 rounded-full bg-brand-ice"><div className="h-2 rounded-full bg-brand" style={{width:`${v/cMax*100}%`}}/></div></button>)}</div></section>
      <section className="card"><div className="flex items-center justify-between"><h2 className="font-medium">ใบเสนอราคารออนุมัติ</h2><Link href="/jobs" className="rounded-full border border-brand-light px-3 py-1 text-sm text-brand">ดูทั้งหมด</Link></div>
        <p className="mt-2 text-4xl font-semibold">{pending.length} <span className="text-sm font-normal text-muted">รอลูกค้าอนุมัติ</span></p>
        <div className="mt-3 space-y-2">{pending.slice(0,3).map(j=><Link key={j.id} href={`/jobs/${j.id}/edit`} className="flex justify-between rounded-2xl bg-brand-bg px-3 py-2 text-sm hover:bg-brand-ice"><span className="truncate">{j.customers?.name} · {docNo(j)}</span><span className="shrink-0 font-medium">{f(Number(j.total_amount))}</span></Link>)}
          {pending.length===0 && <p className="text-sm text-muted">ไม่มีใบเสนอราคาที่รอดำเนินการ</p>}</div></section>
      <section className="card md:col-span-2 lg:col-span-4"><div className="flex items-center justify-between"><h2 className="font-medium">อะไหล่ใกล้หมด</h2><Link href="/inventory" className="rounded-full border border-brand-light px-3 py-1 text-sm text-brand">ดูรายละเอียด</Link></div>
        {stock.length===0 ? <p className="mt-3 text-sm text-muted">สต๊อกปกติทุกรายการ</p> : <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">{stock.slice(0,9).map(p=><Link href="/inventory" key={p.id} className="flex items-center justify-between rounded-2xl bg-brand-bg px-4 py-3 hover:bg-brand-ice">
          <span className="min-w-0"><span className="block truncate font-medium">{p.name}</span><span className="text-xs text-muted">จุดเตือน {p.min_stock_alert}</span></span>
          <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600">{p.stock_quantity} {p.unit}</span></Link>)}</div>}</section>
    </div></div>);
}
