/**
 * Bearer token auth for managers - works when cookies/sessions fail (e.g. Railway + custom domains).
 * Token is sent in Authorization header, stored in localStorage.
 */
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "theoilboys-session-secret-2026";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface ManagerPayload {
  managerId: string;
  email: string;
  name: string;
  exp: number;
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Buffer {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return Buffer.from(b64, "base64");
}

export function createManagerToken(managerId: string, email: string, name: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = { managerId, email, name, exp };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(Buffer.from(payloadStr));
  const sig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest();
  const sigB64 = base64UrlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export function verifyManagerToken(token: string): ManagerPayload | null {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;
    const sig = base64UrlDecode(sigB64);
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest();
    if (!crypto.timingSafeEqual(sig, expectedSig)) return null;
    const payloadStr = base64UrlDecode(payloadB64).toString("utf8");
    const payload = JSON.parse(payloadStr) as ManagerPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
