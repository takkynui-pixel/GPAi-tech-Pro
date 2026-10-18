import { supabaseServer } from "@/lib/supabase/server";
import NavBar from "./NavBar";
export default async function Sidebar() {
  let isAdmin = false;
  try { const { data } = await supabaseServer().rpc("is_platform_admin"); isAdmin = data === true; } catch {}
  return <NavBar isAdmin={isAdmin} />;
}
