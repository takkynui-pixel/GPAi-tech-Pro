import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
const key = () => createHash("sha256").update(process.env.LINE_CRED_KEY ?? "").digest();
export function encrypt(text: string) { const iv = randomBytes(12); const c = createCipheriv("aes-256-gcm", key(), iv); const d = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), d].map(b => b.toString("base64")).join(":"); }
export function decrypt(s: string) { const [iv, tag, d] = s.split(":").map(x => Buffer.from(x, "base64")); const c = createDecipheriv("aes-256-gcm", key(), iv); c.setAuthTag(tag);
  return Buffer.concat([c.update(d), c.final()]).toString("utf8"); }
