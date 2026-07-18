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
    const apiKey = decrypt(provider.apiKey)

    // Create appropriate chat model based on provider type
    switch (provider.type) {
      case "OPENAI":
      case "DEEPSEEK":
      case "OPENROUTER":
      case "CUSTOM":
        return new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: agent.model.name,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          configuration: {
            baseURL: provider.baseUrl,
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
