import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter: new PrismaPg(pool) })

const email = "thiravidaselvams@gmail.com"
const newPassword = "Admin@123"

const hash = await bcrypt.hash(newPassword, 12)
const user = await db.user.update({
  where: { email },
  data: { passwordHash: hash },
})
console.log(`Password reset for ${user.email} (role: ${user.role})`)
await db.$disconnect()
