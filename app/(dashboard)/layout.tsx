import Sidebar from "@/components/Sidebar";
export default function L({children}:{children:React.ReactNode}) {
  return <div className="min-h-screen"><Sidebar/><main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main></div>;
}
