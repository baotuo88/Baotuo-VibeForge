"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  Cpu,
  Server,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  section?: string
}

const NAV: NavItem[] = [
  { label: "工作台", href: "/dashboard", icon: LayoutDashboard, section: "主导航" },
  { label: "项目列表", href: "/projects", icon: FolderKanban, section: "主导航" },
  { label: "AI Providers", href: "/settings/providers", icon: Server, section: "后台管理" },
  { label: "模型管理", href: "/settings/models", icon: Cpu, section: "后台管理" },
  { label: "Agent 配置", href: "/settings/agents", icon: Bot, section: "后台管理" },
  { label: "系统设置", href: "/settings", icon: SettingsIcon, section: "后台管理" },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const sections = NAV.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.section || "其他"
    acc[key] = acc[key] || []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="flex h-screen bg-[#0B0E14] text-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#0F172A] flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">Baotuo VibeForge</div>
              <div className="text-[10px] text-slate-500">AI Prompt Factory</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section} className="mb-4">
              <div className="px-5 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {section}
              </div>
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-5 py-2 text-sm transition-colors ${
                      active
                        ? "bg-sky-500/10 text-sky-400 border-l-2 border-sky-400"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">
              U
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">开发用户</div>
              <div className="text-[10px] text-slate-500">FREE 计划</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="border-b border-slate-800 bg-[#0F172A] px-8 py-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>
        {actions}
      </div>
    </header>
  )
}
