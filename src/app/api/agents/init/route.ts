import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { DEFAULT_AGENTS } from "@/lib/agents/prompts"

// POST /api/agents/init - 一键初始化默认 Agent（admin only）
// 为尚未存在的 Agent 类型创建默认配置，并绑定到指定模型（或首个可用模型）。
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  try {
    const body = await req.json().catch(() => ({}))
    const { modelId } = body as { modelId?: string }

    // 确定绑定的模型：优先使用传入的 modelId，否则取首个可用模型
    let targetModelId = modelId
    if (targetModelId) {
      const model = await prisma.model.findUnique({ where: { id: targetModelId } })
      if (!model) {
        return NextResponse.json({ error: "指定的模型不存在" }, { status: 400 })
      }
    } else {
      const anyModel = await prisma.model.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      })
      if (!anyModel) {
        return NextResponse.json(
          { error: "尚无可用模型，请先在 Providers 页面添加并同步模型" },
          { status: 400 }
        )
      }
      targetModelId = anyModel.id
    }

    const results: { type: string; status: "created" | "skipped" }[] = []
    for (const def of DEFAULT_AGENTS) {
      const exists = await prisma.agent.findFirst({ where: { type: def.type } })
      if (exists) {
        results.push({ type: def.type, status: "skipped" })
        continue
      }
      await prisma.agent.create({
        data: {
          name: def.name,
          type: def.type,
          description: def.description,
          systemPrompt: def.systemPrompt,
          temperature: def.temperature,
          maxTokens: def.maxTokens,
          modelId: targetModelId,
          isActive: true,
        },
      })
      results.push({ type: def.type, status: "created" })
    }

    const created = results.filter((r) => r.status === "created").length
    return NextResponse.json({
      success: true,
      created,
      skipped: results.length - created,
      results,
    })
  } catch (error) {
    console.error("Error initializing agents:", error)
    return NextResponse.json(
      { error: "初始化默认 Agent 失败" },
      { status: 500 }
    )
  }
}
