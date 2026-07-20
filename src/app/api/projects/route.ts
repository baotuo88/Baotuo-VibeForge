import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { ConversationMode } from "@prisma/client"

const CONVERSATION_MODES = Object.values(ConversationMode) as string[]

// POST /api/projects - Create new project
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    if (user instanceof NextResponse) return user

    const body = await req.json()
    const { name, initialIdea, mode = "NORMAL" } = body

    if (!name || !initialIdea) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 校验 mode 枚举，非法值返回 400 而非落到 catch 变成 500
    if (!CONVERSATION_MODES.includes(mode)) {
      return NextResponse.json(
        { error: `无效的 mode，可选值：${CONVERSATION_MODES.join(", ")}` },
        { status: 400 }
      )
    }

    // 项目与初始会话在同一事务内创建，避免出现「有项目无会话」的孤儿数据
    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          name,
          initialIdea,
          userId: user.id,
          status: "REQUIREMENT_ANALYSIS",
        },
      })

      await tx.conversation.create({
        data: {
          projectId: p.id,
          userId: user.id,
          mode: mode as ConversationMode,
          title: name,
        },
      })

      return p
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}

// GET /api/projects - List projects
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()
    if (user instanceof NextResponse) return user

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            documents: true,
            prompts: true,
          },
        },
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}
