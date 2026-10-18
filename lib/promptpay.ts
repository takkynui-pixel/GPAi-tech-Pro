const f=(id:string,v:string)=>id+String(v.length).padStart(2,"0")+v;
function crc(s:string){let c=0xffff;for(const ch of s){c^=ch.charCodeAt(0)<<8;for(let i=0;i<8;i++)c=c&0x8000?((c<<1)^0x1021)&0xffff:(c<<1)&0xffff;}return c.toString(16).toUpperCase().padStart(4,"0");}
export function promptpayPayload(target:string, amount:number){
  const t=target.replace(/\D/g,""); const acc=t.length>=13?f("02",t):f("01","0066"+t.slice(1));
  const body=f("00","01")+f("01","12")+f("29",f("00","A000000677010111")+acc)+f("53","764")+f("54",amount.toFixed(2))+f("58","TH");
  return body+"6304"+crc(body+"6304");
}
