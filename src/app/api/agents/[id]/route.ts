import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/agents/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        model: {
          include: { provider: { select: { id: true, name: true, type: true } } },
        },
      },
    })
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }
    return NextResponse.json(agent)
  } catch (error) {
    console.error("Error fetching agent:", error)
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 })
  }
}

// PATCH /api/agents/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: body,
      include: {
        model: {
          include: { provider: { select: { id: true, name: true, type: true } } },
        },
      },
    })
    return NextResponse.json(agent)
  } catch (error) {
    console.error("Error updating agent:", error)
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 })
  }
}

// DELETE /api/agents/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.agent.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting agent:", error)
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 })
  }
}
