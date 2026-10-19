import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name:"GPAi-tech Pro", short_name:"GPAi-tech", start_url:"/", display:"standalone", background_color:"#EEF3FD", theme_color:"#2F5BEA", lang:"th",
    icons:[{src:"/icon-192.png",sizes:"192x192",type:"image/png"},{src:"/icon-512.png",sizes:"512x512",type:"image/png"},{src:"/icon-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"}] };
}
