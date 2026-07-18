import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"

export const metadata = {
  title: "后台管理 | Baotuo VibeForge",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?callbackUrl=/admin")
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard?error=admin_required")
  }

  return <>{children}</>
}
