import { NextRequest, NextResponse } from "next/server"
import { providerService } from "@/lib/services/provider.service"
import { requireUser } from "@/lib/session"
import { errorResponse } from "@/lib/api-utils"

/**
 * 校验 Provider 归属：返回 403/404 响应表示不通过，null 表示通过。
 */
async function assertOwnership(providerId: string, userId: string) {
  const ownerId = await providerService.getProviderOwner(providerId)
  if (ownerId === null) {
    return NextResponse.json({ error: "Provider 不存在" }, { status: 404 })
  }
  if (ownerId !== userId) {
    return NextResponse.json({ error: "无权访问该 Provider" }, { status: 403 })
  }
  return null
}

// GET /api/providers/[id] - Get provider details
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const denied = await assertOwnership(params.id, user.id)
    if (denied) return denied

    const provider = await providerService.getProviderById(params.id)
    if (!provider) {
      return NextResponse.json({ error: "Provider 不存在" }, { status: 404 })
    }

    // 不返回明文 API Key
    return NextResponse.json({
      ...provider,
      apiKey: "***" + provider.apiKey.slice(-4),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// PATCH /api/providers/[id] - Update provider
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const denied = await assertOwnership(params.id, user.id)
    if (denied) return denied

    const body = await req.json()
    const provider = await providerService.updateProvider(params.id, body)

    // provider.apiKey 是加密密文，不回显任何片段
    return NextResponse.json({
      ...provider,
      apiKey: "********",
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// DELETE /api/providers/[id] - Delete provider
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  try {
    const denied = await assertOwnership(params.id, user.id)
    if (denied) return denied

    await providerService.deleteProvider(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
