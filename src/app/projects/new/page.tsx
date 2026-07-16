"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewProjectPage() {
  const router = useRouter()
  const [idea, setIdea] = useState("")
  const [mode, setMode] = useState<"NORMAL" | "PROFESSIONAL">("NORMAL")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idea.trim()) return

    setLoading(true)

    try {
      // Create project
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: idea.slice(0, 50),
          initialIdea: idea,
          mode,
        }),
      })

      const project = await projectRes.json()

      // Redirect to chat
      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error("Failed to create project:", error)
      alert("创建项目失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">创建新项目</h1>
          <p className="text-slate-400">描述你的想法，AI 将帮你分析需求并生成专业文档</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              你的想法
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="例如：我想做一个 AI 小说创作平台，帮助作者使用 AI 完成小说创作..."
              className="w-full h-48 bg-[#1E293B] border border-slate-700 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              模式选择
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode("NORMAL")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === "NORMAL"
                    ? "border-sky-500 bg-sky-500/10"
                    : "border-slate-700 bg-[#1E293B] hover:border-slate-600"
                }`}
              >
                <div className="font-medium text-slate-50 mb-1">普通模式</div>
                <div className="text-sm text-slate-400">AI 自动分析并生成完整规划</div>
              </button>

              <button
                type="button"
                onClick={() => setMode("PROFESSIONAL")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === "PROFESSIONAL"
                    ? "border-sky-500 bg-sky-500/10"
                    : "border-slate-700 bg-[#1E293B] hover:border-slate-600"
                }`}
              >
                <div className="font-medium text-slate-50 mb-1">专业模式</div>
                <div className="text-sm text-slate-400">逐步访谈，深度需求分析</div>
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-[#1E293B] text-slate-300 rounded-lg border border-slate-700 hover:bg-[#2D3748] transition-colors"
            >
              返回
            </button>
            <button
              type="submit"
              disabled={loading || !idea.trim()}
              className="flex-1 px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? "创建中..." : "开始分析"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
