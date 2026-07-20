import { NextRequest, NextResponse } from "next/server"
import { Prisma, AgentType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireUser, requireAdmin } from "@/lib/session"

const AGENT_TYPES = Object.values(AgentType) as string[]

// GET /api/agents - List all agents (any authenticated user)
export async function GET(_req: NextRequest) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const agents = await prisma.agent.findMany({
      include: {
        model: {
          include: {
            provider: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(agents)
  } catch (error) {
    console.error("Error fetching agents:", error)
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    )
  }
}

// POST /api/agents - Create new agent (admin only)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  try {
    const body = await req.json()
    const { name, type, systemPrompt, description, modelId, temperature, maxTokens } = body

    if (!name || !type || !systemPrompt || !modelId) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, systemPrompt, modelId" },
        { status: 400 }
      )
    }

    // 校验 type 是合法枚举值，避免非法值触发 Prisma 500
    if (!AGENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `无效的 Agent 类型：${type}` },
        { status: 400 }
      )
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        type,
        systemPrompt,
        description,
        modelId,
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 4000,
      },
      include: {
        model: {
          include: { provider: { select: { id: true, name: true, type: true } } },
        },
      },
    })
    return NextResponse.json(agent)
  } catch (error) {
    // type 唯一约束冲突：同类型 Agent 已存在
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "该类型的 Agent 已存在，请直接编辑现有配置" },
        { status: 409 }
      )
    }
    // modelId 指向不存在的模型等外键错误
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "指定的模型不存在" },
        { status: 400 }
      )
    }
    console.error("Error creating agent:", error)
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    )
  }
}
