"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import ReactMarkdown from "react-markdown"
import {
  FileText,
  Boxes,
  Database,
  Terminal,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  Bot,
  Download,
} from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  agentType?: string
}

interface Doc {
  id: string
  type: string
  title: string
  content: string
  version: number
  updatedAt: string
}

interface Prompt {
  id: string
  tool: string
  title: string
  content: string
  version: number
  createdAt: string
}

const DEV_TOOLS = [
  { value: "CLAUDE_CODE", label: "Claude Code" },
  { value: "CODEX", label: "Codex" },
  { value: "CURSOR", label: "Cursor" },
  { value: "WINDSURF", label: "Windsurf" },
  { value: "CLINE", label: "Cline" },
  { value: "CONTINUE", label: "Continue" },
  { value: "AIDER", label: "Aider" },
  { value: "LOVABLE", label: "Lovable" },
  { value: "BOLT", label: "Bolt" },
  { value: "REPLIT_AGENT", label: "Replit Agent" },
]

const DOC_META: Record<string, { label: string; icon: any }> = {
  PRD: { label: "PRD 文档", icon: FileText },
  ARCHITECTURE: { label: "技术架构", icon: Boxes },
  DATABASE: { label: "数据库设计", icon: Database },
}

type View = { kind: "chat" } | { kind: "doc"; type: string } | { kind: "prompts" }

