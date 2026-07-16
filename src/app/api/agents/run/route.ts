import { NextRequest, NextResponse } from "next/server"
import { agentOrchestrator } from "@/lib/agents/orchestrator"

export const maxDuration = 60 // 60 seconds for agent processing

// POST /api/agents/run - Run agent orchestration
export async function POST(req: NextRequest) {
  try {
    const { message, projectId } = await req.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Run agent orchestration
    const result = await agentOrchestrator.run(message)

    // TODO: Save conversation to database with projectId

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error("Error running agents:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    )
  }
}
