import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create default user (for development)
  const hashedPassword = await bcrypt.hash("password123", 10)

  const user = await prisma.user.upsert({
    where: { email: "admin@vibeforge.com" },
    update: {},
    create: {
      email: "admin@vibeforge.com",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      plan: "TEAM",
    },
  })

  console.log("✅ Created user:", user.email)

  // Note: Agents require AI Providers and Models to be set up first
  // Users should configure these through the UI after deployment

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
