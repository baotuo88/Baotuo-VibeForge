import { ChatOpenAI } from "@langchain/openai"
import { ChatAnthropic } from "@langchain/anthropic"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import type { AgentType } from "@/types/agent"

export class LLMService {
  /**
   * Load the active agent config for a given type (includes model + provider).
   * Returns null if none configured.
   */
  async getAgentConfig(agentType: AgentType) {
    return prisma.agent.findFirst({
      where: {
        type: agentType,
        isActive: true,
      },
      include: {
        model: {
          include: {
            provider: true,
          },
        },
      },
    })
  }

  async getChatModel(agentType: AgentType) {
    // Get agent configuration
    const agent = await this.getAgentConfig(agentType)

    if (!agent) {
      throw new Error(
        `未找到已启用的「${agentType}」Agent，请在后台「Agent 配置」中创建或点击一键初始化`
      )
    }

    const provider = agent.model.provider

    // 解密失败（密文损坏或 ENCRYPTION_KEY 变更）时给出明确的配置错误，
    // 而非把底层 crypto 异常直接抛成 500
    let apiKey: string
    try {
      apiKey = decrypt(provider.apiKey)
    } catch {
      throw new Error(
        `Provider「${provider.name}」的 API Key 解密失败，可能是密钥损坏或 ENCRYPTION_KEY 已变更，请在后台重新填写`
      )
    }

    // Create appropriate chat model based on provider type
    switch (provider.type) {
      case "CUSTOM":
        // CUSTOM 必须显式配置 baseUrl，否则会静默走 OpenAI 默认地址
        if (!provider.baseUrl) {
          throw new Error(`自定义 Provider「${provider.name}」缺少 baseUrl 配置`)
        }
      // fallthrough
      case "OPENAI":
      case "DEEPSEEK":
      case "OPENROUTER":
        return new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: agent.model.name,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          configuration: {
            baseURL: provider.baseUrl ?? undefined,
          },
        })

      case "ANTHROPIC":
        return new ChatAnthropic({
          anthropicApiKey: apiKey,
          modelName: agent.model.name,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
        })

      default:
        throw new Error(`Unsupported provider type: ${provider.type}`)
    }
  }

  async invoke(agentType: AgentType, messages: any[]) {
    const model = await this.getChatModel(agentType)
    const response = await model.invoke(messages)
    return response.content
  }

  /**
   * Resolve the system prompt for an agent type: prefer the DB-configured
   * `systemPrompt`, fall back to the provided default (static AGENT_PROMPTS).
   */
  async resolveSystemPrompt(agentType: AgentType, fallback: string): Promise<string> {
    const agent = await this.getAgentConfig(agentType)
    return agent?.systemPrompt?.trim() ? agent.systemPrompt : fallback
  }
}

export const llmService = new LLMService()
