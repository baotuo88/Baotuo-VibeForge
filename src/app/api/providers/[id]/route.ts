import { NextRequest, NextResponse } from "next/server"
import { providerService } from "@/lib/services/provider.service"

// GET /api/providers/[id] - Get provider details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const provider = await providerService.getProviderById(params.id)

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...provider,
      apiKey: "***" + provider.apiKey.slice(-4),
    })
  } catch (error) {
    console.error("Error fetching provider:", error)
    return NextResponse.json(
      { error: "Failed to fetch provider" },
      { status: 500 }
    )
  }
}

// PATCH /api/providers/[id] - Update provider
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const provider = await providerService.updateProvider(params.id, body)

    return NextResponse.json({
      ...provider,
      apiKey: body.apiKey ? "***" + body.apiKey.slice(-4) : provider.apiKey,
    })
  } catch (error) {
    console.error("Error updating provider:", error)
    return NextResponse.json(
      { error: "Failed to update provider" },
      { status: 500 }
    )
  }
}

// DELETE /api/providers/[id] - Delete provider
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await providerService.deleteProvider(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting provider:", error)
    return NextResponse.json(
      { error: "Failed to delete provider" },
      { status: 500 }
    )
  }
}
