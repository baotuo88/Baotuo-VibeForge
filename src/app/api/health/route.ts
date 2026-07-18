import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 健康检查端点：容器编排 / 负载均衡探活使用
// GET /api/health -> 200 表示应用与数据库均正常，503 表示数据库不可达
export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    app: "ok",
    database: "ok",
  }

  try {
    // 轻量探测数据库连通性
    await prisma.$queryRaw`SELECT 1`
  } catch {
    checks.database = "error"
  }

  const healthy = Object.values(checks).every((v) => v === "ok")

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  )
}
