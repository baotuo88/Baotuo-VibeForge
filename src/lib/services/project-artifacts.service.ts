import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import type { AgentState } from "@/types/agent"
import type { DocumentType, MessageRole } from "@prisma/client"

/**
 * 「查最新版本 → version+1 新建」在并发下会撞唯一约束（P2002）。
 * 这里捕获唯一冲突并重试若干次，重试时会重新读取最新 version，
 * 从而串行化并发写入，避免 500 或重复版本。
 */
async function withVersionRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        attempt < retries
      ) {
        continue
      }
      throw e
    }
  }
}

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
   * 保存对话日志。传入的 messages 应仅为本轮新增的消息，
   * 避免把注入的历史消息重复入库。
   */
  async saveConversationLogs(
    conversationId: string,
    messages: AgentState["messages"]
  ) {
    const rows = messages.map((m) => ({
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
    return withVersionRetry(async () => {
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

      const p = await withVersionRetry(async () => {
        const latest = await prisma.generatedPrompt.findFirst({
          where: { projectId, tool },
          orderBy: { version: "desc" },
        })
        if (latest && latest.content === content) return null

        return prisma.generatedPrompt.create({
          data: {
            projectId,
            tool,
            title: `${key} Prompt`,
            content,
            version: latest ? latest.version + 1 : 1,
          },
        })
      })
      if (p) saved.push(p.id)
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
   * 从数据库加载项目已有的产物，构造编排的「初始状态」。
   * 这样多轮对话时 supervisor 能跳过已完成的阶段（PRD/架构/DB/Prompt），
   * 而不是每次都从产品经理重跑整条流水线。
   */
  async loadPriorState(projectId: string): Promise<Partial<AgentState>> {
    const [docs, prompts] = await Promise.all([
      prisma.document.findMany({
        where: { projectId },
        orderBy: { version: "desc" },
      }),
      prisma.generatedPrompt.findMany({
        where: { projectId },
        orderBy: { version: "desc" },
      }),
    ])

    // 每种 type 取最新版本
    const latestByType = (type: DocumentType) =>
      docs.find((d) => d.type === type)?.content

    const promptMap: Record<string, string> = {}
    const seen = new Set<string>()
    for (const p of prompts) {
      if (seen.has(p.tool)) continue // 只取每个 tool 的最新版
      seen.add(p.tool)
      promptMap[p.tool] = p.content
    }

    return {
      prd: latestByType("PRD"),
      architecture: latestByType("ARCHITECTURE"),
      databaseDesign: latestByType("DATABASE"),
      prompts: Object.keys(promptMap).length > 0 ? promptMap : undefined,
    }
  }

  /**
   * 加载最近的对话历史（用于给 Agent 提供上下文）。
   * 返回按时间升序的消息数组，limit 控制条数上限。
   */
  async loadConversationHistory(
    projectId: string,
    limit: number = 20
  ): Promise<AgentState["messages"]> {
    const conversation = await prisma.conversation.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    })
    if (!conversation) return []

    const logs = await prisma.conversationLog.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return logs
      .reverse()
      .map((log) => ({
        role: log.role.toLowerCase() as "user" | "assistant" | "system",
        content: log.content,
        agentType: (log.metadata as { agentType?: string } | null)?.agentType as
          | AgentState["messages"][number]["agentType"],
      }))
  }

  /**
   * 一次性持久化整个编排结果。
   * @param newMessages 仅本轮新增的消息（避免把注入的历史消息重复入库）
   */
  async persistRun(
    projectId: string,
    userId: string,
    state: AgentState,
    newMessages?: AgentState["messages"]
  ) {
    const conversation = await this.getOrCreateConversation(projectId, userId)
    // 只保存本轮新增的消息（newMessages），未传入时回退保存全部
    await this.saveConversationLogs(conversation.id, newMessages ?? state.messages)
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
