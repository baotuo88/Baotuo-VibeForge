"use client"

import Link from "next/link"
import { AppShell, PageHeader } from "@/components/app-shell"
import { Server, Cpu, Bot, KeyRound, Database, Shield } from "lucide-react"

const CARDS = [
  {
    href: "/admin/providers",
    icon: Server,
    title: "AI Providers",
    desc: "配置 OpenAI、Anthropic、DeepSeek 等 AI 服务商",
    color: "sky",
  },
  {
    href: "/admin/models",
    icon: Cpu,
    title: "模型管理",
    desc: "查看和管理已发现的 AI 模型",
    color: "violet",
  },
  {
    href: "/admin/agents",
    icon: Bot,
    title: "Agent 配置",
    desc: "自定义 Supervisor、产品经理、架构师等 Agent",
    color: "emerald",
  },
  {
    href: "/admin/keys",
    icon: KeyRound,
    title: "API 密钥",
    desc: "生成和管理平台 API Key（暂未启用）",
    color: "amber",
  },
  {
    href: "/admin/system",
    icon: Database,
    title: "系统信息",
    desc: "数据库、Redis、存储状态",
    color: "rose",
  },
  {
    href: "/admin/security",
    icon: Shield,
    title: "安全设置",
    desc: "加密密钥、访问控制（暂未启用）",
    color: "slate",
  },
]

const COLOR_MAP: Record<string, string> = {
  sky: "bg-sky-500/10 text-sky-400",
  violet: "bg-violet-500/10 text-violet-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  amber: "bg-amber-500/10 text-amber-400",
  rose: "bg-rose-500/10 text-rose-400",
  slate: "bg-slate-500/10 text-slate-400",
}

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        title="系统设置"
        description="管理 AI 服务商、模型、Agent 及系统配置"
      />
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
          {CARDS.map((c) => {
            const Icon = c.icon
            return (
              <Link
                key={c.href}
                href={c.href}
                className="group p-6 bg-[#1E293B] border border-slate-700 rounded-lg hover:border-sky-500/50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${COLOR_MAP[c.color]}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-medium text-slate-50 mb-1 group-hover:text-sky-400 transition-colors">
                  {c.title}
                </div>
                <div className="text-sm text-slate-400">{c.desc}</div>
              </Link>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
