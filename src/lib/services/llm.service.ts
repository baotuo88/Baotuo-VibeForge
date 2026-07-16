import { ChatOpenAI } from "@langchain/openai"
import { ChatAnthropic } from "@langchain/anthropic"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import type { AgentType } from "@/types/agent"

export class LLMService {
  async getChatModel(agentType: AgentType) {
    // Get agent configuration
    const agent = await prisma.agent.findFirst({
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

    if (!agent) {
      throw new Error(`No active agent found for type: ${agentType}`)
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
}

export const llmService = new LLMService()
