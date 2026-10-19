"use client";
type P = { value:number; onChange:(v:number)=>void; min?:number; max?:number; step?:number; slider?:boolean };
export default function Stepper({ value, onChange, min=0, max, step=1, slider=false }: P) {
  const clamp = (n:number) => Math.min(max ?? Infinity, Math.max(min, Number.isFinite(n) ? n : min));
  const btn = "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-ice text-2xl leading-none text-brand active:bg-brand-light/60 focus-visible:ring-2 focus-visible:ring-brand-light";
  return (<div className="mt-1 space-y-2">
    <div className="flex items-center gap-2">
      <button type="button" aria-label="ลดค่า" className={btn} onClick={()=>onChange(clamp(+(value-step).toFixed(2)))}>−</button>
      <input type="number" inputMode="decimal" className="inp !px-2 text-center" value={value} min={min} max={max} step={step} onChange={e=>onChange(clamp(+e.target.value))}/>
      <button type="button" aria-label="เพิ่มค่า" className={btn} onClick={()=>onChange(clamp(+(value+step).toFixed(2)))}>+</button>
    </div>
    {slider && <input type="range" aria-label="เลื่อนเพื่อเลือกค่า" className="h-2 w-full cursor-pointer accent-brand" min={min} max={max ?? 100} step={step} value={value} onChange={e=>onChange(+e.target.value)}/>}
  </div>);
}
