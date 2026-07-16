"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "assistant"
  content: string
  agentType?: string
}

export default function ProjectChatPage() {
  const params = useParams()
  const projectId = params.id as string

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProject()
    loadConversation()
  }, [projectId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadProject = async () => {
    const res = await fetch(`/api/projects/${projectId}`)
    const data = await res.json()
    setProject(data)
  }

  const loadConversation = async () => {
    const res = await fetch(`/api/projects/${projectId}/conversation`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          projectId,
        }),
      })

      const data = await res.json()

      if (data.result?.messages) {
        setMessages((prev) => [
          ...prev,
          ...data.result.messages.filter((m: Message) => m.role === "assistant"),
        ])
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      alert("发送消息失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#0B0E14]">
      {/* Sidebar */}
      <div className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-medium text-slate-400">项目</h2>
          <div className="text-slate-50 font-medium mt-1 truncate">
            {project?.name || "加载中..."}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-400 mb-2">生成的文档</div>
            <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">
              PRD 文档
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">
              技术架构
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">
              数据库设计
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">
              开发 Prompt
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <a
            href="/dashboard"
            className="block text-center px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-800 bg-[#0F172A] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-50">AI 需求分析</h1>
              <p className="text-sm text-slate-400 mt-0.5">描述你的想法，AI 将逐步帮你完善</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20">
                需求分析中
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">开始对话，描述你的项目想法</div>
                <div className="text-sm text-slate-500">
                  例如："我想做一个 AI 驱动的任务管理工具"
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                <div
                  className={`flex-1 max-w-2xl ${
                    msg.role === "user"
                      ? "bg-sky-500 text-white rounded-lg px-4 py-3"
                      : "bg-[#1E293B] border border-slate-700 rounded-lg px-4 py-3 text-slate-50"
                  }`}
                >
                  {msg.agentType && (
                    <div className="text-xs text-sky-400 mb-2 font-medium">
                      {msg.agentType.replace("_", " ")}
                    </div>
                  )}
                  <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-sky-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="bg-[#1E293B] border border-slate-700 rounded-lg px-4 py-3 text-slate-400">
                  AI 正在思考...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-slate-800 bg-[#0F172A] p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的想法或回答 AI 的问题..."
                className="flex-1 bg-[#1E293B] border border-slate-700 rounded-lg px-4 py-3 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                发送
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
