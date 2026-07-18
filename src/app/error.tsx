"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCw, Home } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 mx-auto mb-6 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-slate-50 mb-2">出错了</h1>
        <p className="text-sm text-slate-400 mb-6">
          {error.message || "页面加载时发生了意外错误，请重试。"}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            重试
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </a>
        </div>
      </div>
    </div>
  )
}
