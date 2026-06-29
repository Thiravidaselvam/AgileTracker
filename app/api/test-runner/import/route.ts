import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as XLSX from "xlsx"

function sheetLabel(name: string): string {
  return name.replace(/[^\x20-\x7E]/g, "").trim()
}

function parseTitleStats(title: string): { files: number; pass: number; fail: number; pct: number } {
  const m = String(title).match(/(\d+)\s*files.*?(\d+)\s*pass.*?(\d+)\s*fail.*?(\d+)%/i)
  if (!m) return { files: 0, pass: 0, fail: 0, pct: 0 }
  return { files: Number(m[1]), pass: Number(m[2]), fail: Number(m[3]), pct: Number(m[4]) }
}

type TypeStats = { files: number; pass: number; fail: number }

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const clearFirst = form.get("clearFirst") === "true"
    let reset = 0
    if (clearFirst) {
      const r = await db.testItem.updateMany({ data: { status: "Open" } })
      reset = r.count
    }

    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array", cellDates: false })

    type SheetSummary = { name: string; label: string; files: number; pass: number; fail: number; pct: number }
    type TestRow = {
      sheet: string; module: string; testFile: string; status: string
      casesPass: number; casesFail: number; duration: string; failedTests: string
    }
    type SummaryRow = {
      module:      string
      functional:  TypeStats
      integration: TypeStats
      unit:        TypeStats
      structural:  TypeStats
      performance: TypeStats
      api:         TypeStats
      totalFiles:  number
      totalPass:   number
      totalFail:   number
      pct:         string
      testItemStatus:   string
      testItemsUpdated: number
    }

    const sheets: SheetSummary[]        = []
    const rows:   TestRow[]             = []
    let   rawSummaryRows: any[][]       = []

    // Per-module file pass/fail counts from sheets not covered by Summary pass/fail columns
    const structMap = new Map<string, TypeStats>()
    const perfMap   = new Map<string, TypeStats>()
    const apiMap    = new Map<string, TypeStats>()

    for (const sheetName of wb.SheetNames) {
      const label   = sheetLabel(sheetName)
      const ws      = wb.Sheets[sheetName]
      const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" })

      if (label.toLowerCase().includes("summary")) {
        rawSummaryRows = rawRows.slice(2) as any[][]
        continue
      }

      const titleStr = String(rawRows[0]?.[0] ?? "")
      if (titleStr.toLowerCase().includes("no results") || rawRows.length <= 2) continue

      const stats = parseTitleStats(titleStr)
      sheets.push({ name: sheetName, label, ...stats })

      const isStructural  = label.toLowerCase().includes("structural")
      const isPerformance = label.toLowerCase().includes("performance")
      const isApi         = label.toLowerCase().includes("api")

      for (let i = 2; i < rawRows.length; i++) {
        const r        = rawRows[i] as any[]
        const module   = String(r[1] ?? "").trim()
        const testFile = String(r[2] ?? "").trim()
        const status   = String(r[3] ?? "").trim().toUpperCase()
        if (!testFile && !module) continue

        const casesPass = Number(r[4] ?? 0)
        const casesFail = Number(r[5] ?? 0)

        rows.push({ sheet: label, module, testFile, status, casesPass, casesFail,
          duration: String(r[6] ?? "").trim(), failedTests: String(r[7] ?? "").trim() })

        // Count files (not cases) per module for Structural/Performance/API —
        // consistent with how Functional/Integration/Unit show file counts in the Summary sheet.
        if (isStructural || isPerformance || isApi) {
          const targetMap = isStructural ? structMap : isPerformance ? perfMap : apiMap
          const key = module.toLowerCase()
          const cur = targetMap.get(key) ?? { files: 0, pass: 0, fail: 0 }
          cur.files += 1
          if (status === "PASS") cur.pass += 1
          else                   cur.fail += 1
          targetMap.set(key, cur)
        }
      }
    }

    // Count files by status per module across ALL sheets (1 per row, based on STATUS column)
    const modMap = new Map<string, { pass: number; fail: number }>()
    for (const row of rows) {
      const key = row.module.toLowerCase()
      const cur = modMap.get(key) ?? { pass: 0, fail: 0 }
      if (row.status === "PASS") cur.pass += 1
      else                       cur.fail += 1
      modMap.set(key, cur)
    }

    // Update TestItems by module: Open if any file failed, Closed if all pass
    const dbUpdateMap = new Map<string, number>()   // key → rows updated
    let totalTestItemsUpdated = 0

    for (const [key, agg] of modMap.entries()) {
      const status = agg.fail > 0 ? "Open" : "Closed"
      const result = await db.testItem.updateMany({
        where: { module: { equals: key, mode: "insensitive" } },
        data:  { status },
      })
      dbUpdateMap.set(key, result.count)
      totalTestItemsUpdated += result.count
    }

    // Build summaryRows — totals auto-calculated from sheet data; Summary sheet pre-computed columns ignored
    const summaryRows: SummaryRow[] = rawSummaryRows
      .map(r => {
        const module = String(r[0] ?? "").trim()
        // Skip empty rows and the TOTAL footer row
        if (!module || module.toUpperCase() === "TOTAL") return null

        const key  = module.toLowerCase()
        const zero = { files: 0, pass: 0, fail: 0 }

        const functional  = { files: Number(r[1] ?? 0), pass: Number(r[2] ?? 0), fail: Number(r[3] ?? 0) }
        const integration = { files: Number(r[4] ?? 0), pass: Number(r[5] ?? 0), fail: Number(r[6] ?? 0) }
        const unit        = { files: Number(r[7] ?? 0), pass: Number(r[8] ?? 0), fail: Number(r[9] ?? 0) }
        const structural  = structMap.get(key) ?? zero
        const performance = perfMap.get(key)   ?? zero
        const api         = apiMap.get(key)    ?? zero

        // Auto-calculate totals from all type stats (not from Summary sheet cols 13-16)
        const totalFiles = functional.files + integration.files + unit.files + structural.files + performance.files + api.files
        const totalPass  = functional.pass  + integration.pass  + unit.pass  + structural.pass  + performance.pass  + api.pass
        const totalFail  = functional.fail  + integration.fail  + unit.fail  + structural.fail  + performance.fail  + api.fail
        const pctNum     = totalFiles > 0 ? Math.round((totalPass / totalFiles) * 100) : 0
        const pct        = totalFiles > 0 ? `${pctNum}%` : "—"
        const testItemStatus = totalFiles === 0 ? "—" : totalFail > 0 ? "Open" : "Closed"

        return {
          module,
          functional,
          integration,
          unit,
          structural,
          performance,
          api,
          totalFiles,
          totalPass,
          totalFail,
          pct,
          testItemStatus,
          testItemsUpdated: dbUpdateMap.get(key) ?? 0,
        } satisfies SummaryRow
      })
      .filter(Boolean) as SummaryRow[]

    // Persist full result — delete any previous record, keep only the latest import
    await db.testRunnerImport.deleteMany({})
    const saved = await db.testRunnerImport.create({
      data: {
        fileName:             file.name,
        reset,
        totalTestItemsUpdated,
        sheets:     sheets     as any,
        rows:       rows       as any,
        summaryRows: summaryRows as any,
      },
    })

    return NextResponse.json({
      ok: true, reset, sheets, rows, summaryRows, totalTestItemsUpdated,
      fileName:   saved.fileName,
      importedAt: saved.importedAt,
    })
  } catch (err: any) {
    console.error("[test-runner/import]", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

// Wipe stored import result (called when user clears test runner data)
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await db.testRunnerImport.deleteMany({})
  return NextResponse.json({ ok: true })
}

// Returns the latest stored import result (used on page mount to restore data after refresh)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const record = await db.testRunnerImport.findFirst({ orderBy: { importedAt: "desc" } })
    if (!record) return NextResponse.json({ ok: false, empty: true })

    return NextResponse.json({
      ok: true,
      reset:                record.reset,
      totalTestItemsUpdated: record.totalTestItemsUpdated,
      sheets:               record.sheets,
      rows:                 record.rows,
      summaryRows:          record.summaryRows,
      importedAt:           record.importedAt,
      fileName:             record.fileName,
    })
  } catch (err: any) {
    console.error("[test-runner/import GET]", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
