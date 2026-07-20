import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"
import type { ProviderType } from "@/types/provider"

export class ProviderService {
  async createProvider(data: {
    name: string
    type: ProviderType
    baseUrl?: string
    apiKey: string
    userId: string
  }) {
    const encryptedApiKey = encrypt(data.apiKey)

    return await prisma.aIProvider.create({
      data: {
        name: data.name,
        type: data.type,
        baseUrl: data.baseUrl,
        apiKey: encryptedApiKey,
        userId: data.userId,
      },
      include: {
        models: true,
      },
    })
  }

  async getProviderById(id: string) {
    const provider = await prisma.aIProvider.findUnique({
      where: { id },
      include: {
        models: true,
      },
    })

    if (!provider) return null

    let apiKey: string
    try {
      apiKey = decrypt(provider.apiKey)
    } catch {
      // 密文损坏或 ENCRYPTION_KEY 变更导致解密失败：抛出明确的配置错误，
      // 避免把底层加密异常直接冒泡成 500
      throw new Error(
        `Provider「${provider.name}」的 API Key 解密失败，请重新填写（可能是 ENCRYPTION_KEY 变更所致）`
      )
    }

    return {
      ...provider,
      apiKey,
    }
  }

  async listProviders(userId: string) {
    // 只返回当前用户拥有的 Provider（团队共享逻辑待团队功能实现后再按 teamId 精确匹配）
    return await prisma.aIProvider.findMany({
      where: { userId },
      include: {
        models: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }

  /**
   * 返回 Provider 的归属 userId（不解密 apiKey，用于鉴权校验）。
   * 找不到返回 null。
   */
  async getProviderOwner(id: string): Promise<string | null> {
    const provider = await prisma.aIProvider.findUnique({
      where: { id },
      select: { userId: true },
    })
    return provider?.userId ?? null
  }

  async updateProvider(
    id: string,
    data: {
      name?: string
      baseUrl?: string
      apiKey?: string
      isActive?: boolean
    }
  ) {
    // 显式白名单：只挑取允许更新的字段，避免调用方原始 body 透传
    // （防止改写 userId/teamId 等归属字段或注入未预期字段）
    const updateData: {
      name?: string
      baseUrl?: string
      apiKey?: string
      isActive?: boolean
    } = {}
    if (typeof data.name === "string") updateData.name = data.name
    if (typeof data.baseUrl === "string") updateData.baseUrl = data.baseUrl
    if (typeof data.isActive === "boolean") updateData.isActive = data.isActive
    if (typeof data.apiKey === "string" && data.apiKey) {
      updateData.apiKey = encrypt(data.apiKey)
    }

    return await prisma.aIProvider.update({
      where: { id },
      data: updateData,
      include: {
        models: true,
      },
    })
  }

  async deleteProvider(id: string) {
    return await prisma.aIProvider.delete({
      where: { id },
    })
  }

  async discoverModels(providerId: string) {
    const provider = await this.getProviderById(providerId)
    if (!provider) throw new Error("Provider not found")

    let models: any[] = []

    switch (provider.type) {
      case "OPENAI":
      case "CUSTOM":
        models = await this.discoverOpenAIModels(provider.baseUrl || "https://api.openai.com/v1", provider.apiKey)
        break
      case "ANTHROPIC":
        models = this.getAnthropicModels()
        break
      case "DEEPSEEK":
        models = await this.discoverOpenAIModels("https://api.deepseek.com/v1", provider.apiKey)
        break
      default:
        throw new Error(`Model discovery not supported for ${provider.type}`)
    }

    // Save discovered models
    for (const model of models) {
      await prisma.model.upsert({
        where: {
          providerId_name: {
            providerId: provider.id,
            name: model.id,
          },
        },
        create: {
          providerId: provider.id,
          name: model.id,
          displayName: model.name || model.id,
          contextWindow: model.contextWindow,
          maxOutputTokens: model.maxOutputTokens,
          supportsFunctions: model.supportsFunctions || false,
          supportsVision: model.supportsVision || false,
        },
        update: {
          displayName: model.name || model.id,
          contextWindow: model.contextWindow,
          isActive: true,
        },
      })
    }

    return models
  }

  private async discoverOpenAIModels(baseUrl: string, apiKey: string) {
    try {
      // 加超时，避免上游 Provider 挂起导致请求长时间悬挂
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new Error("获取模型列表超时，请检查 Provider 的 baseUrl 与网络")
      }
      console.error("Error discovering models:", error)
      throw error
    }
  }

  private getAnthropicModels() {
    return [
      {
        id: "claude-opus-4-20250514",
        name: "Claude Opus 4",
        contextWindow: 200000,
        maxOutputTokens: 16384,
        supportsFunctions: true,
        supportsVision: true,
      },
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        contextWindow: 200000,
        maxOutputTokens: 16384,
        supportsFunctions: true,
        supportsVision: true,
      },
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        contextWindow: 200000,
        maxOutputTokens: 8192,
        supportsFunctions: true,
        supportsVision: true,
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        contextWindow: 200000,
        maxOutputTokens: 8192,
        supportsFunctions: true,
        supportsVision: true,
      },
    ]
  }
}

export const providerService = new ProviderService()
