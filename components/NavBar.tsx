"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
const nav = [["/","ภาพรวม"],["/jobs","ใบงาน"],["/jobs/new","สร้างใบงาน"],["/calendar","ปฏิทินงาน"],["/ai-assistant","ผู้ช่วย AI"],["/inventory","สต๊อกอะไหล่"],["/reports","รายงานกำไร"],["/team","ทีมช่าง"]];
type P = { isAdmin:boolean; email:string; shopName:string; roleLabel:string; lowCount:number };
const ic = "grid h-10 w-10 place-items-center rounded-full bg-[#F4F6FB] text-navy hover:bg-brand-ice focus-visible:ring-2 focus-visible:ring-brand-light";
export default function NavBar({ isAdmin, email, shopName, roleLabel, lowCount }: P) {
  const path = usePathname(); const items = isAdmin ? [...nav, ["/admin","ผู้ดูแลระบบ"]] : nav;
  const on = (h:string) => h==="/" ? path==="/" : path===h || (path.startsWith(h+"/") && !items.some(([o])=>o!==h && o.startsWith(h+"/") && path.startsWith(o)));
  const [menu,setMenu]=useState(false); const [modal,setModal]=useState<""|"pw"|"install">(""); const [pw,setPw]=useState(""); const [msg,setMsg]=useState("");
  const deferred=useRef<any>(null); const strip=useRef<HTMLElement>(null);
  useEffect(()=>{ strip.current?.querySelector('[aria-current="page"]')?.scrollIntoView({inline:"center",block:"nearest"}); },[path]);
  useEffect(()=>{ const h=(e:any)=>{e.preventDefault();deferred.current=e;}; window.addEventListener("beforeinstallprompt",h); return()=>window.removeEventListener("beforeinstallprompt",h); },[]);
  const item = "block w-full rounded-2xl px-4 py-3 text-left hover:bg-brand-bg focus-visible:ring-2 focus-visible:ring-brand-light";
  async function changePw(){ if(pw.length<6) return setMsg("รหัสผ่านอย่างน้อย 6 ตัวอักษร"); const {error}=await supabase().auth.updateUser({password:pw}); setMsg(error?error.message:"เปลี่ยนรหัสผ่านแล้ว"); if(!error) setPw(""); }
  return (<>
    <header className="sticky top-0 z-20 p-3 md:p-4"><div className="mx-auto max-w-6xl rounded-3xl bg-white p-3 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="flex min-w-0 items-center gap-2"><Image src="/logo.png" alt="GPAi-tech" width={150} height={26} priority/><span className="rounded-full bg-brand-ice px-2 py-0.5 text-xs font-semibold text-brand">Pro</span></Link>
        <div className="relative flex shrink-0 items-center gap-2">
          <Link href="/inventory" className={`${ic} relative`} aria-label={lowCount?`อะไหล่ใกล้หมด ${lowCount} รายการ`:"ไม่มีการแจ้งเตือน"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>
            {lowCount>0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">{lowCount}</span>}</Link>
          <Link href="/settings" className={ic} aria-label="ตั้งค่าร้าน"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></Link>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-brand font-semibold text-white focus-visible:ring-2 focus-visible:ring-brand-light" aria-haspopup="menu" aria-expanded={menu} aria-label="เมนูโปรไฟล์" onClick={()=>setMenu(!menu)}>{(shopName||email||"?")[0].toUpperCase()}</button>
          {menu && <><button className="fixed inset-0 z-30 cursor-default" aria-label="ปิดเมนู" onClick={()=>setMenu(false)}/>
            <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-72 max-w-[85vw] rounded-3xl bg-white p-2 shadow-[0_12px_40px_rgba(15,23,42,.18)]">
              <div className="border-b border-brand-ice px-4 py-3"><p className="font-semibold">{shopName||"บัญชีของฉัน"}</p><p className="break-all text-sm text-muted">{roleLabel} · {email}</p></div>
              <button role="menuitem" className={item} onClick={()=>{setMenu(false);setMsg("");setModal("pw");}}>เปลี่ยนรหัสผ่าน</button>
              <button role="menuitem" className={item} onClick={()=>{setMenu(false); if(deferred.current){deferred.current.prompt();deferred.current=null;} else setModal("install");}}>ติดตั้งแอปบนมือถือ</button>
              <button role="menuitem" className={`${item} text-red-600`} onClick={async()=>{await supabase().auth.signOut(); location.href="/login";}}>ออกจากระบบ</button>
            </div></>}
        </div></div>
      <nav ref={strip} aria-label="เมนูหลัก" className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(([h,t])=><Link key={h} href={h} aria-current={on(h)?"page":undefined}
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand-light ${on(h)?"bg-brand font-medium text-white shadow-sm":"bg-[#F4F6FB] text-navy hover:bg-brand-ice"}`}>{t}</Link>)}
      </nav></div></header>
    {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4" onClick={()=>setModal("")}><div role="dialog" aria-modal="true" className="card w-full max-w-sm space-y-3" onClick={e=>e.stopPropagation()}>
      {modal==="pw" ? <><h2 className="text-lg font-semibold">เปลี่ยนรหัสผ่าน</h2><input type="password" className="inp" placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)" value={pw} onChange={e=>setPw(e.target.value)}/>
        {msg && <p className="text-sm text-muted">{msg}</p>}<button className="btn w-full" onClick={changePw}>บันทึกรหัสผ่านใหม่</button></>
      : <><h2 className="text-lg font-semibold">ติดตั้งแอปบนมือถือ</h2><p><b>iPhone/iPad (Safari):</b> แตะปุ่มแชร์ แล้วเลือก "เพิ่มไปยังหน้าจอโฮม"</p><p><b>Android (Chrome):</b> แตะเมนู ⋮ แล้วเลือก "ติดตั้งแอป" หรือ "เพิ่มลงในหน้าจอหลัก"</p></>}
      <button className="w-full rounded-full bg-brand-ice py-3 text-brand" onClick={()=>setModal("")}>ปิด</button></div></div>}
  </>);
}