export default function ProjectChatPage() {
  const params = useParams()
  const projectId = params.id as string

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [view, setView] = useState<View>({ kind: "chat" })
  const [copied, setCopied] = useState<string | null>(null)
  const [genTool, setGenTool] = useState("CLAUDE_CODE")
  const [generating, setGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProject()
    loadConversation()
    loadDocs()
    loadPrompts()
  }, [projectId])

  useEffect(() => {
    if (view.kind === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, view])

  const loadProject = async () => {
    const res = await fetch(`/api/projects/${projectId}`)
    if (res.ok) setProject(await res.json())
  }

  const loadConversation = async () => {
    const res = await fetch(`/api/projects/${projectId}/conversation`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages || [])
    }
  }

  const loadDocs = async () => {
    const res = await fetch(`/api/projects/${projectId}/documents`)
    if (res.ok) setDocs(await res.json())
  }

  const loadPrompts = async () => {
    const res = await fetch(`/api/projects/${projectId}/prompts`)
    if (res.ok) setPrompts(await res.json())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)
    setView({ kind: "chat" })

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, projectId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "运行失败")

      if (data.result?.messages) {
        setMessages((prev) => [
          ...prev,
          ...data.result.messages.filter((m: Message) => m.role === "assistant"),
        ])
      }
      // 刷新生成的文档与项目状态
      loadDocs()
      loadPrompts()
      loadProject()
    } catch (error: any) {
      console.error("Failed to send message:", error)
      alert(error.message || "发送消息失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const downloadText = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const generatePrompt = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: genTool }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "生成失败")
      await loadPrompts()
      setView({ kind: "prompts" })
    } catch (e: any) {
      alert(e.message || "生成失败")
    } finally {
      setGenerating(false)
    }
  }

  // 当前展示的文档
  const activeDoc =
    view.kind === "doc" ? docs.find((d) => d.type === view.type) : undefined

  const STATUS_LABEL: Record<string, string> = {
    DRAFT: "草稿",
    REQUIREMENT_ANALYSIS: "需求分析中",
    DESIGN: "设计中",
    ARCHITECTURE: "架构设计",
    READY: "就绪",
    IN_DEVELOPMENT: "开发中",
    COMPLETED: "已完成",
    ARCHIVED: "已归档",
  }

  return (
    <div className="flex h-screen bg-[#0B0E14] text-slate-100">
      {/* Sidebar */}
      <div className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            项目
          </h2>
          <div className="text-slate-50 font-medium mt-1 truncate">
            {project?.name || "加载中..."}
          </div>
          {project?.status && (
            <span className="inline-block mt-2 px-2 py-0.5 text-[10px] bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20">
              {STATUS_LABEL[project.status] || project.status}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <button
            onClick={() => setView({ kind: "chat" })}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              view.kind === "chat"
                ? "bg-sky-500/10 text-sky-400"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            对话
          </button>

          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide px-3 mb-1">
              生成的文档
            </div>
            {["PRD", "ARCHITECTURE", "DATABASE"].map((type) => {
              const meta = DOC_META[type]
              const Icon = meta.icon
              const has = docs.some((d) => d.type === type)
              const active = view.kind === "doc" && view.type === type
              return (
                <button
                  key={type}
                  onClick={() => has && setView({ kind: "doc", type })}
                  disabled={!has}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    active
                      ? "bg-sky-500/10 text-sky-400"
                      : has
                      ? "text-slate-300 hover:bg-slate-800"
                      : "text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {meta.label}
                  {!has && <span className="ml-auto text-[10px]">待生成</span>}
                </button>
              )
            })}
          </div>

          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide px-3 mb-1">
              开发 Prompt
            </div>
            <button
              onClick={() => setView({ kind: "prompts" })}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                view.kind === "prompts"
                  ? "bg-sky-500/10 text-sky-400"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Terminal className="w-4 h-4" />
              Prompt 库
              {prompts.length > 0 && (
                <span className="ml-auto text-[10px] bg-slate-700 px-1.5 rounded">
                  {prompts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <a
            href="/projects"
            className="block text-center px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            返回项目列表
          </a>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {view.kind === "chat" && (
          <ChatView
            messages={messages}
            loading={loading}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            messagesEndRef={messagesEndRef}
          />
        )}

        {view.kind === "doc" && activeDoc && (
          <DocView
            doc={activeDoc}
            copied={copied}
            onCopy={copyText}
            onDownload={downloadText}
          />
        )}

        {view.kind === "prompts" && (
          <PromptsView
            prompts={prompts}
            tools={DEV_TOOLS}
            genTool={genTool}
            setGenTool={setGenTool}
            generating={generating}
            onGenerate={generatePrompt}
            copied={copied}
            onCopy={copyText}
            onDownload={downloadText}
            hasDocs={docs.length > 0}
          />
        )}
      </div>
    </div>
  )
}

function ChatView({
  messages,
  loading,
  input,
  setInput,
  onSubmit,
  messagesEndRef,
}: any) {
  return (
    <>
      <div className="border-b border-slate-800 bg-[#0F172A] px-6 py-4">
        <h1 className="text-lg font-semibold">AI 需求分析</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          描述你的想法，AI 将逐步生成 PRD、架构、数据库设计与开发 Prompt
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <div className="text-slate-400 mb-2">开始对话，描述你的项目想法</div>
              <div className="text-sm text-slate-500">
                例如：&quot;我想做一个 AI 驱动的任务管理工具&quot;
              </div>
            </div>
          )}

          {messages.map((msg: Message, idx: number) => (
            <div
              key={idx}
              className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-sky-400" />
                </div>
              )}
              <div
                className={`flex-1 max-w-2xl ${
                  msg.role === "user"
                    ? "bg-sky-500 text-white rounded-lg px-4 py-3"
                    : "bg-[#1E293B] border border-slate-700 rounded-lg px-4 py-3"
                }`}
              >
                {msg.agentType && (
                  <div className="text-xs text-sky-400 mb-2 font-medium">
                    {msg.agentType.replace(/_/g, " ")}
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
                <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
              </div>
              <div className="bg-[#1E293B] border border-slate-700 rounded-lg px-4 py-3 text-slate-400">
                AI 正在思考...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-slate-800 bg-[#0F172A] p-4">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的想法或回答 AI 的问题..."
              className="flex-1 bg-[#1E293B] border border-slate-700 rounded-lg px-4 py-3 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
    </>
  )
}

function DocView({ doc, copied, onCopy, onDownload }: any) {
  return (
    <>
      <div className="border-b border-slate-800 bg-[#0F172A] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{doc.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">版本 v{doc.version}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onCopy(doc.id, doc.content)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            {copied === doc.id ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            复制
          </button>
          <button
            onClick={() => onDownload(`${doc.type}.md`, doc.content)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            <Download className="w-4 h-4" />
            下载
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <ReactMarkdown className="prose prose-invert max-w-none">
            {doc.content}
          </ReactMarkdown>
        </div>
      </div>
    </>
  )
}

function PromptsView({
  prompts,
  tools,
  genTool,
  setGenTool,
  generating,
  onGenerate,
  copied,
  onCopy,
  onDownload,
  hasDocs,
}: any) {
  return (
    <>
      <div className="border-b border-slate-800 bg-[#0F172A] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">开发 Prompt</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            为各 AI 编程工具生成可直接使用的开发指令
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={genTool}
            onChange={(e) => setGenTool(e.target.value)}
            className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
          >
            {tools.map((t: any) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            onClick={onGenerate}
            disabled={generating || !hasDocs}
            title={!hasDocs ? "请先通过对话生成文档" : ""}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-sky-500 hover:bg-sky-600 rounded-lg disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Terminal className="w-4 h-4" />
            )}
            生成
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {!hasDocs && (
            <div className="text-sm text-amber-400 bg-amber-500/10 rounded-lg px-4 py-3">
              尚无项目文档。请先在「对话」中描述需求，生成 PRD/架构/数据库设计后再生成 Prompt。
            </div>
          )}
          {prompts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Terminal className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              还没有生成任何 Prompt
            </div>
          ) : (
            prompts.map((p: Prompt) => (
              <div
                key={p.id}
                className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.tool}</span>
                    <span className="text-[10px] text-slate-500">v{p.version}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onCopy(p.id, p.content)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded"
                    >
                      {copied === p.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      复制
                    </button>
                    <button
                      onClick={() => onDownload(`${p.tool}.md`, p.content)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded"
                    >
                      <Download className="w-3 h-3" />
                      下载
                    </button>
                  </div>
                </div>
                <pre className="p-4 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono max-h-96">
                  {p.content}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
