import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

// PATCH /api/models/[id] - Toggle active / edit (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  try {
    const body = await req.json()

    // 白名单：只允许更新这些字段，避免原始 body 透传（防止改写 id/providerId 等）
    const data: {
      displayName?: string
      contextWindow?: number | null
      maxOutputTokens?: number | null
      supportsFunctions?: boolean
      supportsVision?: boolean
      isActive?: boolean
    } = {}
    if (typeof body.displayName === "string") data.displayName = body.displayName
    if (typeof body.contextWindow === "number" || body.contextWindow === null)
      data.contextWindow = body.contextWindow
    if (typeof body.maxOutputTokens === "number" || body.maxOutputTokens === null)
      data.maxOutputTokens = body.maxOutputTokens
    if (typeof body.supportsFunctions === "boolean") data.supportsFunctions = body.supportsFunctions
    if (typeof body.supportsVision === "boolean") data.supportsVision = body.supportsVision
    if (typeof body.isActive === "boolean") data.isActive = body.isActive

    const model = await prisma.model.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json(model)
  } catch (error) {
    console.error("Error updating model:", error)
    return NextResponse.json({ error: "Failed to update model" }, { status: 500 })
  }
}

// DELETE /api/models/[id] (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  try {
    await prisma.model.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting model:", error)
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 })
  }
}
