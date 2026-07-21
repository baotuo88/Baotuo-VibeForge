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

    // 加载已有产物与历史对话（多轮对话：让 supervisor 跳过已完成阶段，
    // 各 Agent 获得上下文），仅在指定 projectId 时加载
    let existing = undefined
    let history: Awaited<ReturnType<typeof projectArtifactsService.loadConversationHistory>> = []
    if (projectId) {
      existing = await projectArtifactsService.loadPriorState(projectId)
      history = await projectArtifactsService.loadConversationHistory(projectId)
    }

    // SSE 流式：每个 Agent 节点完成后推一个进度事件，最后推 done 事件（含完整结果）。
    const encoder = new TextEncoder()
    const historyLen = history.length

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        }

        try {
          const iterator = agentOrchestrator.stream(message, { existing, history })

          // 手动迭代以捕获 generator 的 return 值（最终状态）
          let step = await iterator.next()
          while (!step.done) {
            const { agent, update } = step.value
            // 只把本轮助手消息推给前端展示
            const newMessages = (update.messages ?? []).filter(
              (m) => m.role === "assistant"
            )
            send("agent", { agent, messages: newMessages })
            step = await iterator.next()
          }

          const result = step.value // AgentState 终态

          // 持久化结果（仅当指定了 projectId）
          let persisted = null
          if (projectId) {
            const newMessages = result.messages.slice(historyLen)
            persisted = await projectArtifactsService.persistRun(
              projectId,
              user.id,
              result,
              newMessages
            )
          }

          send("done", { success: true, result, persisted })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "编排运行失败"
          send("error", { error: message })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
