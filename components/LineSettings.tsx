"use client";
import { useState } from "react";
export default function LineSettings({ t }: { t: any }) {
  const pro = t.plan_type !== "free"; const [secret,setS]=useState(""); const [token,setT]=useState(""); const [msg,setMsg]=useState(""); const [on,setOn]=useState(!!t.line_connected); const [busy,setB]=useState(false);
  const bot = process.env.NEXT_PUBLIC_LINE_BOT_BASIC_ID;
  const hook = `${typeof window!=="undefined"?location.origin:""}/api/line/webhook/${t.id}`;
  const copy = async (x:string) => { try { await navigator.clipboard.writeText(x); setMsg("คัดลอกแล้ว"); } catch { setMsg(x); } };
  async function call(method:"POST"|"DELETE") { setB(true); setMsg("");
    const r = await fetch("/api/line/settings",{ method, body: method==="POST"?JSON.stringify({channel_secret:secret,access_token:token}):undefined }); const d = await r.json(); setB(false);
    if(!r.ok) return setMsg(d.error??"ไม่สำเร็จ"); setOn(method==="POST"); setS(""); setT(""); setMsg(method==="POST"?"เชื่อม LINE OA ของร้านแล้ว":"ยกเลิกการเชื่อมแล้ว (กลับไปใช้บอทกลาง)"); }
  return (<section className="card space-y-3"><h2 className="font-medium">การแจ้งเตือนผ่าน LINE</h2>
    <div className="space-y-2 rounded-2xl bg-brand-bg p-3 text-sm"><p className="font-medium">บอทกลาง GPAi-tech (ทุกแพ็กเกจ)</p>
      <p>ให้ลูกค้าแอดบอทแล้วพิมพ์ <b>ร้าน {t.line_code} เบอร์โทร</b> เพื่อผูก LINE กับร้านนี้เท่านั้น</p>
      {bot && <button className="btn !bg-brand-ice !text-brand" onClick={()=>copy(`https://line.me/R/oaMessage/${bot}/?${encodeURIComponent(`ร้าน ${t.line_code} `)}`)}>คัดลอกลิงก์ให้ลูกค้า</button>}</div>
    <div className="space-y-2 rounded-2xl bg-brand-bg p-3 text-sm"><p className="font-medium">LINE OA ของร้านเอง {on&&<span className="text-brand">· เชื่อมแล้ว</span>}</p>
      {!pro ? <p className="text-muted">ใช้ได้กับแพ็กเกจ Pro ขึ้นไป ลูกค้าจะเห็นชื่อและโลโก้ร้านของคุณ</p> : <>
        <p className="text-muted">ใน LINE Developers ตั้ง Webhook URL เป็น (แล้วเปิด Use webhook)</p>
        <button className="break-all rounded-xl bg-white p-2 text-left" onClick={()=>copy(hook)}>{hook}</button>
        <input className="inp" placeholder="Channel secret" value={secret} onChange={e=>setS(e.target.value)} autoComplete="off"/>
        <input className="inp" type="password" placeholder="Channel access token (long-lived)" value={token} onChange={e=>setT(e.target.value)} autoComplete="off"/>
        <div className="flex gap-2"><button className="btn flex-1" disabled={busy||!secret||!token} onClick={()=>call("POST")}>{on?"อัปเดตการเชื่อมต่อ":"เชื่อมต่อ"}</button>
          {on && <button className="rounded-full bg-red-50 px-5 py-3 font-medium text-red-600" disabled={busy} onClick={()=>{ if(confirm("ยกเลิกการเชื่อม LINE OA ของร้าน?")) call("DELETE"); }}>ยกเลิก</button>}</div></>}</div>
    {msg && <p className="text-sm text-muted" role="status">{msg}</p>}</section>);
}
