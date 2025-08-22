import { createHash } from "crypto";

// If you use Vercel KV (recommended on Vercel)
let kv: undefined | {
  get: <T = unknown>(k: string) => Promise<T | null>;
  set: (k: string, v: unknown, opts?: { ex?: number }) => Promise<unknown>;
  incr: (k: string) => Promise<number>;
  expire: (k: string, seconds: number) => Promise<unknown>;
};
try {
  // Lazy import to avoid bundling when not installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  kv = require("@vercel/kv");
} catch { /* no-op (dev fallback below) */ }

// In-memory fallback for local dev
const mem = new Map<string, number>();

function hash(input: string) {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

export function getClientIP(headers: Headers, getClientAddress?: () => string) {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  if (getClientAddress) {
    try { return getClientAddress(); } catch { /* ignore */ }
  }
  return "unknown";
}

/**
 * Builds a *privacy-preserving* key based on IP (and optionally UA).
 * If you want to reduce NAT collisions, set includeUA=true.
 */
export function clientKeyFrom(headers: Headers, getClientAddress?: () => string, includeUA = false) {
  const ip = getClientIP(headers, getClientAddress);
  const ua = includeUA ? (headers.get("user-agent") || "") : "";
  return hash(`${ip}|${ua}`);
}

const LIMIT = Number(process.env.IP_GEN_LIMIT ?? 5);
const TTL_DAYS = Number(process.env.IP_QUOTA_TTL_DAYS ?? 30);
const TTL_SECONDS = Math.max(1, Math.floor(TTL_DAYS * 86400));

function k(counter: string, clientKey: string) {
  // Namespaced so you can add other counters later
  return `quota:${counter}:${clientKey}`;
}

/** Read current usage (no side effects). */
export async function getUsage(counter: "generate", clientKey: string) {
  const key = k(counter, clientKey);
  if (kv?.get) {
    const v = await kv.get<number>(key);
    return v ?? 0;
  }
  return mem.get(key) ?? 0;
}

/**
 * Consume ONE credit (increments). If this is the first time,
 * set an expiration (rolling window).
 * Returns the new 'used' count AFTER increment.
 */
export async function consume(counter: "generate", clientKey: string) {
  const key = k(counter, clientKey);
  if (kv?.incr) {
    const used = await kv.incr(key);
    if (used === 1) {
      // set initial TTL on first use
      await kv.expire(key, TTL_SECONDS);
    }
    return used;
  }
  const used = (mem.get(key) ?? 0) + 1;
  mem.set(key, used);
  return used;
}

/** Convenience: are we allowed to generate right now? (no side effects) */
export async function canGenerate(clientKey: string, limit = LIMIT) {
  const used = await getUsage("generate", clientKey);
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, used, remaining, limit };
}

