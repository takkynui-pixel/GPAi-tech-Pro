import "./globals.css";
import { Prompt } from "next/font/google";
const prompt = Prompt({ subsets:["thai","latin"], weight:["300","400","500","600","700"], variable:"--font-prompt" });
export const metadata = { title:"GPAi-tech | ระบบผู้ช่วยช่าง" };
export default function Root({ children }:{children:React.ReactNode}) {
  return <html lang="th" className={prompt.variable}><body>{children}</body></html>;
}
