import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

// GET /api/models?providerId=xxx - list user-visible models
export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get("providerId")

    // 只返回当前用户拥有的 Provider 下的模型。
    // 团队共享逻辑待团队功能实现后，再按当前用户所属 teamIds 精确匹配；
    // 此前用 `teamId: { not: null }` 会匹配任意团队的 Provider，造成跨用户数据泄漏。
    const models = await prisma.model.findMany({
      where: {
        ...(providerId ? { providerId } : {}),
        provider: {
          userId: user.id,
        },
      },
      include: {
        provider: { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ providerId: "asc" }, { name: "asc" }],
    })

    return NextResponse.json(models)
  } catch (error) {
    console.error("Error fetching models:", error)
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 })
  }
}
