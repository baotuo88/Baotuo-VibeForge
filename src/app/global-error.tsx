"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0E14",
          color: "#f1f5f9",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 16 }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>应用发生严重错误</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24 }}>
            {error.message || "请刷新页面重试。"}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 16px",
              background: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            重试
          </button>
        </div>
      </body>
    </html>
  )
}
