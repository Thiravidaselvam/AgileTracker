import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import * as XLSX from "xlsx"
import bcrypt from "bcryptjs"

// ── helpers ──────────────────────────────────────────────────────────────────

function toDate(v: any): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400 * 1000))
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

function toPriority(v: any): "HIGH" | "MEDIUM" | "LOW" {
  const s = String(v ?? "").toUpperCase()
  if (s === "HIGH") return "HIGH"
  if (s === "LOW")  return "LOW"
  return "MEDIUM"
}

function toSeverity(v: any): "HIGH" | "MEDIUM" | "LOW" {
  const s = String(v ?? "").toUpperCase()
  if (s === "HIGH") return "HIGH"
  if (s === "LOW")  return "LOW"
  return "MEDIUM"
}

function normName(raw: any): string {
  if (!raw) return ""
  return String(raw).trim().replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*/i, "").trim()
}

// ── route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Admin only" }, { status: 403 })

  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const clearFirst = form.get("clearFirst") === "true"

    const arrayBuffer = await file.arrayBuffer()
    const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array", cellDates: false })

    const counts = { requirements: 0, issues: 0, testItems: 0, sprints: 0, support: 0, actionItems: 0, users: 0 }

    // ── Clear tracker data if requested ──────────────────────────────────────
    if (clearFirst) {
      await db.progressLog.deleteMany({})
      await db.reportShare.deleteMany({})
      await db.testItem.deleteMany({})
      await db.requirement.deleteMany({})
      await db.issue.deleteMany({})
      await db.sprint.deleteMany({})
      await db.supportTicket.deleteMany({})
      await db.actionItem.deleteMany({})
    }

    // ── Collect owner names from all sheets ──────────────────────────────────
    const nameSet = new Set<string>()
    const addNames = (sheetName: string, col: string) => {
      const ws = wb.Sheets[sheetName]
      if (!ws) return
      XLSX.utils.sheet_to_json<any>(ws).forEach(r => {
        const n = normName(r[col])
        if (n) nameSet.add(n)
      })
    }
    addNames("Requirements Tracker", "Owner")
    addNames("Issue Tracker",        "Owner")
    addNames("Test Items Tracker",   "Owner")
    addNames("Test Items Tracker",   "Tested By")
    addNames("Support",              "Owner")
    addNames("Action Item",          "Owner")

    // ── Resolve existing users, create missing ones ──────────────────────────
    const existingUsers = await db.user.findMany({ select: { id: true, name: true } })
    const userMap = new Map<string, string>()
    existingUsers.forEach(u => userMap.set(normName(u.name), u.id))

    const hash     = await bcrypt.hash("user123", 10)
    const callerId = (session.user as any).id as string

    for (const name of nameSet) {
      if (userMap.has(name)) continue
      const slug  = name.toLowerCase().replace(/\s+/g, ".")
      const email = `${slug}@company.com`
      const exists = await db.user.findUnique({ where: { email } })
      if (exists) { userMap.set(name, exists.id); continue }
      const u = await db.user.create({
        data: { name, email, passwordHash: hash, role: "MEMBER" },
      })
      userMap.set(name, u.id)
      counts.users++
    }

    const resolve = (raw: any): string | null => {
      const n = normName(raw)
      return n ? (userMap.get(n) ?? callerId) : callerId
    }

    // ── Requirements Tracker ─────────────────────────────────────────────────
    const reqWs = wb.Sheets["Requirements Tracker"]
    if (reqWs) {
      const rows = XLSX.utils.sheet_to_json<any>(reqWs)
      for (const row of rows) {
        const reqId = String(row["Req ID"] ?? "").trim()
        if (!reqId || !row["Requirement"] || reqId === "Req ID") continue
        await db.requirement.upsert({
          where:  { reqId },
          update: {
            module:           row["Module/Menu"]        ?? "",
            requirement:      row["Requirement"]        ?? "",
            requestor:        row["Requestor"]          ?? "",
            priority:         toPriority(row["Priority"]),
            status:           row["Status"]             ?? "Open",
            targetDate:       toDate(row["Target Date"]),
            actualCompletion: toDate(row["Actual Completion"]),
            remarks:          row["Remarks"]            ?? null,
            ownerId:          resolve(row["Owner"]),
          },
          create: {
            reqId,
            module:           row["Module/Menu"]        ?? "",
            requirement:      row["Requirement"]        ?? "",
            requestor:        row["Requestor"]          ?? "",
            priority:         toPriority(row["Priority"]),
            status:           row["Status"]             ?? "Open",
            createdDate:      toDate(row["Created Date"]) ?? new Date(),
            targetDate:       toDate(row["Target Date"]),
            actualCompletion: toDate(row["Actual Completion"]),
            remarks:          row["Remarks"]            ?? null,
            ownerId:          resolve(row["Owner"]),
          },
        })
        counts.requirements++
      }
    }

    // ── Issue Tracker ─────────────────────────────────────────────────────────
    const issueWs = wb.Sheets["Issue Tracker"]
    if (issueWs) {
      const rows = XLSX.utils.sheet_to_json<any>(issueWs)
      for (const row of rows) {
        const issueId = String(row["Issue ID"] ?? "").trim()
        if (!issueId || !row["Issue Description"] || issueId === "Issue ID") continue
        const openDate = toDate(row["Open Date"]) ?? new Date()
        await db.issue.upsert({
          where:  { issueId },
          update: {
            module:      String(row["Module"]            ?? ""),
            description: String(row["Issue Description"] ?? ""),
            severity:    toSeverity(row["Severity"]),
            reportedBy:  String(row["Reported By"]       ?? ""),
            status:      String(row["Status"]            ?? "Open"),
            dueDate:     toDate(row["Due Date"]),
            daysOpen:    Number(row["Days Open"]         ?? 0),
            resolution:  row["Resolution"]               ?? null,
            ownerId:     resolve(row["Owner"]),
          },
          create: {
            issueId,
            module:      String(row["Module"]            ?? ""),
            description: String(row["Issue Description"] ?? ""),
            severity:    toSeverity(row["Severity"]),
            reportedBy:  String(row["Reported By"]       ?? ""),
            status:      String(row["Status"]            ?? "Open"),
            openDate,
            dueDate:     toDate(row["Due Date"]),
            daysOpen:    Number(row["Days Open"]         ?? 0),
            resolution:  row["Resolution"]               ?? null,
            ownerId:     resolve(row["Owner"]),
          },
        })
        counts.issues++
      }
    }

    // ── Test Items Tracker ────────────────────────────────────────────────────
    const testWs = wb.Sheets["Test Items Tracker"]
    if (testWs) {
      const rows = XLSX.utils.sheet_to_json<any>(testWs)
      for (const row of rows) {
        const testId = String(row["Test ID"] ?? "").trim()
        if (!testId || testId === "Test ID") continue
        await db.testItem.upsert({
          where:  { testId },
          update: {
            module:      String(row["Module"]       ?? ""),
            subModule:   row["Sub Module"]          ?? null,
            issueTitle:  String(row["Issue"]        ?? ""),
            description: String(row["Description"]  ?? ""),
            testedBy:    normName(row["Tested By"]) || "",
            priority:    toPriority(row["Priority"]),
            status:      String(row["Status"]       ?? "Open"),
            targetDate:  toDate(row["Target Date"]),
            ownerId:     resolve(row["Owner"]),
          },
          create: {
            testId,
            module:      String(row["Module"]       ?? ""),
            subModule:   row["Sub Module"]          ?? null,
            issueTitle:  String(row["Issue"]        ?? ""),
            description: String(row["Description"]  ?? ""),
            testedBy:    normName(row["Tested By"]) || "",
            priority:    toPriority(row["Priority"]),
            status:      String(row["Status"]       ?? "Open"),
            createdDate: toDate(row["Created Date"]) ?? new Date(),
            targetDate:  toDate(row["Target Date"]),
            ownerId:     resolve(row["Owner"]),
          },
        })
        counts.testItems++
      }
    }

    // ── Sprint Tracker ────────────────────────────────────────────────────────
    const sprintWs = wb.Sheets["Sprint Tracker"]
    if (sprintWs) {
      const rows = XLSX.utils.sheet_to_json<any>(sprintWs)
      for (const row of rows) {
        const sprintName = String(row["Sprint"] ?? "").trim()
        const startDate  = toDate(row["Start Date"])
        const endDate    = toDate(row["End Date"])
        if (!sprintName || !startDate || !endDate || sprintName === "Sprint") continue
        const planned   = Number(row["Planned Stories"]   ?? 0)
        const completed = Number(row["Completed Stories"] ?? 0)
        const velocity  = planned > 0 ? (completed / planned) * 100 : 0
        await db.sprint.upsert({
          where:  { sprintName },
          update: { startDate, endDate, plannedStories: planned, completedStories: completed, velocityPct: velocity, sprintStatus: String(row["Sprint Status"] ?? "Planning") },
          create: { sprintName, startDate, endDate, plannedStories: planned, completedStories: completed, velocityPct: velocity, sprintStatus: String(row["Sprint Status"] ?? "Planning") },
        })
        counts.sprints++
      }
    }

    // ── Support ───────────────────────────────────────────────────────────────
    const suppWs = wb.Sheets["Support"]
    if (suppWs) {
      const rows = XLSX.utils.sheet_to_json<any>(suppWs)
      for (const row of rows) {
        if (!row["Customer"] || !row["Requirement"]) continue
        await db.supportTicket.create({
          data: {
            customer:         String(row["Customer"]          ?? ""),
            product:          String(row["Product"]           ?? ""),
            requirement:      String(row["Requirement"]       ?? ""),
            requestor:        String(row["Requestor"]         ?? ""),
            priority:         toPriority(row["Priority"]),
            status:           String(row["Status"]            ?? "Open"),
            createdDate:      toDate(row["Created Date"])     ?? new Date(),
            targetDate:       toDate(row["Target Date"]),
            actualCompletion: toDate(row["Actual Completion"]),
            remarks:          row["Remarks"]                  ?? null,
            ownerId:          resolve(row["Owner"]),
          },
        })
        counts.support++
      }
    }

    // ── Action Item ───────────────────────────────────────────────────────────
    const actionWs = wb.Sheets["Action Item"]
    if (actionWs) {
      const rows = XLSX.utils.sheet_to_json<any>(actionWs)
      for (const row of rows) {
        if (!row["Description"] && !row["Type"]) continue
        if (row["Type"] === "Type") continue
        await db.actionItem.create({
          data: {
            type:        String(row["Type"]        ?? "General"),
            description: String(row["Description"] ?? ""),
            status:      String(row["Status"]      ?? "Open"),
            dueDate:     toDate(row["Due Date"]),
            ownerId:     resolve(row["Owner"]),
          },
        })
        counts.actionItems++
      }
    }

    return NextResponse.json({
      ok: true,
      cleared: clearFirst,
      imported: counts,
      message: `Import complete. ${counts.requirements} requirements, ${counts.issues} issues, ${counts.testItems} test items, ${counts.sprints} sprints, ${counts.support} support tickets, ${counts.actionItems} action items. ${counts.users} new users created.`,
    })
  } catch (err: any) {
    console.error("[import-excel]", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
