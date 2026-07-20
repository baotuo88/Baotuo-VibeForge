import { NextRequest, NextResponse } from "next/server"
import { providerService } from "@/lib/services/provider.service"
import { requireUser } from "@/lib/session"
import { rateLimit, errorResponse } from "@/lib/api-utils"

// 外部模型发现可能较慢，给足处理时间（fetch 自身已有 10s 超时兜底）
export const maxDuration = 30

// POST /api/providers/[id]/discover - Discover models (需登录 + 归属校验)
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  // 限流：模型发现会调用外部 API，每用户每分钟最多 10 次
  const limited = await rateLimit(`discover:${user.id}`, 10, 60)
  if (limited) return limited

  try {
    // 归属校验：只能对自己的 Provider 发现模型
    const ownerId = await providerService.getProviderOwner(params.id)
    if (ownerId === null) {
      return NextResponse.json({ error: "Provider 不存在" }, { status: 404 })
    }
    if (ownerId !== user.id) {
      return NextResponse.json({ error: "无权访问该 Provider" }, { status: 403 })
    }

    const models = await providerService.discoverModels(params.id)

    return NextResponse.json({
      success: true,
      models,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
