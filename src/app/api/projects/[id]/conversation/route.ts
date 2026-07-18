import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

// GET /api/projects/[id]/conversation - Get conversation messages
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    // 校验项目归属
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }
    if (project.userId !== user.id) {
      return NextResponse.json({ error: "无权访问该项目" }, { status: 403 })
    }

    const conversation = await prisma.conversation.findFirst({
      where: { projectId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        logs: {
          orderBy: { createdAt: "asc" },
          include: { agent: { select: { type: true } } },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ messages: [] })
    }

    const messages = conversation.logs.map((log) => ({
      role: log.role.toLowerCase(),
      content: log.content,
      // agentType 优先取关联 Agent，其次取 metadata 里记录的 agentType
      agentType:
        log.agent?.type ||
        (log.metadata as { agentType?: string } | null)?.agentType,
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    )
  }
}
