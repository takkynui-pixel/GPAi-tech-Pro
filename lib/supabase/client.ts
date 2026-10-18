import { createBrowserClient } from "@supabase/ssr";
// ใส่ค่า placeholder เพื่อให้ build ผ่านแม้ยังไม่ตั้ง env (ตอนใช้งานจริงต้องตั้งค่า NEXT_PUBLIC_SUPABASE_URL / ANON_KEY บน Vercel)
export const supabase = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key");
