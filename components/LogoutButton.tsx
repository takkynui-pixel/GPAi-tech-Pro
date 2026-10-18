"use client";
import { supabase } from "@/lib/supabase/client";
export default function LogoutButton() {
  return <button className="whitespace-nowrap rounded-xl px-4 py-3 text-left hover:bg-brand-dark focus-visible:ring-2 md:mt-auto"
    onClick={async()=>{await supabase().auth.signOut(); location.href="/login";}}>ออกจากระบบ</button>;
}
