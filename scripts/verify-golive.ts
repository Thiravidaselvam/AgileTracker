import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db   = new PrismaClient({ adapter: new PrismaPg(pool) } as any)

async function main() {
  const c = await db.goLiveChecklist.findUnique({
    where: { checklistId: "GLC-0001" },
    include: { items: { orderBy: [{ phase: "asc" }, { order: "asc" }] } },
  })
  if (!c) { console.log("NOT FOUND"); return }

  console.log(`\n=== ${c.checklistId}: ${c.title} ===`)
  console.log(`Project    : ${c.project}`)
  console.log(`Go-Live    : ${c.goLiveDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`)
  const days = Math.ceil((c.goLiveDate.getTime() - Date.now()) / 86400000)
  console.log(`Countdown  : ${days} days`)
  console.log(`Status     : ${c.status}`)
  console.log(`Total items: ${c.items.length}`)

  for (const ph of ["Pre-Cutover", "Cutover Day", "Post-Go-Live"]) {
    const its     = c.items.filter((i) => i.phase === ph)
    const done    = its.filter((i) => i.status === "Done" || i.status === "Skipped").length
    const blocked = its.filter((i) => i.status === "Blocked").length
    const cats    = [...new Set(its.map((i) => i.category))]
    console.log(`\n  [${ph}]  ${its.length} tasks | ${done} done | ${blocked} blocked | ${cats.length} categories`)
    cats.forEach((cat) => {
      const n = its.filter((i) => i.category === cat).length
      console.log(`    • ${cat}: ${n}`)
    })
  }

  const byStatus: Record<string, number> = {}
  c.items.forEach((i) => { byStatus[i.status] = (byStatus[i.status] ?? 0) + 1 })
  console.log(`\nStatus breakdown: ${JSON.stringify(byStatus)}`)

  const byPriority: Record<string, number> = {}
  c.items.forEach((i) => { byPriority[i.priority] = (byPriority[i.priority] ?? 0) + 1 })
  console.log(`Priority breakdown: ${JSON.stringify(byPriority)}`)

  const blocked = c.items.filter((i) => i.status === "Blocked")
  if (blocked.length) {
    console.log(`\nBlocked items:`)
    blocked.forEach((i) => console.log(`  ! [${i.phase}] ${i.task}\n    → ${i.remarks}`))
  }
}

main().catch(console.error).finally(() => pool.end())
