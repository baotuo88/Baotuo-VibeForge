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
    const model = await prisma.model.update({
      where: { id: params.id },
      data: body,
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
