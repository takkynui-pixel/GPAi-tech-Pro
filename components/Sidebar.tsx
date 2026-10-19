import { supabaseServer } from "@/lib/supabase/server";
import NavBar from "./NavBar";
export default async function Sidebar() {
  let p = { isAdmin:false, email:"", shopName:"", roleLabel:"เจ้าของร้าน", lowCount:0 };
  try {
    const s = supabaseServer(); const { data:{ user } } = await s.auth.getUser();
    if (user) {
      const [a, m, l] = await Promise.all([s.rpc("is_platform_admin"), s.from("tenant_users").select("name,role").eq("user_id", user.id).limit(1), s.from("low_stock").select("id")]);
      const me: any = m.data?.[0]; const isAdmin = a.data === true;
      p = { isAdmin, email: user.email ?? "", shopName: me?.name ?? "", roleLabel: isAdmin ? "ผู้ดูแลระบบ" : me?.role === "technician" ? "ช่าง" : "เจ้าของร้าน", lowCount: l.data?.length ?? 0 };
    }
  } catch {}
  return <NavBar {...p} />;
}
