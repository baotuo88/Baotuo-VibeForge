import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

/**
 * 校验项目归属，返回 NextResponse 错误或 null。
 */
async function assertOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  })
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 })
  }
  if (project.userId !== userId) {
    return NextResponse.json({ error: "无权访问该项目" }, { status: 403 })
  }
  return null
}

// GET /api/projects/[id]/documents - 列出项目文档（每种类型仅返回最新版本）
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const denied = await assertOwnership(params.id, user.id)
    if (denied) return denied

    const { searchParams } = new URL(req.url)
    const all = searchParams.get("all") === "true"

    const documents = await prisma.document.findMany({
      where: { projectId: params.id },
      orderBy: [{ type: "asc" }, { version: "desc" }],
    })

    if (all) {
      return NextResponse.json(documents)
    }

    // 每种类型只保留最新版本
    const latestByType = new Map<string, (typeof documents)[number]>()
    for (const doc of documents) {
      if (!latestByType.has(doc.type)) {
        latestByType.set(doc.type, doc)
      }
    }

    return NextResponse.json(Array.from(latestByType.values()))
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}
