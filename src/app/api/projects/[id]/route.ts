import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { ProjectStatus } from "@prisma/client"

const PROJECT_STATUSES = Object.values(ProjectStatus) as string[]

// GET /api/projects/[id] - Get project details
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        documents: { orderBy: { version: "desc" } },
        prompts: { orderBy: { createdAt: "desc" } },
        conversations: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }
    if (project.userId !== user.id) {
      return NextResponse.json({ error: "无权访问该项目" }, { status: 403 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }
    if (project.userId !== user.id) {
      return NextResponse.json({ error: "无权访问该项目" }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, status } = body

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }
    if (project.userId !== user.id) {
      return NextResponse.json({ error: "无权访问该项目" }, { status: 403 })
    }

    await prisma.project.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    )
  }
}
