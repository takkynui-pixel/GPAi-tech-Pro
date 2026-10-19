import "./globals.css";
import { Noto_Sans_Thai } from "next/font/google";
const font = Noto_Sans_Thai({ subsets:["thai","latin"], variable:"--font-sans" });
export const metadata = { title:"GPAi-tech | ระบบผู้ช่วยช่าง", icons:{ apple:"/icon-192.png" }, appleWebApp:{ capable:true, title:"GPAi-tech" } };
export const viewport = { themeColor:"#2F5BEA", width:"device-width", initialScale:1 };
export default function Root({ children }:{children:React.ReactNode}) {
  return <html lang="th" className={font.variable}><body>{children}</body></html>;
}
