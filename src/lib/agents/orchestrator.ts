import { StateGraph, START, END } from "@langchain/langgraph/web"
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

    // Set entry point via START edge (setEntryPoint 只允许 "__start__" 字面量，
    // 用 addEdge(START, ...) 是新版本 langgraph 的等价 API)
    const g = this.graph as any
    g.addEdge(START, "supervisor")

    // Add edges from supervisor to other agents
    g.addConditionalEdges(
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
    g.addEdge("product_manager", "supervisor")
    g.addEdge("architect", "supervisor")
    g.addEdge("database", "supervisor")
    g.addEdge("prompt", "supervisor")
  }

  private async supervisorNode(state: AgentState): Promise<Partial<AgentState>> {
    const systemPrompt = await llmService.resolveSystemPrompt("SUPERVISOR", AGENT_PROMPTS.SUPERVISOR)
    const messages = [
      new SystemMessage(systemPrompt),
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
    const systemPrompt = await llmService.resolveSystemPrompt("PRODUCT_MANAGER", AGENT_PROMPTS.PRODUCT_MANAGER)
    const messages = [
      new SystemMessage(systemPrompt),
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
    const systemPrompt = await llmService.resolveSystemPrompt("ARCHITECT", AGENT_PROMPTS.ARCHITECT)

    const messages = [
      new SystemMessage(systemPrompt + context),
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
    const systemPrompt = await llmService.resolveSystemPrompt("DATABASE", AGENT_PROMPTS.DATABASE)

    const messages = [
      new SystemMessage(systemPrompt + context),
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
    const systemPrompt = await llmService.resolveSystemPrompt("PROMPT", AGENT_PROMPTS.PROMPT)

    const messages = [
      new SystemMessage(systemPrompt + context),
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

  /**
   * 运行编排。
   * @param input   本轮用户输入
   * @param options.existing  已生成的产物（prd/架构/DB/prompts），注入后 supervisor 会跳过已完成阶段
   * @param options.history   历史对话消息，作为上下文提供给各 Agent
   */
  async run(
    input: string,
    options?: {
      existing?: Pick<AgentState, "prd" | "architecture" | "databaseDesign" | "prompts">
      history?: AgentState["messages"]
    }
  ): Promise<AgentState> {
    const history = options?.history ?? []
    const initialState: AgentState = {
      messages: [...history, { role: "user", content: input }],
      ...options?.existing,
    }

    const compiled = this.graph.compile()
    const result = await compiled.invoke(initialState)

    return result
  }

  /**
   * 流式运行编排。每个节点（supervisor/PM/架构/数据库/Prompt）执行完成后，
   * yield 一次该节点产出的状态增量，供上层推送 SSE 进度事件。
   *
   * 用法：
   *   for await (const step of orchestrator.stream(input, opts)) {
   *     // step = { agent: "PRODUCT_MANAGER", update: Partial<AgentState> }
   *   }
   * 迭代结束后可用 getStreamResult() 拿到累积的完整最终状态。
   *
   * @returns 异步迭代器，每步为 { agent, update }；agent 为触发本次增量的节点类型
   */
  async *stream(
    input: string,
    options?: {
      existing?: Pick<AgentState, "prd" | "architecture" | "databaseDesign" | "prompts">
      history?: AgentState["messages"]
    }
  ): AsyncGenerator<
    { agent: AgentType; update: Partial<AgentState> },
    AgentState,
    unknown
  > {
    const history = options?.history ?? []
    const initialState: AgentState = {
      messages: [...history, { role: "user", content: input }],
      ...options?.existing,
    }

    const compiled = this.graph.compile()

    // LangGraph 的 stream() 每完成一个节点 yield 一个 { [nodeName]: partialState }。
    // 节点名 → AgentType 映射，供前端展示。
    const nodeToAgent: Record<string, AgentType> = {
      supervisor: "SUPERVISOR",
      product_manager: "PRODUCT_MANAGER",
      architect: "ARCHITECT",
      database: "DATABASE",
      prompt: "PROMPT",
    }

    // 手动累积各通道最终值（stream 模式下不会自动返回聚合的终态）
    const finalState: AgentState = { ...initialState }
    const mergeMessages = (next?: AgentState["messages"]) => {
      if (next && next.length) {
        finalState.messages = [...(finalState.messages ?? []), ...next]
      }
    }

    const stream = await (compiled as any).stream(initialState)
    for await (const chunk of stream) {
      // chunk 形如 { product_manager: { messages: [...], prd: "..." } }
      for (const [nodeName, update] of Object.entries(chunk)) {
        const agent = nodeToAgent[nodeName]
        if (!agent) continue
        const partial = update as Partial<AgentState>

        // 累积到最终状态
        mergeMessages(partial.messages)
        if (partial.prd !== undefined) finalState.prd = partial.prd
        if (partial.architecture !== undefined) finalState.architecture = partial.architecture
        if (partial.databaseDesign !== undefined) finalState.databaseDesign = partial.databaseDesign
        if (partial.prompts !== undefined) {
          finalState.prompts = { ...(finalState.prompts ?? {}), ...partial.prompts }
        }
        if (partial.currentAgent !== undefined) finalState.currentAgent = partial.currentAgent

        yield { agent, update: partial }
      }
    }

    return finalState
  }
}

export const agentOrchestrator = new AgentOrchestrator()
