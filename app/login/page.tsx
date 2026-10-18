"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
export default function Login() {
  const db = supabase(); const [email,setE]=useState(""); const [pw,setP]=useState(""); const [shop,setShop]=useState(""); const [reg,setReg]=useState(false); const [err,setErr]=useState("");
  async function go() {
    setErr("");
    if (reg) { const {error}=await db.auth.signUp({email,password:pw}); if(error) return setErr(error.message);
      const {error:e2}=await db.rpc("create_shop",{p_shop_name:shop,p_slug:shop.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+Math.random().toString(36).slice(2,6)}); if(e2) return setErr(e2.message); }
    else { const {error}=await db.auth.signInWithPassword({email,password:pw}); if(error) return setErr("อีเมลหรือรหัสผ่านไม่ถูกต้อง"); }
    location.href="/";
  }
  return (<main className="grid min-h-screen place-items-center bg-brand p-4"><div className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow-card">
    <Image src="/logo.png" alt="GPAi-tech" width={400} height={70} priority/>
    {reg && <input className="inp" placeholder="ชื่อร้าน / ชื่อช่าง" value={shop} onChange={e=>setShop(e.target.value)}/>}
    <input className="inp" type="email" placeholder="อีเมล" value={email} onChange={e=>setE(e.target.value)}/>
    <input className="inp" type="password" placeholder="รหัสผ่าน" value={pw} onChange={e=>setP(e.target.value)}/>
    {err && <p className="text-red-600">{err}</p>}
    <button className="btn w-full" onClick={go}>{reg?"สมัครและเริ่มใช้งาน":"เข้าสู่ระบบ"}</button>
    <button className="w-full text-brand" onClick={()=>setReg(!reg)}>{reg?"มีบัญชีแล้ว เข้าสู่ระบบ":"ยังไม่มีบัญชี สมัครร้านใหม่"}</button></div></main>);
}
