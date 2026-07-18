import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser, requireAdmin } from "@/lib/session"

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
    console.error("Error creating agent:", error)
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    )
  }
}
