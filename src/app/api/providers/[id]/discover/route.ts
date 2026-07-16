import { NextRequest, NextResponse } from "next/server"
import { providerService } from "@/lib/services/provider.service"

// POST /api/providers/[id]/discover - Discover models
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const models = await providerService.discoverModels(params.id)

    return NextResponse.json({
      success: true,
      models,
    })
  } catch (error) {
    console.error("Error discovering models:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to discover models" },
      { status: 500 }
    )
  }
}
