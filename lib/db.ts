import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// Pool is kept on globalThis so it survives hot-reloads and is never GC'd
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; pgPool: Pool }

function createPrismaClient() {
  if (!globalForPrisma.pgPool) {
    const isLocal = process.env.DATABASE_URL?.includes("localhost") || process.env.DATABASE_URL?.includes("127.0.0.1")
    globalForPrisma.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
    })
  }
  const adapter = new PrismaPg(globalForPrisma.pgPool)
  return new PrismaClient({ adapter } as any)
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
