import Redis from "ioredis"

/**
 * Redis 客户端 — 惰性、可选。
 *
 * - 若配置了 REDIS_URL，则使用 Redis（生产/Docker 部署推荐）。
 * - 若未配置（如 Vercel 无 Redis 的部署），自动回退到进程内内存实现，
 *   使限流/缓存仍能工作（单实例范围内有效）。
 *
 * 注意：内存回退在多实例/Serverless 冷启动下不共享状态，仅作降级方案。
 */

let redisClient: Redis | null = null
let triedInit = false

function getRedis(): Redis | null {
  if (triedInit) return redisClient
  triedInit = true

  const url = process.env.REDIS_URL
  if (!url) {
    console.warn(
      "⚠️  REDIS_URL 未配置，限流与缓存将使用进程内内存实现（不跨实例共享）"
    )
    return null
  }

  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      // Serverless / 首次连接失败不应导致进程崩溃
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    })
    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err.message)
    })
  } catch (err) {
    console.error("Redis 初始化失败，回退到内存实现:", err)
    redisClient = null
  }

  return redisClient
}

// ── 内存兜底实现 ──────────────────────────────────────────────────────
const memoryStore = new Map<string, { value: string; expireAt?: number }>()

function memGet(key: string): string | null {
  const entry = memoryStore.get(key)
  if (!entry) return null
  if (entry.expireAt && entry.expireAt < Date.now()) {
    memoryStore.delete(key)
    return null
  }
  return entry.value
}

function memSetex(key: string, ttlSec: number, value: string) {
  memoryStore.set(key, { value, expireAt: Date.now() + ttlSec * 1000 })
}

function memIncr(key: string): number {
  const cur = parseInt(memGet(key) || "0", 10) + 1
  const existing = memoryStore.get(key)
  memoryStore.set(key, { value: String(cur), expireAt: existing?.expireAt })
  return cur
}

function memExpire(key: string, ttlSec: number) {
  const entry = memoryStore.get(key)
  if (entry) entry.expireAt = Date.now() + ttlSec * 1000
}

// ── 对外 API ─────────────────────────────────────────────────────────

/**
 * 限流：在 window 秒内最多允许 limit 次。
 * 返回 { success, remaining }。
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  window: number = 3600
): Promise<{ success: boolean; remaining: number }> {
  const redis = getRedis()

  let current: number
  if (redis) {
    try {
      current = await redis.incr(key)
      if (current === 1) await redis.expire(key, window)
    } catch {
      // Redis 运行时故障 → 内存兜底
      current = memIncr(key)
      if (current === 1) memExpire(key, window)
    }
  } else {
    current = memIncr(key)
    if (current === 1) memExpire(key, window)
  }

  if (current > limit) return { success: false, remaining: 0 }
  return { success: true, remaining: limit - current }
}

/**
 * 缓存：命中返回缓存，否则执行 fetcher 并写入。
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const redis = getRedis()

  if (redis) {
    try {
      const cached = await redis.get(key)
      if (cached) return JSON.parse(cached) as T
      const data = await fetcher()
      await redis.setex(key, ttl, JSON.stringify(data))
      return data
    } catch {
      // 故障时直接执行 fetcher，不缓存
      return fetcher()
    }
  }

  const cached = memGet(key)
  if (cached) return JSON.parse(cached) as T
  const data = await fetcher()
  memSetex(key, ttl, JSON.stringify(data))
  return data
}

export { getRedis }
