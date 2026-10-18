"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";
export default function Login() {
  const db = supabase(); const [email,setE]=useState(""); const [pw,setP]=useState(""); const [shop,setShop]=useState(""); const [reg,setReg]=useState(false);
  const [err,setErr]=useState(""); const [info,setInfo]=useState(""); const [busy,setBusy]=useState(false);
  // สร้างร้านให้ถ้าบัญชีนี้ยังไม่มีร้าน (ใช้ได้ทั้งหลังสมัครและหลังยืนยันอีเมลแล้วล็อกอินครั้งแรก)
  async function ensureShop(name:string){
    const { data } = await db.from("tenant_users").select("id").limit(1);
    if (data?.length) return;
    const { error } = await db.rpc("create_shop",{ p_shop_name:name, p_slug:(name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"shop")+"-"+Math.random().toString(36).slice(2,6) });
    if (error) throw error;
  }
  async function go() {
    setErr(""); setInfo(""); setBusy(true);
    try {
      if (reg) {
        if (!shop.trim()) throw new Error("กรอกชื่อร้านก่อนครับ");
        await db.auth.signOut(); // ล้างเซสชันเก่าที่อาจค้างอยู่
        const { data, error } = await db.auth.signUp({ email, password:pw, options:{ data:{ shop_name: shop.trim() } } });
        if (error) throw error;
        if (!data.session) { setInfo("สมัครแล้ว กรุณายืนยันอีเมลก่อน แล้วกด \"เข้าสู่ระบบ\" (ถ้าอีเมลนี้เคยสมัครไว้ ให้เข้าสู่ระบบได้เลย)"); setReg(false); setBusy(false); return; }
        await ensureShop(shop.trim());
      } else {
        const { data, error } = await db.auth.signInWithPassword({ email, password:pw });
        if (error) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง (หรือยังไม่ได้ยืนยันอีเมล)");
        await ensureShop(data.user.user_metadata?.shop_name || email.split("@")[0]);
      }
      location.href="/";
    } catch (e:any) { setErr(e.message ?? "เกิดข้อผิดพลาด"); setBusy(false); }
  }
  return (<main className="grid min-h-screen place-items-center bg-brand-bg p-4"><div className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow-card">
    <Image src="/logo.png" alt="GPAi-tech" width={400} height={70} priority/>
    {reg && <input className="inp" placeholder="ชื่อร้าน / ชื่อช่าง" value={shop} onChange={e=>setShop(e.target.value)}/>}
    <input className="inp" type="email" placeholder="อีเมล" value={email} onChange={e=>setE(e.target.value)}/>
    <input className="inp" type="password" placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)" value={pw} onChange={e=>setP(e.target.value)}/>
    {err && <p className="text-red-600">{err}</p>}{info && <p className="text-muted">{info}</p>}
    <button className="btn w-full disabled:opacity-60" disabled={busy} onClick={go}>{busy?"กำลังดำเนินการ...":reg?"สมัครและเริ่มใช้งาน":"เข้าสู่ระบบ"}</button>
    <button className="w-full text-muted" onClick={()=>{setReg(!reg);setErr("");setInfo("");}}>{reg?"มีบัญชีแล้ว เข้าสู่ระบบ":"ยังไม่มีบัญชี สมัครร้านใหม่"}</button></div></main>);
}
