// AI Provider Types
export type ProviderType =
  | "OPENAI"
  | "ANTHROPIC"
  | "GOOGLE"
  | "DEEPSEEK"
  | "MOONSHOT"
  | "ZHIPU"
  | "OPENROUTER"
  | "CUSTOM"

export interface AIProvider {
  id: string
  name: string
  type: ProviderType
  baseUrl?: string
  apiKey: string
  isActive: boolean
  userId?: string
  teamId?: string
  createdAt: Date
  updatedAt: Date
  models: Model[]
}

export interface Model {
  id: string
  providerId: string
  name: string
  displayName: string
  contextWindow?: number
  maxOutputTokens?: number
  supportsFunctions: boolean
  supportsVision: boolean
  isActive: boolean
}

export interface CreateProviderRequest {
  name: string
  type: ProviderType
  baseUrl?: string
  apiKey: string
}

export interface UpdateProviderRequest {
  name?: string
  baseUrl?: string
  apiKey?: string
  isActive?: boolean
}

export interface DiscoverModelsResponse {
  models: {
    id: string
    name: string
    contextWindow?: number
  }[]
}
