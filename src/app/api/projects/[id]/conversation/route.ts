import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/projects/[id]/conversation - Get conversation messages
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { projectId: params.id },
      include: {
        logs: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ messages: [] })
    }

    const messages = conversation.logs.map((log) => ({
      role: log.role.toLowerCase(),
      content: log.content,
      agentType: log.agent?.type,
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
