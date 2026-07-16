import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generatePrompt } from "@/lib/prompts/templates"
import { DevelopmentTool } from "@prisma/client"

// POST /api/projects/[id]/prompts/generate
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tool } = await req.json()

    if (!tool) {
      return NextResponse.json(
        { error: "Tool is required" },
        { status: 400 }
      )
    }

    // Get project with documents
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        documents: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Extract documents
    const prd = project.documents.find((d) => d.type === "PRD")?.content
    const architecture = project.documents.find((d) => d.type === "ARCHITECTURE")?.content
    const databaseDesign = project.documents.find((d) => d.type === "DATABASE")?.content

    // Generate prompt
    const content = generatePrompt(tool as DevelopmentTool, {
      projectName: project.name,
      description: project.description || undefined,
      prd,
      architecture,
      databaseDesign,
    })

    // Save to database
    const prompt = await prisma.generatedPrompt.create({
      data: {
        projectId: project.id,
        tool: tool as DevelopmentTool,
        title: `${tool} Prompt`,
        content,
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

// GET /api/projects/[id]/prompts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
