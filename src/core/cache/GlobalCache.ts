/**
 * Shared Global Cache — cloud-backed response cache for all users.
 * Uses Supabase (PostgreSQL) or Firebase (Firestore) via REST API.
 *
 * Flow:
 * 1. Check local localStorage cache (instant, user-specific)
 * 2. Check cloud Supabase cache (fast, shared across ALL users)
 * 3. Call DeepSeek API (slow, costs tokens)
 * 4. Store result in BOTH local + cloud cache
 *
 * Table schema (Supabase):
 *   CREATE TABLE ai_cache (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     normalized_key TEXT UNIQUE NOT NULL,
 *     response JSONB NOT NULL,
 *     created_at TIMESTAMPTZ DEFAULT now(),
 *     hit_count INTEGER DEFAULT 1
 *   );
 *   CREATE INDEX idx_cache_key ON ai_cache(normalized_key);
 *
 * Environment variables (set in Supabase):
 *   VITE_SUPABASE_URL — project URL
 *   VITE_SUPABASE_ANON_KEY — anon key (safe for client)
 */

import type { AIStructuredTask } from "../tasks/ai-schema";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const TABLE_NAME = "ai_cache";

// ── Local cache (localStorage) ──

const LOCAL_CACHE_PREFIX = "kt_cache_";
const MAX_LOCAL_ENTRIES = 500;

function normalizeKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^а-яёa-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

function localGet(key: string): AIStructuredTask | null {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_PREFIX + key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.options) && data.options.length === 4 && typeof data.correctIndex === "number") {
      return data as AIStructuredTask;
    }
  } catch {}
  return null;
}

function localSet(key: string, task: AIStructuredTask): void {
  try {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith(LOCAL_CACHE_PREFIX));
    if (allKeys.length > MAX_LOCAL_ENTRIES) {
      allKeys.slice(0, allKeys.length - MAX_LOCAL_ENTRIES + 50)
        .forEach(k => localStorage.removeItem(k));
    }
    localStorage.setItem(LOCAL_CACHE_PREFIX + key, JSON.stringify(task));
  } catch {}
}

// ── Cloud cache (Supabase REST) ──

async function cloudGet(key: string): Promise<AIStructuredTask | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?normalized_key=eq.${encodeURIComponent(key)}&select=response&limit=1`;
    const resp = await fetch(url, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!resp.ok) return null;
    const rows = await resp.json();
    if (rows.length > 0 && rows[0].response) {
      return rows[0].response as AIStructuredTask;
    }
  } catch {}

  return null;
}

async function cloudSet(key: string, task: AIStructuredTask): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        normalized_key: key,
        response: task,
        hit_count: 1,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {}
}

// ── Public API ──

export interface CacheResult {
  task: AIStructuredTask;
  source: "local" | "cloud";
}

/**
 * Build a normalized cache key from question parameters.
 */
export function buildCacheKey(topic: string, subject: string, difficulty: number): string {
  return normalizeKey(`${subject}_${topic}_d${difficulty}`);
}

// ── Pool cache: up to 20 tasks per topic ──

const POOL_PREFIX = "kt_pool_";
const MAX_POOL_SIZE = 20;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getPool(key: string): AIStructuredTask[] {
  try {
    const raw = localStorage.getItem(POOL_PREFIX + key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as AIStructuredTask[];
  } catch {}
  return [];
}

export function addToPool(key: string, task: AIStructuredTask): void {
  const pool = getPool(key);
  // Avoid duplicates by question text
  if (pool.some(t => t.question === task.question)) return;
  pool.push(task);
  // Trim older entries if pool exceeds max
  while (pool.length > MAX_POOL_SIZE) pool.shift();
  try {
    localStorage.setItem(POOL_PREFIX + key, JSON.stringify(pool));
  } catch {}
}

/**
 * Get N random unique tasks from pool. Returns fewer if pool is smaller.
 */
export function pickFromPool(key: string, count: number): { tasks: AIStructuredTask[]; fromCache: number } {
  const pool = getPool(key);
  if (pool.length === 0) return { tasks: [], fromCache: 0 };

  const shuffled = shuffle(pool);
  const picked = shuffled.slice(0, Math.min(count, pool.length));
  return { tasks: picked, fromCache: picked.length };
}

/**
 * Check local → cloud cache. Returns cached task or null.
 */
export async function getFromCache(key: string): Promise<CacheResult | null> {
  // 1) Local (instant)
  const local = localGet(key);
  if (local) return { task: local, source: "local" };

  // 2) Cloud (fast, ~200ms)
  const cloud = await cloudGet(key);
  if (cloud) {
    // Backfill local cache
    localSet(key, cloud);
    return { task: cloud, source: "cloud" };
  }

  return null;
}

/**
 * Store a response in both local and cloud caches.
 */
export async function storeInCache(key: string, task: AIStructuredTask): Promise<void> {
  localSet(key, task);
  await cloudSet(key, task);
}

/**
 * Clear local cache (called on subscription deactivation).
 */
export function clearLocalCache(): void {
  const allKeys = Object.keys(localStorage).filter(k => k.startsWith(LOCAL_CACHE_PREFIX));
  allKeys.forEach(k => localStorage.removeItem(k));
}

/**
 * Warm up cache with a local task for instant first session.
 */
export function warmupCache(skillName: string, subjectLabel: string, difficulty: number): void {
  const key = buildCacheKey(skillName, subjectLabel, difficulty);
  if (localGet(key)) return; // already cached
  // First session will fill cache naturally — no need to pre-generate
}
