import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/models?providerId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get("providerId")

    const models = await prisma.model.findMany({
      where: providerId ? { providerId } : undefined,
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
