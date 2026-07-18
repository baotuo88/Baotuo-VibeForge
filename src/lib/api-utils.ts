import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/redis"

/**
 * 统一 API 错误处理与限流工具。
 */

/**
 * 对某个 key 做限流；超限返回 429 NextResponse，否则返回 null。
 *
 * @param identifier 唯一标识（如 `run:${userId}`）
 * @param limit      窗口内最大次数
 * @param window     窗口秒数（默认 60s）
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  window: number = 60
): Promise<NextResponse | null> {
  const { success, remaining } = await checkRateLimit(
    `ratelimit:${identifier}`,
    limit,
    window
  )

  if (!success) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: {
          "Retry-After": String(window),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  return null
}

/**
 * 将任意错误转换为标准 JSON 错误响应。
 * 生产环境隐藏内部细节，开发环境返回具体信息。
 */
export function errorResponse(error: unknown, status: number = 500): NextResponse {
  const isDev = process.env.NODE_ENV !== "production"
  const message =
    error instanceof Error ? error.message : "服务器内部错误，请稍后重试"

  console.error("[API Error]", error)

  return NextResponse.json(
    {
      error: isDev ? message : status >= 500 ? "服务器内部错误，请稍后重试" : message,
    },
    { status }
  )
}
