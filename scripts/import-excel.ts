import * as XLSX from "xlsx"
import path from "path"
import { PrismaClient, Priority, Severity } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool    = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const db      = new PrismaClient({ adapter } as any)
const FILE    = path.resolve(__dirname, "../../Agile_Project_Tracker.xlsx")

// ── helpers ──────────────────────────────────────────────────────────────────

function toDate(v: any): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof v === "number") {
    // Excel serial date → JS Date (UTC)
    return new Date(Math.round((v - 25569) * 86400 * 1000))
  }
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

function toPriority(v: any): Priority {
  const s = (v ?? "").toString().toUpperCase()
  if (s === "HIGH") return "HIGH"
  if (s === "LOW")  return "LOW"
  return "MEDIUM"
}

function toSeverity(v: any): Severity {
  const s = (v ?? "").toString().toUpperCase()
  if (s === "HIGH") return "HIGH"
  if (s === "LOW")  return "LOW"
  return "MEDIUM"
}

// Strip honorific prefixes and trim: "Mrs. Dhanalakshmi" → "Dhanalakshmi"
function normalizeName(raw: any): string {
  if (!raw) return ""
  return raw.toString().trim().replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*/i, "").trim()
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Reading:", FILE)
  const wb = XLSX.readFile(FILE)

  // ── 1. CLEAR all existing data ────────────────────────────────────────────
  console.log("\nClearing existing data…")
  await db.progressLog.deleteMany({})
  await db.reportShare.deleteMany({})
  await db.testItem.deleteMany({})
  await db.requirement.deleteMany({})
  await db.issue.deleteMany({})
  await db.sprint.deleteMany({})
  await db.supportTicket.deleteMany({})
  await db.actionItem.deleteMany({})
  await db.user.deleteMany({})
  console.log("All data cleared.")

  // ── 2. Collect all unique owner/tester names from Excel ───────────────────
  const nameSet = new Set<string>()
  const addName = (v: any) => { const n = normalizeName(v); if (n) nameSet.add(n) }

  ;[
    ["Requirements Tracker", "Owner"],
    ["Issue Tracker",        "Owner"],
    ["Test Items Tracker",   "Owner"],
    ["Test Items Tracker",   "Tested By"],
    ["Support",              "Owner"],
    ["Action Item",          "Owner"],
  ].forEach(([sheet, col]) => {
    const ws = wb.Sheets[sheet]
    if (!ws) return
    XLSX.utils.sheet_to_json<any>(ws).forEach(r => addName(r[col]))
  })

  console.log("\nUnique people found:", [...nameSet].sort().join(", "))

  // ── 3. Create users ───────────────────────────────────────────────────────
  const hash    = await bcrypt.hash("admin123", 10)
  const userMap = new Map<string, string>()  // normalized name → DB id

  // Admin user (Thiravidam)
  const admin = await db.user.create({
    data: { name: "Thiravidam S", email: "thiravidaselvams@gmail.com", passwordHash: hash, role: "ADMIN" },
  })
  userMap.set("Thiravidam", admin.id)
  userMap.set("Thiravidam S", admin.id)
  console.log("Created admin:", admin.email)

  // Everyone else as MEMBER
  for (const name of nameSet) {
    if (userMap.has(name)) continue
    const slug  = name.toLowerCase().replace(/\s+/g, ".")
    const email = `${slug}@company.com`
    const user  = await db.user.create({
      data: { name, email, passwordHash: hash, role: "MEMBER" },
    })
    userMap.set(name, user.id)
    console.log("Created user:", name, "→", email)
  }

  // Helper: resolve owner name → DB id (fallback to admin)
  const resolve = (raw: any) => userMap.get(normalizeName(raw)) ?? admin.id

  // ── 4. Requirements Tracker ───────────────────────────────────────────────
  const reqs = XLSX.utils.sheet_to_json<any>(wb.Sheets["Requirements Tracker"])
  let reqCount = 0
  for (const row of reqs) {
    const reqId = row["Req ID"]?.toString().trim()
    if (!reqId || !row["Requirement"]) continue
    await db.requirement.upsert({
      where:  { reqId },
      update: {},
      create: {
        reqId,
        module:           row["Module/Menu"]    ?? "",
        requirement:      row["Requirement"]    ?? "",
        requestor:        row["Requestor"]      ?? "",
        priority:         toPriority(row["Priority"]),
        status:           row["Status"]         ?? "Open",
        createdDate:      toDate(row["Created Date"]) ?? new Date(),
        targetDate:       toDate(row["Target Date"]),
        actualCompletion: toDate(row["Actual Completion"]),
        remarks:          row["Remarks"]        ?? null,
        ownerId:          resolve(row["Owner"]),
      },
    })
    reqCount++
  }
  console.log(`\nImported ${reqCount} requirements`)

  // ── 5. Issue Tracker ──────────────────────────────────────────────────────
  const issues = XLSX.utils.sheet_to_json<any>(wb.Sheets["Issue Tracker"])
  let issueCount = 0
  for (const row of issues) {
    const issueId = row["Issue ID"]?.toString().trim()
    if (!issueId || !row["Issue Description"]) continue
    await db.issue.upsert({
      where:  { issueId },
      update: {},
      create: {
        issueId,
        description: row["Issue Description"] ?? "",
        severity:    toSeverity(row["Severity"]),
        reportedBy:  row["Reported By"]  ?? "",
        status:      row["Status"]       ?? "Open",
        openDate:    toDate(row["Open Date"]) ?? new Date(),
        dueDate:     toDate(row["Due Date"]),
        daysOpen:    Number(row["Days Open"] ?? 0),
        resolution:  row["Resolution"]   ?? null,
        ownerId:     resolve(row["Owner"]),
      },
    })
    issueCount++
  }
  console.log(`Imported ${issueCount} issues`)

  // ── 6. Test Items Tracker ─────────────────────────────────────────────────
  const tests = XLSX.utils.sheet_to_json<any>(wb.Sheets["Test Items Tracker"])
  let testCount = 0
  for (const row of tests) {
    const testId = row["Test ID"]?.toString().trim()
    if (!testId) continue
    await db.testItem.upsert({
      where:  { testId },
      update: {},
      create: {
        testId,
        module:      row["Module"]       ?? "",
        subModule:   row["Sub Module"]   ?? null,
        issueTitle:  row["Issue"]        ?? "",
        description: row["Description"] ?? "",
        testedBy:    normalizeName(row["Tested By"]) || "",
        priority:    toPriority(row["Priority"]),
        status:      row["Status"]       ?? "Open",
        createdDate: toDate(row["Created Date"]) ?? new Date(),
        targetDate:  toDate(row["Target Date"]),
        ownerId:     resolve(row["Owner"]),
      },
    })
    testCount++
  }
  console.log(`Imported ${testCount} test items`)

  // ── 7. Sprint Tracker ─────────────────────────────────────────────────────
  const sprintWs = wb.Sheets["Sprint Tracker"]
  let sprintCount = 0
  if (sprintWs) {
    const sprints = XLSX.utils.sheet_to_json<any>(sprintWs)
    for (const row of sprints) {
      const sprintName = row["Sprint"]?.toString().trim()
      const startDate  = toDate(row["Start Date"])
      const endDate    = toDate(row["End Date"])
      if (!sprintName || !startDate || !endDate) continue
      const planned   = Number(row["Planned Stories"]   ?? 0)
      const completed = Number(row["Completed Stories"] ?? 0)
      const velocity  = planned > 0 ? (completed / planned) * 100 : 0
      await db.sprint.upsert({
        where:  { sprintName },
        update: {},
        create: {
          sprintName,
          startDate,
          endDate,
          plannedStories:   planned,
          completedStories: completed,
          velocityPct:      velocity,
          sprintStatus:     row["Sprint Status"] ?? "Planning",
        },
      })
      sprintCount++
    }
  }
  console.log(`Imported ${sprintCount} sprints`)

  // ── 8. Support ────────────────────────────────────────────────────────────
  const supports = XLSX.utils.sheet_to_json<any>(wb.Sheets["Support"])
  let supCount = 0
  for (const row of supports) {
    if (!row["Customer"] || !row["Requirement"]) continue
    await db.supportTicket.create({
      data: {
        customer:         row["Customer"]    ?? "",
        product:          row["Product"]     ?? "",
        requirement:      row["Requirement"] ?? "",
        requestor:        row["Requestor"]   ?? "",
        priority:         toPriority(row["Priority"]),
        status:           row["Status"]      ?? "Open",
        createdDate:      toDate(row["Created Date"]) ?? new Date(),
        targetDate:       toDate(row["Target Date"]),
        actualCompletion: toDate(row["Actual Completion"]),
        remarks:          row["Remarks"]     ?? null,
        ownerId:          resolve(row["Owner"]),
      },
    })
    supCount++
  }
  console.log(`Imported ${supCount} support tickets`)

  // ── 9. Action Items ───────────────────────────────────────────────────────
  const actionWs = wb.Sheets["Action Item"]
  let actionCount = 0
  if (actionWs) {
    const actions = XLSX.utils.sheet_to_json<any>(actionWs)
    for (const row of actions) {
      if (!row["Description"] && !row["Type"]) continue
      await db.actionItem.create({
        data: {
          type:        row["Type"]        ?? "General",
          description: row["Description"] ?? "",
          status:      row["Status"]      ?? "Open",
          dueDate:     toDate(row["Due Date"]),
          ownerId:     resolve(row["Owner"]),
        },
      })
      actionCount++
    }
  }
  console.log(`Imported ${actionCount} action items`)

  console.log("\n✓ Import complete!")
  console.log("Login: thiravidaselvams@gmail.com / admin123")
}

main().catch(console.error).finally(() => db.$disconnect())
