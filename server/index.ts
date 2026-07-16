import Fastify from "fastify"
import cors from "@fastify/cors"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
})

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
})

// Health check
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() }
})

// API routes
fastify.get("/api/hello", async () => {
  return { message: "Baotuo-VibeForge API" }
})

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.API_PORT || "4000")
    await fastify.listen({ port, host: "0.0.0.0" })
    console.log(`🚀 Fastify server running on http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
