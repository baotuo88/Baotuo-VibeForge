import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

// GET /api/models?providerId=xxx - list user-visible models
export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get("providerId")

    // Only models from providers owned by user (or team-shared in future)
    const models = await prisma.model.findMany({
      where: {
        ...(providerId ? { providerId } : {}),
        provider: {
          OR: [{ userId: user.id }, { teamId: { not: null } }],
        },
      },
      include: {
        provider: { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ providerId: "asc" }, { name: "asc" }],
    })

    return NextResponse.json(models)
  } catch (error) {
    console.error("Error fetching models:", error)
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 })
  }
}
