import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("请输入正确的邮箱"),
  password: z.string().min(6, "密码至少 6 位"),
  name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = parsed.data
    const normalizedEmail = email.toLowerCase()

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    // 第一个注册的用户自动设为 ADMIN
    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashed,
        name: name || normalizedEmail.split("@")[0],
        role: isFirstUser ? "ADMIN" : "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    )
  }
}
