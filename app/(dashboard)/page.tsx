import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";
export const dynamic = "force-dynamic";
export default async function Home() {
  const { data:{ user } } = await supabaseServer().auth.getUser();
  if (!user) redirect("/login");
  return <Dashboard />;
}
