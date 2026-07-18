import { prisma } from "@/lib/prisma"
import type { AgentState } from "@/types/agent"
import type { DocumentType, MessageRole } from "@prisma/client"

/**
 * 将一次 Agent 编排的结果持久化到数据库：
 * - 对话日志（ConversationLog）
 * - 生成的文档（Document: PRD / ARCHITECTURE / DATABASE）
 * - 生成的 Prompt（GeneratedPrompt）
 *
 * 采用「文档版本递增」策略：同一 project + type 已存在则 version+1 新建，
 * 保留历史版本便于回溯。
 */
export class ProjectArtifactsService {
  /**
   * 找到项目最新的会话，没有则创建一个。
   */
  async getOrCreateConversation(projectId: string, userId: string) {
    const existing = await prisma.conversation.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    })
    if (existing) return existing

    return prisma.conversation.create({
      data: { projectId, userId, mode: "NORMAL" },
    })
  }

  /**
   * 保存用户输入与各 Agent 输出为对话日志。
   */
  async saveConversationLogs(conversationId: string, state: AgentState) {
    const rows = state.messages.map((m) => ({
      conversationId,
      role: (m.role.toUpperCase() as MessageRole) ?? "ASSISTANT",
      content: m.content,
      metadata: m.agentType ? { agentType: m.agentType } : undefined,
    }))

    if (rows.length === 0) return
    await prisma.conversationLog.createMany({ data: rows })
  }

  /**
   * 保存/更新一个文档（自动版本递增）。
   */
  private async upsertDocument(
    projectId: string,
    type: DocumentType,
    title: string,
    content: string
  ) {
    const latest = await prisma.document.findFirst({
      where: { projectId, type },
      orderBy: { version: "desc" },
    })

    // 内容未变化则跳过
    if (latest && latest.content === content) return latest

    return prisma.document.create({
      data: {
        projectId,
        type,
        title,
        content,
        version: latest ? latest.version + 1 : 1,
      },
    })
  }

  /**
   * 将编排结果中的文档写入数据库。
   */
  async saveDocuments(projectId: string, state: AgentState) {
    const saved: { type: DocumentType; id: string }[] = []

    if (state.prd) {
      const d = await this.upsertDocument(projectId, "PRD", "产品需求文档 (PRD)", state.prd)
      if (d) saved.push({ type: "PRD", id: d.id })
    }
    if (state.architecture) {
      const d = await this.upsertDocument(
        projectId,
        "ARCHITECTURE",
        "技术架构设计",
        state.architecture
      )
      if (d) saved.push({ type: "ARCHITECTURE", id: d.id })
    }
    if (state.databaseDesign) {
      const d = await this.upsertDocument(
        projectId,
        "DATABASE",
        "数据库设计",
        state.databaseDesign
      )
      if (d) saved.push({ type: "DATABASE", id: d.id })
    }

    return saved
  }

  /**
   * 保存生成的 Prompt。state.prompts 是 { toolKey: content } 结构。
   */
  async savePrompts(projectId: string, state: AgentState) {
    if (!state.prompts) return []

    const toolMap: Record<string, string> = {
      default: "CLAUDE_CODE",
      CLAUDE_CODE: "CLAUDE_CODE",
      CODEX: "CODEX",
      CURSOR: "CURSOR",
      WINDSURF: "WINDSURF",
      CLINE: "CLINE",
      CONTINUE: "CONTINUE",
      AIDER: "AIDER",
      LOVABLE: "LOVABLE",
      BOLT: "BOLT",
      REPLIT_AGENT: "REPLIT_AGENT",
    }

    const saved: string[] = []
    for (const [key, content] of Object.entries(state.prompts)) {
      if (!content) continue
      const tool = (toolMap[key] || "CUSTOM") as any

      const latest = await prisma.generatedPrompt.findFirst({
        where: { projectId, tool },
        orderBy: { version: "desc" },
      })
      if (latest && latest.content === content) continue

      const p = await prisma.generatedPrompt.create({
        data: {
          projectId,
          tool,
          title: `${key} Prompt`,
          content,
          version: latest ? latest.version + 1 : 1,
        },
      })
      saved.push(p.id)
    }
    return saved
  }

  /**
   * 根据编排结果更新项目状态。
   */
  async updateProjectStatus(projectId: string, state: AgentState) {
    let status: string = "REQUIREMENT_ANALYSIS"
    if (state.prompts && Object.keys(state.prompts).length > 0) status = "READY"
    else if (state.databaseDesign) status = "ARCHITECTURE"
    else if (state.architecture) status = "DESIGN"
    else if (state.prd) status = "REQUIREMENT_ANALYSIS"

    await prisma.project.update({
      where: { id: projectId },
      data: { status: status as any },
    })
  }

  /**
   * 一次性持久化整个编排结果。
   */
  async persistRun(projectId: string, userId: string, state: AgentState) {
    const conversation = await this.getOrCreateConversation(projectId, userId)
    await this.saveConversationLogs(conversation.id, state)
    const documents = await this.saveDocuments(projectId, state)
    const prompts = await this.savePrompts(projectId, state)
    await this.updateProjectStatus(projectId, state)

    return {
      conversationId: conversation.id,
      documents,
      prompts,
    }
  }
}

export const projectArtifactsService = new ProjectArtifactsService()
