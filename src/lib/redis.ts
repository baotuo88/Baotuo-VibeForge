import Redis from "ioredis"

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }
  throw new Error("REDIS_URL is not defined")
}

const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

redis.on("error", (err) => {
  console.error("Redis Client Error", err)
})

export { redis }

// Rate limiting helper
export async function checkRateLimit(
  key: string,
  limit: number,
  window: number = 3600
): Promise<{ success: boolean; remaining: number }> {
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, window)
  }

  if (current > limit) {
    return { success: false, remaining: 0 }
  }

  return { success: true, remaining: limit - current }
}

// Cache helper
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await redis.get(key)

  if (cached) {
    return JSON.parse(cached) as T
  }

  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))

  return data
}
