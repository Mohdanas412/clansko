// lib/ratelimit.js
// Upstash Redis-backed rate limiter with graceful in-memory fallback for local dev.
// Usage:
//   import { applyRateLimit } from '@/lib/ratelimit'
//   const rateLimitResult = await applyRateLimit(request, 'login')
//   if (!rateLimitResult.success) return rateLimitResult.response  // HTTP 429

import { NextResponse } from 'next/server'

// ─── Upstash config ──────────────────────────────────────────────────────────
// Only initialised when env vars are present (i.e. staging / production).
// In local dev without UPSTASH_REDIS_REST_URL the fallback limiter is used.

let Ratelimit
let Redis

async function loadUpstash() {
  if (Ratelimit && Redis) return { Ratelimit, Redis }
  try {
    const rl = await import('@upstash/ratelimit')
    const rd = await import('@upstash/redis')
    Ratelimit = rl.Ratelimit
    Redis = rd.Redis
  } catch {
    // packages missing or load failed — fallback will handle it
  }
  return { Ratelimit, Redis }
}

// ─── Rate limit configs ───────────────────────────────────────────────────────
// Keys must match the `limiter` argument passed to applyRateLimit().
const CONFIGS = {
  // 5 req / 60 s per IP
  login: { tokens: 5, window: '60 s' },
  // 3 req / 3600 s per IP
  signup: { tokens: 3, window: '3600 s' },
  // 10 req / 60 s per user ID
  'sko-chat': { tokens: 10, window: '60 s' },
  // Daily cap: 100 req / 86400 s per user ID
  'sko-chat-daily': { tokens: 100, window: '86400 s' },
  // 5 posts / 3600 s per user ID
  'post-create': { tokens: 5, window: '3600 s' },
}

// ─── In-memory fallback ───────────────────────────────────────────────────────
// Simple sliding-window token bucket. Resets per cold start — only used locally.
const memStore = new Map()

function memRateLimit(key, tokens, windowMs) {
  const now = Date.now()
  const entry = memStore.get(key)

  if (!entry || now - entry.windowStart > windowMs) {
    memStore.set(key, { windowStart: now, count: 1 })
    return { success: true, remaining: tokens - 1, reset: now + windowMs }
  }

  if (entry.count >= tokens) {
    return { success: false, remaining: 0, reset: entry.windowStart + windowMs }
  }

  entry.count++
  return { success: true, remaining: tokens - entry.count, reset: entry.windowStart + windowMs }
}

// ─── Parse window string → ms ─────────────────────────────────────────────────
function windowToMs(window) {
  const [n, unit] = window.split(' ')
  const num = parseInt(n, 10)
  if (unit === 's') return num * 1000
  if (unit === 'm') return num * 60_000
  if (unit === 'h') return num * 3_600_000
  return num * 1000
}

// ─── Get caller identifier ────────────────────────────────────────────────────
// For auth routes we key by IP; for user-scoped routes pass an explicit userId.
function getIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

// ─── Upstash instance cache ───────────────────────────────────────────────────
let redisInstance = null
const rlCache = new Map()

function getRedis() {
  if (redisInstance) return redisInstance
  if (!Redis) return null
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redisInstance = new Redis({ url, token })
  return redisInstance
}

function getRatelimiter(limiter) {
  if (!Ratelimit) return null
  if (rlCache.has(limiter)) return rlCache.get(limiter)
  const redis = getRedis()
  if (!redis) return null
  const cfg = CONFIGS[limiter]
  if (!cfg) return null
  const instance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.tokens, cfg.window),
    analytics: false,
    prefix: `clansko:rl:${limiter}`,
  })
  rlCache.set(limiter, instance)
  return instance
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * Apply a named rate limit to an incoming Next.js request.
 *
 * @param {Request} request  - The Next.js Request object.
 * @param {string}  limiter  - One of: 'login' | 'signup' | 'sko-chat' | 'sko-chat-daily' | 'post-create'
 * @param {string}  [key]    - Override the identifier key (e.g. authenticated userId).
 *                             Defaults to the caller's IP address.
 * @returns {{ success: boolean, response?: NextResponse }}
 *   success=true  → caller is within limit, proceed normally.
 *   success=false → caller exceeded limit; return `result.response` immediately.
 */
export async function applyRateLimit(request, limiter, key) {
  const cfg = CONFIGS[limiter]
  if (!cfg) return { success: true } // unknown limiter — let it through

  const identifier = key ?? getIP(request)
  const rateLimitKey = `${limiter}:${identifier}`

  // Try to load Upstash lazily (noop on repeated calls once loaded)
  await loadUpstash()

  let result

  try {
    const rl = getRatelimiter(limiter)

    if (rl) {
      // Upstash path
      result = await rl.limit(rateLimitKey)
    } else {
      // In-memory fallback
      result = memRateLimit(rateLimitKey, cfg.tokens, windowToMs(cfg.window))
    }
  } catch (err) {
    // If Upstash is unreachable, fail open — don't block legitimate traffic
    console.error(`[ratelimit] Upstash error for "${limiter}":`, err?.message)
    return { success: true }
  }

  if (!result.success) {
    const resetSec = Math.ceil((result.reset - Date.now()) / 1000)
    const response = NextResponse.json(
      { error: 'Too many requests. Please slow down and try again.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(resetSec, 1)),
          'X-RateLimit-Limit': String(cfg.tokens),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
        },
      }
    )
    return { success: false, response }
  }

  return { success: true }
}
