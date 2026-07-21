"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Sparkles, User, Mail, Lock, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("密码至少 6 位")
      return
    }
    if (password !== confirm) {
      setError("两次密码不一致")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "注册失败")
      }

      // 自动登录
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      // 注册成功但自动登录失败：不要跳 dashboard（会被中间件弹回），引导去登录页
      if (signInRes?.error) {
        setError("注册成功，但自动登录失败，请手动登录")
        setLoading(false)
        router.push("/login")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

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
          <h2 className="text-lg font-semibold mb-1">创建账号</h2>
          <p className="text-xs text-slate-500 mb-5">开始使用 Baotuo VibeForge</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">姓名</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="你的名字"
                  className="w-full pl-9 pr-3 py-2 bg-[#0B0E14] border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  className="w-full pl-9 pr-3 py-2 bg-[#0B0E14] border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="再输入一遍"
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
              {loading ? "注册中..." : "注册"}
            </button>

            <div className="text-center text-xs text-slate-500 pt-2">
              已有账号?{" "}
              <Link href="/login" className="text-sky-400 hover:underline">
                去登录
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
