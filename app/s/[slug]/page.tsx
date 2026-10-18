import { supabaseServer } from "@/lib/supabase/server";
import Image from "next/image";
export const revalidate = 3600;
const C:Record<string,string>={electric:"ช่างไฟฟ้า",air:"ช่างแอร์",mobile:"ซ่อมมือถือ",computer:"ซ่อมคอมพิวเตอร์"};
export default async function Shop({ params }:{params:{slug:string}}) {
  const { data:s } = await supabaseServer().rpc("get_public_shop",{ p_slug: params.slug });
  if (!s) return <main className="p-8 text-center">ไม่พบร้านนี้</main>;
  const ld = { "@context":"https://schema.org", "@type":"LocalBusiness", name:s.shop_name, telephone:s.phone, address:s.address, image:s.logo_url,
    makesOffer:(s.categories as string[]).map(c=>({"@type":"Offer",itemOffered:{"@type":"Service",name:C[c]}})) };
  return (<main className="mx-auto max-w-md space-y-4 p-4"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
    <div className="card"><h1 className="text-2xl font-semibold">{s.shop_name}</h1><p className="text-muted">{s.address}</p>
      <p className="mt-2">งานที่ปิดผ่านระบบแล้ว {s.jobs_done} งาน</p>{s.phone && <a className="btn mt-3 block text-center" href={`tel:${s.phone}`}>โทรจองคิว</a>}</div>
    <div className="card"><h2 className="mb-2 font-medium">บริการ</h2>{(s.categories as string[]).map(c=><p key={c} className="py-1">{C[c]}</p>)}</div>
    <footer className="flex flex-col items-center gap-1 text-sm text-muted"><Image src="/logo.png" alt="GPAi-tech" width={120} height={21}/><p>Verified &amp; Powered by GPAi-tech</p></footer></main>);
}
