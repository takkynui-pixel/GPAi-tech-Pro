"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
const CATS:Record<string,string>={electric:"ช่างไฟฟ้า",air:"ช่างแอร์",mobile:"ซ่อมมือถือ",computer:"ซ่อมคอมพิวเตอร์"};
async function shrink(file:File):Promise<string>{ const bmp=await createImageBitmap(file); const k=Math.min(1,1280/Math.max(bmp.width,bmp.height));
  const c=document.createElement("canvas"); c.width=bmp.width*k; c.height=bmp.height*k; c.getContext("2d")!.drawImage(bmp,0,0,c.width,c.height); return c.toDataURL("image/jpeg",0.8).split(",")[1]; }
export default function AI() {
  const router=useRouter(); const rec=useRef<any>(null); const [listening,setListening]=useState(false);
  const [say,setSay]=useState(""); const [busy,setBusy]=useState(""); const [err,setErr]=useState("");
  const [cat,setCat]=useState("electric"); const [symptom,setSymptom]=useState(""); const [img,setImg]=useState(""); const [res,setRes]=useState<any>(null); const [idx,setIdx]=useState("");
  const SR=typeof window!=="undefined"?((window as any).SpeechRecognition??(window as any).webkitSpeechRecognition):null;
  function mic(){ if(listening){rec.current?.stop();return;} const r=new SR(); r.lang="th-TH"; r.interimResults=false;
    r.onresult=(e:any)=>setSay(s=>(s+" "+e.results[0][0].transcript).trim()); r.onend=()=>setListening(false); rec.current=r; r.start(); setListening(true); }
  async function post(url:string,body:object){ setErr(""); const r=await fetch(url,{method:"POST",body:JSON.stringify(body)}); const j=await r.json(); if(!r.ok) throw new Error(j.error??"เกิดข้อผิดพลาด"); return j; }
  async function quote(){ setBusy("quote"); try{ const j=await post("/api/ai/voice-quote",{text:say}); sessionStorage.setItem("ai_draft",JSON.stringify(j)); router.push("/jobs/new"); }catch(e:any){setErr(e.message);} setBusy(""); }
  async function diagnose(){ setBusy("diag"); try{ setRes(await post("/api/ai/diagnose",{symptom,category:cat,image:img||undefined})); }catch(e:any){setErr(e.message);} setBusy(""); }
  async function reindex(){ setBusy("idx"); try{ await post("/api/ai/reindex",{}); setIdx("อัปเดตแล้ว AI Search จะเห็นข้อมูลร้านล่าสุด"); }catch(e:any){setErr(e.message);} setBusy(""); }
  const L=({t,a}:{t:string;a:string[]})=>a?.length?<div><p className="font-medium">{t}</p><ul className="list-disc pl-5">{a.map((x,i)=><li key={i}>{x}</li>)}</ul></div>:null;
  return (<div className="mx-auto max-w-2xl space-y-5"><h1 className="text-2xl font-semibold">ผู้ช่วย AI</h1>
    {err && <p className="rounded-xl bg-red-50 p-3 text-red-700">{err}</p>}
    <section className="card space-y-3"><h2 className="font-medium">พูดเพื่อสร้างใบเสนอราคา</h2>
      <textarea className="inp" rows={3} placeholder="เช่น ล้างแอร์ติดผนัง 12000 BTU 2 เครื่อง เปลี่ยนแคป 1 ตัว" value={say} onChange={e=>setSay(e.target.value)}/>
      <div className="flex gap-2">{SR && <button className={`btn ${listening?"!bg-red-600":""}`} onClick={mic}>{listening?"หยุดฟัง":"กดพูด"}</button>}
        <button className="btn flex-1" disabled={!say||busy==="quote"} onClick={quote}>{busy==="quote"?"กำลังสร้าง...":"สร้างรายการใบเสนอราคา"}</button></div>
      {!SR && <p className="text-sm text-brand">เบราว์เซอร์นี้ไม่รองรับการพูด พิมพ์ข้อความแทนได้</p>}</section>
    <section className="card space-y-3"><h2 className="font-medium">วิเคราะห์อาการเสีย</h2>
      <select className="inp" value={cat} onChange={e=>setCat(e.target.value)}>{Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
      <textarea className="inp" rows={3} placeholder="อาการ หรือรหัส Error เช่น แอร์ขึ้น E1 ไม่เย็น" value={symptom} onChange={e=>setSymptom(e.target.value)}/>
      <input type="file" accept="image/*" capture="environment" className="inp" onChange={async e=>{const f=e.target.files?.[0]; setImg(f?await shrink(f):"");}}/>
      <button className="btn w-full" disabled={(!symptom&&!img)||busy==="diag"} onClick={diagnose}>{busy==="diag"?"กำลังวิเคราะห์...":"วิเคราะห์"}</button>
      {res && <div className="space-y-3 rounded-xl bg-brand-bg p-4"><p className="text-sm text-brand">ความมั่นใจ: {res.confidence}</p>
        <L t="สาเหตุที่เป็นไปได้" a={res.likely_causes}/><L t="ขั้นตอนตรวจเช็ค" a={res.checks}/><L t="อะไหล่ที่ควรเตรียม" a={res.suggested_parts}/><L t="เครื่องมือ" a={res.tools}/>
        {res.est_minutes>0 && <p>เวลาโดยประมาณ {res.est_minutes} นาที</p>}{res.safety_note && <p className="font-medium text-red-700">{res.safety_note}</p>}
        <p className="text-xs text-brand">ผลจาก AI เป็นข้อมูลประกอบ ช่างต้องตรวจยืนยันหน้างานก่อนเสนอราคา</p></div>}</section>
    <section className="card space-y-2"><h2 className="font-medium">ให้ AI Search ค้นเจอร้านคุณ</h2><p className="text-sm text-brand">อัปเดตข้อมูลร้านและงานที่ทำบ่อยให้ระบบค้นหาตามความหมาย</p>
      <button className="btn" disabled={busy==="idx"} onClick={reindex}>อัปเดตข้อมูลร้านสำหรับ AI Search</button>{idx && <p className="text-brand">{idx}</p>}</section>
  </div>);
}
