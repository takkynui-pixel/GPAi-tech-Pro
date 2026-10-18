"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
export default function ApproveButton({token}:{token:string}){
  const [ok,setOk]=useState(false);
  if(ok) return <p className="rounded-xl bg-brand-ice p-3 text-center font-medium">ขอบคุณครับ ร้านได้รับการอนุมัติของท่านแล้ว</p>;
  return <button className="btn w-full text-lg" onClick={async()=>{await supabase().rpc("approve_job",{p_token:token});setOk(true)}}>อนุมัติใบเสนอราคา</button>;
}
