"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AppShell, PageHeader } from "@/components/app-shell"
import { Plus, FolderKanban, FileText, Wand2, Clock } from "lucide-react"

interface ProjectItem {
  id: string
  name: string
  description?: string | null
  status: string
  initialIdea?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    documents: number
    prompts: number
  }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  REQUIREMENT_ANALYSIS: { label: "需求分析", color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  DESIGN: { label: "设计中", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  ARCHITECTURE: { label: "架构设计", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  READY: { label: "就绪", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  IN_DEVELOPMENT: { label: "开发中", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  COMPLETED: { label: "已完成", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  ARCHIVED: { label: "归档", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(Array.isArray(data) ? data : [])
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <PageHeader
        title="项目列表"
        description="管理你在 VibeForge 中创建的所有项目"
        actions={
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建项目
          </Link>
        }
      />

      <div className="p-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-[#1E293B] border border-slate-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="max-w-md mx-auto mt-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
              <FolderKanban className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">还没有项目</h3>
            <p className="text-sm text-slate-400 mb-6">
              从一个想法开始，让 AI 帮你完成完整的产品和技术规划
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建第一个项目
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const status = STATUS_LABEL[project.status] || STATUS_LABEL.DRAFT
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block bg-[#1E293B] hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg p-5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-slate-50 truncate flex-1 pr-2">
                      {project.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded border ${status.color} shrink-0`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 line-clamp-2 mb-4 min-h-[40px]">
                    {project.initialIdea || project.description || "暂无描述"}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {project._count?.documents ?? 0} 文档
                    </span>
                    <span className="flex items-center gap-1">
                      <Wand2 className="w-3.5 h-3.5" />
                      {project._count?.prompts ?? 0} Prompt
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(project.updatedAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
