import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "后台管理 | Baotuo VibeForge",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
