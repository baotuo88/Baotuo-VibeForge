import { StateGraph, END } from "@langchain/langgraph/web"
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages"
import { llmService } from "@/lib/services/llm.service"
import { AGENT_PROMPTS } from "./prompts"
import type { AgentState, AgentType } from "@/types/agent"

class AgentOrchestrator {
  private graph: StateGraph<AgentState>

  constructor() {
    this.graph = new StateGraph<AgentState>({
      channels: {
        messages: {
          value: (prev: any[], next: any[]) => [...prev, ...next],
          default: () => [],
        },
        currentAgent: {
          value: (prev: any, next: any) => next || prev,
          default: () => undefined,
        },
        requirementAnalysis: {
          value: (prev: any, next: any) => next || prev,
          default: () => undefined,
        },
        prd: {
          value: (prev: any, next: any) => next || prev,
          default: () => undefined,
        },
        architecture: {
          value: (prev: any, next: any) => next || prev,
          default: () => undefined,
        },
        databaseDesign: {
          value: (prev: any, next: any) => next || prev,
          default: () => undefined,
        },
        prompts: {
          value: (prev: any, next: any) => ({ ...prev, ...next }),
          default: () => ({}),
        },
        context: {
          value: (prev: any, next: any) => ({ ...prev, ...next }),
          default: () => ({}),
        },
      },
    })

    this.buildGraph()
  }

  private buildGraph() {
    // Add nodes
    this.graph.addNode("supervisor", this.supervisorNode.bind(this))
    this.graph.addNode("product_manager", this.productManagerNode.bind(this))
    this.graph.addNode("architect", this.architectNode.bind(this))
    this.graph.addNode("database", this.databaseNode.bind(this))
    this.graph.addNode("prompt", this.promptNode.bind(this))

    // Set entry point
    this.graph.setEntryPoint("supervisor")

    // Add edges from supervisor to other agents
    this.graph.addConditionalEdges(
      "supervisor",
      this.routeFromSupervisor.bind(this),
      {
        PRODUCT_MANAGER: "product_manager",
        ARCHITECT: "architect",
        DATABASE: "database",
        PROMPT: "prompt",
        END: END,
      }
    )

    // All agents return to supervisor
    this.graph.addEdge("product_manager", "supervisor")
    this.graph.addEdge("architect", "supervisor")
    this.graph.addEdge("database", "supervisor")
    this.graph.addEdge("prompt", "supervisor")
  }

  private async supervisorNode(state: AgentState): Promise<Partial<AgentState>> {
    const messages = [
      new SystemMessage(AGENT_PROMPTS.SUPERVISOR),
      ...state.messages.map((m) =>
        m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
    ]

    const response = await llmService.invoke("SUPERVISOR", messages)

    return {
      messages: [{ role: "assistant", content: response as string, agentType: "SUPERVISOR" }],
      currentAgent: "SUPERVISOR",
    }
  }

  private async productManagerNode(state: AgentState): Promise<Partial<AgentState>> {
    const messages = [
      new SystemMessage(AGENT_PROMPTS.PRODUCT_MANAGER),
      ...state.messages.map((m) =>
        m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
    ]

    const response = await llmService.invoke("PRODUCT_MANAGER", messages)

    return {
      messages: [{ role: "assistant", content: response as string, agentType: "PRODUCT_MANAGER" }],
      prd: response as string,
      currentAgent: "PRODUCT_MANAGER",
    }
  }

  private async architectNode(state: AgentState): Promise<Partial<AgentState>> {
    const context = state.prd ? `\n\n参考 PRD：\n${state.prd}` : ""

    const messages = [
      new SystemMessage(AGENT_PROMPTS.ARCHITECT + context),
      ...state.messages.map((m) =>
        m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
    ]

    const response = await llmService.invoke("ARCHITECT", messages)

    return {
      messages: [{ role: "assistant", content: response as string, agentType: "ARCHITECT" }],
      architecture: response as string,
      currentAgent: "ARCHITECT",
    }
  }

  private async databaseNode(state: AgentState): Promise<Partial<AgentState>> {
    const context = `
${state.prd ? `\n参考 PRD：\n${state.prd}` : ""}
${state.architecture ? `\n参考架构：\n${state.architecture}` : ""}
`

    const messages = [
      new SystemMessage(AGENT_PROMPTS.DATABASE + context),
      ...state.messages.map((m) =>
        m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
    ]

    const response = await llmService.invoke("DATABASE", messages)

    return {
      messages: [{ role: "assistant", content: response as string, agentType: "DATABASE" }],
      databaseDesign: response as string,
      currentAgent: "DATABASE",
    }
  }

  private async promptNode(state: AgentState): Promise<Partial<AgentState>> {
    const context = `
${state.prd ? `\n参考 PRD：\n${state.prd}` : ""}
${state.architecture ? `\n参考架构：\n${state.architecture}` : ""}
${state.databaseDesign ? `\n参考数据库设计：\n${state.databaseDesign}` : ""}
`

    const messages = [
      new SystemMessage(AGENT_PROMPTS.PROMPT + context),
      ...state.messages.map((m) =>
        m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
    ]

    const response = await llmService.invoke("PROMPT", messages)

    return {
      messages: [{ role: "assistant", content: response as string, agentType: "PROMPT" }],
      prompts: { default: response as string },
      currentAgent: "PROMPT",
    }
  }

  private routeFromSupervisor(state: AgentState): AgentType | "END" {
    // Simple routing logic based on state
    if (!state.prd) return "PRODUCT_MANAGER"
    if (!state.architecture) return "ARCHITECT"
    if (!state.databaseDesign) return "DATABASE"
    if (!state.prompts || Object.keys(state.prompts).length === 0) return "PROMPT"

    return "END"
  }

  async run(input: string): Promise<AgentState> {
    const initialState: AgentState = {
      messages: [{ role: "user", content: input }],
    }

    const compiled = this.graph.compile()
    const result = await compiled.invoke(initialState)

    return result
  }
}

export const agentOrchestrator = new AgentOrchestrator()
