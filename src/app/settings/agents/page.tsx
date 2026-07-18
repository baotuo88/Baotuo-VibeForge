"use client"

import { useEffect, useState } from "react"
import { AppShell, PageHeader } from "@/components/app-shell"
import { Bot, Plus, Edit2, Trash2, Sparkles } from "lucide-react"

interface Model {
  id: string
  name: string
  displayName: string
  provider?: { name: string }
}

interface Agent {
  id: string
  name: string
  type: string
  description?: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  isActive: boolean
  modelId: string
  model?: Model
}

const AGENT_TYPES = [
  { value: "SUPERVISOR", label: "Supervisor - 总控编排" },
  { value: "PRODUCT_MANAGER", label: "Product Manager - 产品经理" },
  { value: "UI_UX_DESIGNER", label: "UI/UX Designer - 设计师" },
  { value: "ARCHITECT", label: "Architect - 架构师" },
  { value: "DATABASE", label: "Database - 数据库设计" },
  { value: "PROMPT", label: "Prompt - 提示词生成" },
]

const AGENT_TYPE_LABEL: Record<string, string> = AGENT_TYPES.reduce(
  (acc, t) => ({ ...acc, [t.value]: t.label.split(" - ")[1] }),
  {}
)

export default function AgentsSettingsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Agent | null>(null)

  const [form, setForm] = useState({
    name: "",
    type: "PRODUCT_MANAGER",
    description: "",
    systemPrompt: "",
    modelId: "",
    temperature: 0.7,
    maxTokens: 4000,
    isActive: true,
  })

  useEffect(() => {
    loadAgents()
    loadModels()
  }, [])

  async function loadAgents() {
    try {
      const res = await fetch("/api/agents")
      if (res.ok) setAgents(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadModels() {
    try {
      const res = await fetch("/api/models")
      if (res.ok) setModels(await res.json())
    } catch (e) {
      console.error(e)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm({
      name: "",
      type: "PRODUCT_MANAGER",
      description: "",
      systemPrompt: "",
      modelId: models[0]?.id || "",
      temperature: 0.7,
      maxTokens: 4000,
      isActive: true,
    })
    setShowModal(true)
  }

  function openEdit(a: Agent) {
    setEditing(a)
    setForm({
      name: a.name,
      type: a.type,
      description: a.description || "",
      systemPrompt: a.systemPrompt,
      modelId: a.modelId,
      temperature: a.temperature,
      maxTokens: a.maxTokens,
      isActive: a.isActive,
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const url = editing ? `/api/agents/${editing.id}` : "/api/agents"
    const method = editing ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setShowModal(false)
      await loadAgents()
    } else {
      const err = await res.json()
      alert(err.error || "保存失败")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该 Agent？")) return
    const res = await fetch(`/api/agents/${id}`, { method: "DELETE" })
    if (res.ok) await loadAgents()
  }

  return (
    <AppShell>
      <PageHeader
        title="Agent 配置"
        description="管理各类 Agent 的系统提示词、绑定模型与运行参数"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-md text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建 Agent
          </button>
        }
      />

      <div className="p-8">
        {loading ? (
          <div className="text-slate-500 text-sm">加载中...</div>
        ) : agents.length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-lg p-12 text-center">
            <Bot className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-slate-300 mb-1">尚未配置任何 Agent</div>
            <div className="text-slate-500 text-sm mb-4">
              为每个环节（PRD、架构、数据库、Prompt）配置专用 Agent
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建第一个 Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agents.map((a) => (
              <div
                key={a.id}
                className="bg-[#1E293B] border border-slate-700 rounded-lg p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {AGENT_TYPE_LABEL[a.type] || a.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(a)}
                      className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {a.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                    {a.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-700">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {a.model?.displayName || "未绑定模型"}
                  </span>
                  <span>temp {a.temperature}</span>
                  <span>{a.maxTokens} tokens</span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded text-[10px] ${
                      a.isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {a.isActive ? "启用" : "禁用"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] rounded-lg border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-medium">
                {editing ? "编辑 Agent" : "新建 Agent"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">名称</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-md px-3 py-2 text-sm"
                    placeholder="产品经理 Agent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">类型</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-md px-3 py-2 text-sm"
                  >
                    {AGENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  绑定模型
                </label>
                <select
                  required
                  value={form.modelId}
                  onChange={(e) => setForm({ ...form, modelId: e.target.value })}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">请选择模型</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.provider?.name ? `[${m.provider.name}] ` : ""}
                      {m.displayName}
                    </option>
                  ))}
                </select>
                {models.length === 0 && (
                  <div className="text-xs text-amber-400 mt-1">
                    尚未发现模型，请先在 Providers 页面添加并同步模型
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">描述</label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-md px-3 py-2 text-sm"
                  placeholder="简要说明该 Agent 的职责"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  系统提示词 (System Prompt)
                </label>
                <textarea
                  required
                  rows={8}
                  value={form.systemPrompt}
                  onChange={(e) =>
                    setForm({ ...form, systemPrompt: e.target.value })
                  }
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-md px-3 py-2 text-sm font-mono text-xs"
                  placeholder="你是一名资深产品经理..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Temperature
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={form.temperature}
                    onChange={(e) =>
                      setForm({ ...form, temperature: parseFloat(e.target.value) })
                    }
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={form.maxTokens}
                    onChange={(e) =>
                      setForm({ ...form, maxTokens: parseInt(e.target.value) })
                    }
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-slate-300 pb-2">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                      className="rounded"
                    />
                    启用
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-md text-sm font-medium"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
