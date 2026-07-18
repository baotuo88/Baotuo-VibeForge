"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Sparkles, Mail, Lock, Loader2 } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get("callbackUrl") || "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError("邮箱或密码错误")
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">邮箱</label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full pl-9 pr-3 py-2 bg-[#0B0E14] border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">密码</label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-9 pr-3 py-2 bg-[#0B0E14] border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "登录中..." : "登录"}
      </button>

      <div className="text-center text-xs text-slate-500 pt-2">
        还没有账号?{" "}
        <Link href="/register" className="text-sky-400 hover:underline">
          注册
        </Link>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0E14] text-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold">Baotuo VibeForge</h1>
          <p className="text-xs text-slate-500 mt-1">AI 软件架构师 + Prompt 工厂</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-1">登录</h2>
          <p className="text-xs text-slate-500 mb-5">使用邮箱和密码登录你的账户</p>

          <Suspense fallback={<div className="text-slate-500 text-sm">加载...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
