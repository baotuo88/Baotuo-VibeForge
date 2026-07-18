import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "./auth"

/**
 * Get the current authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

/**
 * Require authentication in an API route.
 * Returns the user OR a NextResponse (401) - caller must check with `instanceof NextResponse`.
 */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }
  return user
}

/**
 * Require admin role in an API route.
 * Returns the user OR a NextResponse (401/403).
 */
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 })
  }
  return user
}

/**
 * Wrapper for API handlers that need authentication.
 * Usage: export const GET = withAuth(async (req, user) => { ... })
 */
export function withAuth<T extends any[]>(
  handler: (req: Request, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, ...args: T) => Promise<Response>
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }
    return handler(req, user, ...args)
  }
}

/**
 * Wrapper for API handlers that require admin role.
 */
export function withAdmin<T extends any[]>(
  handler: (req: Request, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, ...args: T) => Promise<Response>
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限，需要管理员" }, { status: 403 })
    }
    return handler(req, user, ...args)
  }
}
