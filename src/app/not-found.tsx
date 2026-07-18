import Link from "next/link"
import { Compass, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 mx-auto mb-6 flex items-center justify-center">
          <Compass className="w-8 h-8 text-sky-400" />
        </div>
        <h1 className="text-4xl font-bold text-slate-50 mb-2">404</h1>
        <p className="text-sm text-slate-400 mb-6">
          找不到你要访问的页面，它可能已被移动或删除。
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    </div>
  )
}
