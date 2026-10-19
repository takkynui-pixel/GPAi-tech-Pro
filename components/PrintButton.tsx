"use client";
export default function PrintButton() {
  return <button className="btn w-full print:hidden" onClick={()=>window.print()}>พิมพ์ / บันทึกเป็น PDF</button>;
}
