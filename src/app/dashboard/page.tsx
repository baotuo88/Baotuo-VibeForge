export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-[#0B0E14]">
      <div className="flex-1 flex flex-col">
        <header className="border-b border-slate-800 bg-[#0F172A] px-6 py-4">
          <h1 className="text-xl font-semibold text-slate-50">Baotuo-VibeForge</h1>
          <p className="text-sm text-slate-400 mt-1">AI 软件架构师 + Vibe Coding Prompt 工厂</p>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-50 mb-2">开始你的项目</h2>
              <p className="text-slate-400">描述你的想法，AI 将帮你完成产品设计和技术规划</p>
            </div>

            <div className="bg-[#1E293B] rounded-lg border border-slate-700 p-6 mb-6">
              <h3 className="text-lg font-medium text-slate-50 mb-4">快速开始</h3>
              <div className="space-y-3">
                <a href="/projects/new" className="block p-4 bg-[#0F172A] hover:bg-[#1E293B] border border-slate-700 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-slate-50">创建新项目</div>
                      <div className="text-sm text-slate-400">从一个想法开始，AI 帮你规划一切</div>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            <div className="text-center text-slate-500 text-sm">
              尚未配置 AI Provider？<a href="/settings/providers" className="text-sky-400 hover:underline ml-1">前往设置</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
