"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AppShell, PageHeader } from "@/components/app-shell"
import { Plus, Trash2, RefreshCw, Edit3, CheckCircle2, XCircle } from "lucide-react"

interface Provider {
  id: string
  name: string
  type: string
  baseUrl?: string
  apiKey: string
  isActive: boolean
  models?: { id: string; name: string; displayName: string }[]
  createdAt: string
}

const PROVIDER_TYPES = [
  { value: "OPENAI", label: "OpenAI", defaultUrl: "https://api.openai.com/v1" },
  { value: "ANTHROPIC", label: "Anthropic", defaultUrl: "https://api.anthropic.com" },
  { value: "DEEPSEEK", label: "DeepSeek", defaultUrl: "https://api.deepseek.com/v1" },
  { value: "MOONSHOT", label: "Moonshot", defaultUrl: "https://api.moonshot.cn/v1" },
  { value: "ZHIPU", label: "智谱 AI", defaultUrl: "https://open.bigmodel.cn/api/paas/v4" },
  { value: "OPENROUTER", label: "OpenRouter", defaultUrl: "https://openrouter.ai/api/v1" },
  { value: "GOOGLE", label: "Google", defaultUrl: "" },
  { value: "CUSTOM", label: "自定义 (OpenAI 兼容)", defaultUrl: "" },
]

export default function ProvidersPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Provider | null>(null)
  const qc = useQueryClient()

  const { data: providers = [], isLoading } = useQuery<Provider[]>({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await fetch("/api/providers")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/providers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }),
  })

  const discoverMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/providers/${id}/discover`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to discover models")
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }),
  })

  return (
    <AppShell>
      <PageHeader
        title="AI Providers"
        description="配置和管理 OpenAI、Anthropic、DeepSeek 等 AI 服务商"
        actions={
          <button
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加 Provider
          </button>
        }
      />

      <div className="p-8">
        {isLoading ? (
          <div className="text-slate-400 text-sm">加载中...</div>
        ) : providers.length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-xl p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 mx-auto mb-4 flex items-center justify-center">
              <Plus className="w-6 h-6 text-sky-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">还没有配置 AI Provider</h3>
            <p className="text-sm text-slate-400 mb-6">
              添加 OpenAI、Anthropic 或任何 OpenAI 兼容 API 开始使用
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2 bg-sky-500 hover:bg-sky-400 rounded-lg text-sm font-medium"
            >
              添加第一个 Provider
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {providers.map((p) => (
              <div
                key={p.id}
                className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 font-semibold text-sm">
                      {p.type.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{p.name}</h3>
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            启用
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400">
                            <XCircle className="w-3 h-3" />
                            停用
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {p.type} · {p.baseUrl || "默认端点"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        API Key: <code className="text-slate-400">{p.apiKey}</code>
                      </div>
                      {p.models && p.models.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.models.slice(0, 5).map((m) => (
                            <span
                              key={m.id}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                            >
                              {m.displayName || m.name}
                            </span>
                          ))}
                          {p.models.length > 5 && (
                            <span className="text-[10px] px-2 py-0.5 text-slate-500">
                              +{p.models.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => discoverMut.mutate(p.id)}
                      disabled={discoverMut.isPending}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                      title="发现模型"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${discoverMut.isPending && discoverMut.variables === p.id ? "animate-spin" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(p)
                        setShowForm(true)
                      }}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`确定删除 "${p.name}"?`)) deleteMut.mutate(p.id)
                      }}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProviderForm
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["providers"] })
            setShowForm(false)
          }}
        />
      )}
    </AppShell>
  )
}

function ProviderForm({
  editing,
  onClose,
  onSaved,
}: {
  editing: Provider | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(editing?.name || "")
  const [type, setType] = useState(editing?.type || "OPENAI")
  const [baseUrl, setBaseUrl] = useState(editing?.baseUrl || "")
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleTypeChange = (t: string) => {
    setType(t)
    const found = PROVIDER_TYPES.find((p) => p.value === t)
    if (found && !editing) setBaseUrl(found.defaultUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const url = editing ? `/api/providers/${editing.id}` : "/api/providers"
      const method = editing ? "PATCH" : "POST"
      const body: any = { name, type, baseUrl }
      if (apiKey) body.apiKey = apiKey
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "保存失败")
      }
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold">
            {editing ? "编辑 Provider" : "添加 Provider"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="例如：我的 OpenAI"
              className="w-full px-3 py-2 bg-[#0B0E14] border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">类型</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              disabled={!!editing}
              className="w-full px-3 py-2 bg-[#0B0E14] border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-sky-500 disabled:opacity-60"
            >
              {PROVIDER_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              API 端点 (Base URL)
            </label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 bg-[#0B0E14] border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-sky-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              自定义网关（如 newapi、one-api）填写你的网关地址
            </p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              API Key {editing && <span className="text-slate-500">(留空则不修改)</span>}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required={!editing}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-[#0B0E14] border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-700 rounded-lg text-sm hover:bg-slate-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-400 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
