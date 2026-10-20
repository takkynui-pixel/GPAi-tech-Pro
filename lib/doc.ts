export type Kind = "quote" | "invoice" | "receipt" | "cancel";
export const KIND: Record<Kind,{ tab:string; doc:string; p:string }> = {
  quote:{ tab:"เสนอราคา", doc:"ใบเสนอราคา", p:"QT" }, invoice:{ tab:"วางบิล / ใบแจ้งหนี้", doc:"ใบแจ้งหนี้", p:"INV" },
  receipt:{ tab:"ใบเสร็จรับเงิน", doc:"ใบเสร็จรับเงิน", p:"RC" }, cancel:{ tab:"ยกเลิก", doc:"ยกเลิก", p:"-" } };
export const kindOf = (j:any): Kind => j.status==="cancelled" ? "cancel" : j.payment_status==="paid" ? "receipt" : j.status==="completed" ? "invoice" : "quote";
export function docNo(j:any) { const d=new Date(j.created_at); return `${KIND[kindOf(j)].p}-${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}-${String(j.doc_seq??0).padStart(4,"0")}`; }
