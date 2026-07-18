import { NextRequest, NextResponse } from "next/server"
import { agentOrchestrator } from "@/lib/agents/orchestrator"
import { projectArtifactsService } from "@/lib/services/project-artifacts.service"
import { requireUser } from "@/lib/session"
import { rateLimit, errorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export const maxDuration = 60 // 60 seconds for agent processing

// POST /api/agents/run - Run agent orchestration
export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  // 限流：每用户每分钟最多 5 次编排（LLM 调用昂贵）
  const limited = await rateLimit(`run:${user.id}`, 5, 60)
  if (limited) return limited

  try {
    const { message, projectId } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // 若指定了 projectId，校验归属权
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true },
      })
      if (!project) {
        return NextResponse.json({ error: "项目不存在" }, { status: 404 })
      }
      if (project.userId !== user.id) {
        return NextResponse.json({ error: "无权访问该项目" }, { status: 403 })
      }
    }

    // 运行 Agent 编排
    const result = await agentOrchestrator.run(message)

    // 持久化结果（仅当指定了 projectId）
    let persisted = null
    if (projectId) {
      persisted = await projectArtifactsService.persistRun(projectId, user.id, result)
    }

    return NextResponse.json({
      success: true,
      result,
      persisted,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
