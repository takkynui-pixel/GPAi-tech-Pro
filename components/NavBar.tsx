"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
const nav = [["/","ภาพรวม"],["/jobs","ใบงาน"],["/jobs/new","สร้างใบงาน"],["/calendar","ปฏิทินงาน"],["/ai-assistant","ผู้ช่วย AI"],["/inventory","สต๊อกอะไหล่"],["/reports","รายงานกำไร"],["/team","ทีมช่าง"],["/settings","ตั้งค่าร้าน"]];
export default function NavBar({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname(); const items = isAdmin ? [...nav, ["/admin","ผู้ดูแลระบบ"]] : nav;
  const on = (h: string) => (h === "/" ? path === "/" : path === h || (path.startsWith(h + "/") && !items.some(([o]) => o !== h && o.startsWith(h + "/") && path.startsWith(o))));
  return (
    <header className="sticky top-0 z-10 p-3 md:p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 rounded-3xl bg-white/95 p-2 shadow-card backdrop-blur md:flex-row md:items-center md:rounded-full md:pl-5">
        <Link href="/" className="flex shrink-0 items-center gap-2 px-2"><Image src="/logo.png" alt="GPAi-tech" width={150} height={26} priority/><span className="rounded-full bg-brand-ice px-2 py-0.5 text-xs font-semibold text-brand">Pro</span></Link>
        <nav className="flex flex-1 gap-1 overflow-x-auto md:justify-center">
          {items.map(([h,t])=><Link key={h} href={h} aria-current={on(h)?"page":undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand-light ${on(h)?"bg-brand-ice font-medium text-brand":"text-muted hover:text-navy"}`}>{t}</Link>)}
        </nav>
        <button className="shrink-0 rounded-full px-4 py-2 text-sm text-muted hover:bg-brand-ice hover:text-brand focus-visible:ring-2"
          onClick={async()=>{await supabase().auth.signOut(); location.href="/login";}}>ออกจากระบบ</button>
      </div>
    </header>);
}
