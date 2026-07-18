import Link from "next/link"
import { AppShell, PageHeader } from "@/components/app-shell"
import { getCurrentUser } from "@/lib/session"
import { Plus, Sparkles, Server, Bot, FolderKanban } from "lucide-react"

interface QuickLink {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  color: string
  adminOnly?: boolean
}

const QUICK_LINKS: QuickLink[] = [
  {
    href: "/projects/new",
    icon: Plus,
    title: "创建新项目",
    desc: "从一个想法开始，AI 帮你规划一切",
    color: "sky",
  },
  {
    href: "/projects",
    icon: FolderKanban,
    title: "查看项目列表",
    desc: "回到你的项目工作区",
    color: "amber",
  },
  {
    href: "/admin/providers",
    icon: Server,
    title: "配置 AI Provider",
    desc: "接入 OpenAI / Anthropic / 自定义 API",
    color: "indigo",
    adminOnly: true,
  },
  {
    href: "/admin/agents",
    icon: Bot,
    title: "调整 Agent",
    desc: "编辑各阶段 Agent 的 System Prompt",
    color: "emerald",
    adminOnly: true,
  },
]

const COLORS: Record<string, string> = {
  sky: "bg-sky-500/10 text-sky-400",
  indigo: "bg-indigo-500/10 text-indigo-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  amber: "bg-amber-500/10 text-amber-400",
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const isAdmin = user?.role === "ADMIN"

  const links = QUICK_LINKS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <AppShell>
      <PageHeader
        title="工作台"
        description="AI 软件架构师 + Vibe Coding Prompt 工厂"
      />
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-50">开始你的项目</h2>
              <p className="text-slate-400 text-sm">
                描述你的想法，AI 将帮你完成 PRD、架构和 Prompt 生成
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block p-5 bg-[#1E293B] hover:bg-[#243244] border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${COLORS[item.color]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-50 group-hover:text-white">
                        {item.title}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {isAdmin && (
            <div className="mt-8 p-5 bg-[#1E293B]/50 border border-slate-800 rounded-lg text-sm text-slate-400">
              <div className="font-medium text-slate-300 mb-2">首次使用？</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>先在 <Link href="/admin/providers" className="text-sky-400 hover:underline">AI Providers</Link> 添加至少一个 API Key</li>
                <li>在 <Link href="/admin/models" className="text-sky-400 hover:underline">模型管理</Link> 拉取可用模型</li>
                <li>在 <Link href="/admin/agents" className="text-sky-400 hover:underline">Agent 配置</Link> 给每个 Agent 绑定模型</li>
                <li>回到工作台 <Link href="/projects/new" className="text-sky-400 hover:underline">创建项目</Link></li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
