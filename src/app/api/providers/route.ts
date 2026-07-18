import { NextRequest, NextResponse } from "next/server"
import { providerService } from "@/lib/services/provider.service"
import { requireUser } from "@/lib/session"

// GET /api/providers - List all providers
export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const providers = await providerService.listProviders(user.id)

    // Don't expose decrypted API keys in list
    const sanitized = providers.map((p) => ({
      ...p,
      apiKey: "***" + p.apiKey.slice(-4),
    }))

    return NextResponse.json(sanitized)
  } catch (error) {
    console.error("Error fetching providers:", error)
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    )
  }
}

// POST /api/providers - Create new provider
export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const body = await req.json()
    const { name, type, baseUrl, apiKey } = body

    if (!name || !type || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const provider = await providerService.createProvider({
      name,
      type,
      baseUrl,
      apiKey,
      userId: user.id,
    })

    return NextResponse.json({
      ...provider,
      apiKey: "***" + apiKey.slice(-4),
    })
  } catch (error) {
    console.error("Error creating provider:", error)
    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 }
    )
  }
}
