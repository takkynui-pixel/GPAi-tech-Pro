import type { Config } from "tailwindcss";
export default { content:["./app/**/*.tsx","./components/**/*.tsx"],
 theme:{extend:{fontFamily:{sans:["var(--font-sans)","sans-serif"]},
 colors:{navy:"#0B1536",muted:"#7B88A6",brand:{DEFAULT:"#2F5BEA",dark:"#2449C4",sky:"#4C7DFF",light:"#8FB0FF",ice:"#E8EFFD",bg:"#EEF3FD"}},
 boxShadow:{card:"0 8px 30px rgba(47,91,234,.07)"}}},plugins:[]} satisfies Config;
