import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { DEFAULT_AGENTS } from "../src/lib/agents/prompts"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ── 1. 默认管理员账号 ──────────────────────────────────────────────
  const email = process.env.SEED_ADMIN_EMAIL || "admin@vibeforge.com"
  const password = process.env.SEED_ADMIN_PASSWORD || "password123"
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      plan: "TEAM",
    },
  })

  console.log(`✅ 管理员账号: ${user.email} (密码: ${password})`)

  // ── 2. 默认 Agent（需要已有 Provider + Model 才能绑定）───────────────
  // 找到任意一个可用模型作为默认绑定
  const anyModel = await prisma.model.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  })

  if (!anyModel) {
    console.log(
      "ℹ️  尚无 AI 模型，跳过 Agent 初始化。请先在后台添加 Provider 并同步模型，" +
        "然后在「Agent 配置」页点击『一键初始化默认 Agent』。"
    )
  } else {
    let created = 0
    for (const def of DEFAULT_AGENTS) {
      const exists = await prisma.agent.findFirst({ where: { type: def.type } })
      if (exists) continue
      await prisma.agent.create({
        data: {
          name: def.name,
          type: def.type,
          description: def.description,
          systemPrompt: def.systemPrompt,
          temperature: def.temperature,
          maxTokens: def.maxTokens,
          modelId: anyModel.id,
          isActive: true,
        },
      })
      created++
    }
    console.log(`✅ 初始化 ${created} 个默认 Agent（绑定模型: ${anyModel.displayName}）`)
  }

  console.log("🎉 Seeding completed!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
