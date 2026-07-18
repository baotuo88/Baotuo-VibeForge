import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"

// POST /api/projects - Create new project
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    if (user instanceof NextResponse) return user

    const body = await req.json()
    const { name, initialIdea, mode = "NORMAL" } = body

    if (!name || !initialIdea) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name,
        initialIdea,
        userId: user.id,
        status: "REQUIREMENT_ANALYSIS",
      },
    })

    // Create initial conversation
    await prisma.conversation.create({
      data: {
        projectId: project.id,
        userId: user.id,
        mode,
        title: name,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}

// GET /api/projects - List projects
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()
    if (user instanceof NextResponse) return user

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            documents: true,
            prompts: true,
          },
        },
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}
