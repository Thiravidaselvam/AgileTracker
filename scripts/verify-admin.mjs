import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db   = new PrismaClient({ adapter: new PrismaPg(pool) })

const user = await db.user.findUnique({ where: { email: "admin@agiletracker.com" } })
console.log("User found:", !!user)
if (user) {
  const valid = await bcrypt.compare("Admin@123", user.passwordHash)
  console.log("Password valid:", valid)
  console.log("Role:", user.role)
}
await db.$disconnect()
