const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const key = () => process.env.GEMINI_API_KEY!;
export async function generateJson(system: string, parts: any[]) {
  const r = await fetch(`${BASE}/${process.env.GEMINI_MODEL ?? "gemini-2.5-flash"}:generateContent`, { method:"POST",
    headers:{ "Content-Type":"application/json", "x-goog-api-key": key() },
    body: JSON.stringify({ systemInstruction:{ parts:[{ text: system }] }, contents:[{ role:"user", parts }], generationConfig:{ responseMimeType:"application/json", temperature:0.2 } }) });
  if (!r.ok) throw new Error("Gemini error " + r.status);
  const j = await r.json(); return JSON.parse(j.candidates[0].content.parts[0].text);
}
export async function embed(text: string): Promise<number[]> {
  const r = await fetch(`${BASE}/gemini-embedding-001:embedContent`, { method:"POST", headers:{ "Content-Type":"application/json", "x-goog-api-key": key() },
    body: JSON.stringify({ content:{ parts:[{ text }] }, outputDimensionality: 768 }) });
  if (!r.ok) throw new Error("Embedding error " + r.status);
  return (await r.json()).embedding.values;
}
