import Link from "next/link";
import Image from "next/image";
const nav = [["/","ภาพรวม"],["/jobs/new","สร้างใบงาน"],["/calendar","ปฏิทินงาน"],["/inventory","สต๊อกอะไหล่"]];
export default function Sidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-col bg-brand text-white md:min-h-screen md:w-60">
      <div className="m-4 rounded-xl bg-white p-3"><Image src="/logo.png" alt="GPAi-tech" width={400} height={70} priority/></div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
        {nav.map(([h,t])=><Link key={h} href={h} className="whitespace-nowrap rounded-xl px-4 py-3 hover:bg-brand-dark focus-visible:ring-2">{t}</Link>)}
      </nav>
    </aside>);
}
