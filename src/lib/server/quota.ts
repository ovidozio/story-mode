// src/lib/server/quota.ts
import { createHash } from 'node:crypto';

const IP_GEN_LIMIT = Number(process.env.IP_GEN_LIMIT ?? 5);
const IP_TTL_DAYS = Number(process.env.IP_QUOTA_TTL_DAYS ?? 30);
const TTL_SECONDS = Math.max(1, Math.floor(IP_TTL_DAYS * 86400));

type RedisLike = {
  get: <T = unknown>(k: string) => Promise<T | null>;
  set: (k: string, v: unknown, opts?: { ex?: number }) => Promise<'OK' | null>;
  incr: (k: string) => Promise<number>;
  expire: (k: string, seconds: number) => Promise<number>;
  del: (k: string) => Promise<number>;
};

let _io: any | null = null;
async function getRedis(): Promise<RedisLike | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!_io) {
    const IORedis = (await import('ioredis')).default;
    _io = new IORedis(url, { lazyConnect: true, maxRetriesPerRequest: 2, enableOfflineQueue: false });
    try { await _io.connect?.(); } catch {}
  }
  const io = _io as import('ioredis').Redis;
  const wrap: RedisLike = {
    async get<T>(k) {
      const v = await io.get(k);
      if (v == null) return null;
      try { return JSON.parse(v) as T; } catch { return v as unknown as T; }
    },
    async set(k, v, opts) {
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      if (opts?.ex) { await io.set(k, s, 'EX', opts.ex); } else { await io.set(k, s); }
      return 'OK';
    },
    async incr(k) { return await io.incr(k); },
    async expire(k, seconds) { return await io.expire(k, seconds); },
    async del(k) { return await io.del(k); }
  };
  return wrap;
}

const mem = new Map<string, { v: number; exp: number }>();
function memGet(k: string): number {
  const now = Date.now();
  const cur = mem.get(k);
  if (!cur || cur.exp < now) return 0;
  return cur.v;
}
function memSet(k: string, v: number, ttlSec: number) { mem.set(k, { v, exp: Date.now() + ttlSec * 1000 }); }
function memIncr(k: string, ttlSec: number): number {
  const cur = memGet(k) ?? 0;
  const next = (cur || 0) + 1;
  memSet(k, next, ttlSec);
  return next;
}
function memDel(k: string) { mem.delete(k); }

const usageKey = (ck: string) => `quota:used:${ck}`;
const limitKey = (ck: string) => `quota:limit:${ck}`;

function sha256(s: string) { return createHash('sha256').update(s).digest('hex').slice(0, 32); }

export function clientKeyFrom(headers: Headers, getClientAddress: () => string | null, includeUA = false) {
  const xfwd = headers.get('x-forwarded-for') || '';
  const ip = (xfwd.split(',')[0] || getClientAddress() || '0.0.0.0').trim();
  const ua = (headers.get('user-agent') || '').trim();
  const raw = includeUA ? `${ip}|${ua}` : ip;
  return sha256(raw);
}

async function readUsage(ck: string) {
  const key = usageKey(ck);
  const r = await getRedis();
  if (r) return Number((await r.get<number>(key)) ?? 0);
  return memGet(key);
}

async function writeUsage(ck: string, used: number) {
  const key = usageKey(ck);
  const r = await getRedis();
  if (r) { await r.set(key, used, { ex: TTL_SECONDS }); return; }
  memSet(key, used, TTL_SECONDS);
}

async function incrUsage(ck: string) {
  const key = usageKey(ck);
  const r = await getRedis();
  if (r) {
    const n = await r.incr(key);
    if (n === 1) await r.expire(key, TTL_SECONDS);
    return n;
  }
  return memIncr(key, TTL_SECONDS);
}

async function delUsage(ck: string) {
  const key = usageKey(ck);
  const r = await getRedis();
  if (r) { await r.del(key); return; }
  memDel(key);
}

async function readLimitOverride(ck: string): Promise<number | undefined> {
  const k = limitKey(ck);
  const r = await getRedis();
  if (r) {
    const v = await r.get<number>(k);
    return v === null ? undefined : Number(v);
  }
  return undefined;
}

async function writeLimitOverride(ck: string, limit: number | null) {
  const k = limitKey(ck);
  const r = await getRedis();
  if (!r) return;
  if (limit == null) { await r.del(k); return; }
  await r.set(k, Math.max(0, Math.floor(limit)));
}

export async function getQuota(clientKey: string) {
  const used = await readUsage(clientKey);
  const override = await readLimitOverride(clientKey);
  const limit = Number.isFinite(override as number) ? (override as number) : IP_GEN_LIMIT;
  const remaining = Math.max(0, limit - used);
  return { used, limit, remaining };
}

export async function canGenerate(clientKey: string) {
  const q = await getQuota(clientKey);
  return { allowed: q.used < q.limit, ...q };
}

export async function consume(_kind: 'generate', clientKey: string) {
  const used = await incrUsage(clientKey);
  return used;
}

export async function resetQuota(clientKey: string) { await delUsage(clientKey); }

export async function setUsage(clientKey: string, used: number) { await writeUsage(clientKey, Math.max(0, Math.floor(used))); }

export async function setLimitOverride(clientKey: string, limit: number | null) {
  if (limit !== null) limit = Math.max(0, Math.floor(limit));
  await writeLimitOverride(clientKey, limit);
}

