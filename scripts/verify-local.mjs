import bcrypt from "bcryptjs"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const res = await pool.query('SELECT email, role, "passwordHash" FROM "User" WHERE email = $1', ["thiravidaselvams@gmail.com"])

if (!res.rows.length) { console.log("User not found"); process.exit(1) }

const user = res.rows[0]
console.log("Email:", user.email, "| Role:", user.role)
console.log("Hash:", user.passwordHash.substring(0, 20) + "...")

const valid = await bcrypt.compare("Admin@123", user.passwordHash)
console.log("Password 'Admin@123' valid:", valid)
console.log("DATABASE_URL points to:", process.env.DATABASE_URL?.replace(/:([^@]+)@/, ":***@"))
await pool.end()
