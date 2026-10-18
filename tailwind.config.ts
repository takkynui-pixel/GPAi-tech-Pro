import type { Config } from "tailwindcss";
export default { content:["./app/**/*.tsx","./components/**/*.tsx"],
 theme:{extend:{fontFamily:{sans:["var(--font-prompt)","sans-serif"]},
 colors:{navy:"#0A0A40",brand:{DEFAULT:"#14659F",dark:"#0F5388",sky:"#1AA7E0",light:"#4FCBF5",ice:"#C4EEFB",bg:"#F4F8FB"}},
 boxShadow:{card:"0 6px 20px rgba(20,101,159,.10)"}}},plugins:[]} satisfies Config;
