"use client"

import { useState, useEffect } from "react"
import { AppShell, PageHeader } from "@/components/app-shell"
import { Cpu, RefreshCw, Eye, Wrench } from "lucide-react"

interface Model {
  id: string
  name: string
  displayName: string
  contextWindow?: number
  maxOutputTokens?: number
  supportsFunctions: boolean
  supportsVision: boolean
  isActive: boolean
  provider?: {
    id: string
    name: string
    type: string
  }
}

interface Provider {
  id: string
  name: string
  type: string
  models: Model[]
}

export default function ModelsPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [discovering, setDiscovering] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/providers")
      if (res.ok) {
        setProviders(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function discover(providerId: string) {
    setDiscovering(providerId)
    try {
      const res = await fetch(`/api/providers/${providerId}/discover`, {
        method: "POST",
      })
      if (res.ok) {
        await load()
      } else {
        const err = await res.json()
        alert(err.error || "模型发现失败")
      }
    } catch (e) {
      alert("请求失败")
    } finally {
      setDiscovering(null)
    }
  }

  async function toggleModel(modelId: string, active: boolean) {
    try {
      await fetch(`/api/models/${modelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      })
      await load()
    } catch (e) {
      console.error(e)
    }
  }

  const allModels = providers.flatMap((p) =>
    p.models.map((m) => ({ ...m, provider: { id: p.id, name: p.name, type: p.type } }))
  )

  const filteredModels =
    filter === "all"
      ? allModels
      : allModels.filter((m) => m.provider?.id === filter)

  return (
    <AppShell>
      <PageHeader
        title="模型管理"
        description="管理所有 Provider 下的可用模型，控制启用状态"
        actions={
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm border border-slate-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        }
      />

      <div className="p-8">
        {loading ? (
          <div className="text-slate-400 text-center py-16">加载中...</div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16">
            <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">还没有配置 AI Provider</p>
            <a
              href="/admin/providers"
              className="inline-block px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-sm"
            >
              前往添加 Provider
            </a>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs border ${
                  filter === "all"
                    ? "bg-sky-500/10 border-sky-500/50 text-sky-400"
                    : "bg-[#1E293B] border-slate-700 text-slate-400"
                }`}
              >
                全部 ({allModels.length})
              </button>
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setFilter(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs border ${
                    filter === p.id
                      ? "bg-sky-500/10 border-sky-500/50 text-sky-400"
                      : "bg-[#1E293B] border-slate-700 text-slate-400"
                  }`}
                >
                  {p.name} ({p.models.length})
                </button>
              ))}
            </div>

            {/* Provider quick actions */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#1E293B] border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      {p.type} · {p.models.length} 个模型
                    </div>
                  </div>
                  <button
                    onClick={() => discover(p.id)}
                    disabled={discovering === p.id}
                    className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs disabled:opacity-50 flex items-center gap-1"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${
                        discovering === p.id ? "animate-spin" : ""
                      }`}
                    />
                    {discovering === p.id ? "同步中" : "同步"}
                  </button>
                </div>
              ))}
            </div>

            {/* Models table */}
            <div className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#0F172A] text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">模型</th>
                    <th className="text-left px-4 py-3">Provider</th>
                    <th className="text-left px-4 py-3">上下文</th>
                    <th className="text-left px-4 py-3">能力</th>
                    <th className="text-left px-4 py-3">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredModels.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        暂无模型 · 点击 Provider 卡片上的"同步"按钮拉取
                      </td>
                    </tr>
                  ) : (
                    filteredModels.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{m.displayName}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            {m.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {m.provider?.name}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {m.contextWindow
                            ? `${(m.contextWindow / 1000).toFixed(0)}K`
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {m.supportsFunctions && (
                              <span
                                className="text-xs text-emerald-400"
                                title="Function Calling"
                              >
                                <Wrench className="w-3 h-3" />
                              </span>
                            )}
                            {m.supportsVision && (
                              <span
                                className="text-xs text-purple-400"
                                title="Vision"
                              >
                                <Eye className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.isActive}
                              onChange={(e) =>
                                toggleModel(m.id, e.target.checked)
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-sky-500 relative transition-colors">
                              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                            </div>
                            <span className="text-xs text-slate-400">
                              {m.isActive ? "启用" : "禁用"}
                            </span>
                          </label>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
