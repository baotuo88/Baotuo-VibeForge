import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generatePrompt } from "@/lib/prompts/templates"
import { DevelopmentTool } from "@prisma/client"
import { requireUser } from "@/lib/session"

/**
 * 校验项目归属，返回 project 或 NextResponse 错误。
 */
async function assertOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  })
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 })
  }
  if (project.userId !== userId) {
    return NextResponse.json({ error: "无权访问该项目" }, { status: 403 })
  }
  return null
}

// POST /api/projects/[id]/prompts - 为指定工具生成 Prompt
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const denied = await assertOwnership(params.id, user.id)
    if (denied) return denied

    const { tool } = await req.json()

    if (!tool) {
      return NextResponse.json({ error: "Tool is required" }, { status: 400 })
    }

    // Get project with documents
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        documents: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Extract documents (use latest version of each type)
    const latestOf = (type: string) =>
      project.documents
        .filter((d) => d.type === type)
        .sort((a, b) => b.version - a.version)[0]?.content

    const prd = latestOf("PRD")
    const architecture = latestOf("ARCHITECTURE")
    const databaseDesign = latestOf("DATABASE")

    // Generate prompt
    const content = generatePrompt(tool as DevelopmentTool, {
      projectName: project.name,
      description: project.description || undefined,
      prd,
      architecture,
      databaseDesign,
    })

    // 版本递增保存
    const latest = await prisma.generatedPrompt.findFirst({
      where: { projectId: project.id, tool: tool as DevelopmentTool },
      orderBy: { version: "desc" },
    })

    const prompt = await prisma.generatedPrompt.create({
      data: {
        projectId: project.id,
        tool: tool as DevelopmentTool,
        title: `${tool} Prompt`,
        content,
        version: latest ? latest.version + 1 : 1,
      },
    })

    return NextResponse.json(prompt)
  } catch (error) {
    console.error("Error generating prompt:", error)
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    )
  }
}

// GET /api/projects/[id]/prompts - 列出已生成的 Prompt
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const denied = await assertOwnership(params.id, user.id)
    if (denied) return denied

    const prompts = await prisma.generatedPrompt.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(prompts)
  } catch (error) {
    console.error("Error fetching prompts:", error)
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    )
  }
}
