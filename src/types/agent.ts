// Agent Types
export type AgentType =
  | "SUPERVISOR"
  | "PRODUCT_MANAGER"
  | "UI_UX_DESIGNER"
  | "ARCHITECT"
  | "DATABASE"
  | "PROMPT"

export interface AgentConfig {
  id: string
  name: string
  type: AgentType
  systemPrompt: string
  description?: string
  modelId: string
  temperature: number
  maxTokens: number
  isActive: boolean
}

export interface AgentMessage {
  role: "user" | "assistant" | "system"
  content: string
  agentType?: AgentType
}

export interface AgentState {
  messages: AgentMessage[]
  currentAgent?: AgentType
  requirementAnalysis?: string
  prd?: string
  architecture?: string
  databaseDesign?: string
  prompts?: Record<string, string>
  context?: Record<string, any>
}

export interface SupervisorDecision {
  nextAgent: AgentType | "END"
  reasoning: string
}
