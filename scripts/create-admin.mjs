import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1) }

const pool    = new Pool({ connectionString: DATABASE_URL })
const adapter = new PrismaPg(pool)
const db      = new PrismaClient({ adapter })

const email    = "admin@agiletracker.com"
const password = "Admin@123"
const name     = "Admin"

async function main() {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`User ${email} already exists (role: ${existing.role})`)
    return
  }
  const hash = await bcrypt.hash(password, 12)
  const user = await db.user.create({
    data: { name, email, passwordHash: hash, role: "ADMIN" },
  })
  console.log(`✓ Admin user created:`)
  console.log(`  Email:    ${user.email}`)
  console.log(`  Password: ${password}`)
  console.log(`  Role:     ${user.role}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
