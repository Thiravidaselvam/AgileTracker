import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as XLSX from "xlsx"

const SHEET_EMOJI: Record<string, string> = {
  Functional:  "⚡",
  Integration: "🔗",
  Unit:        "🧩",
  Structural:  "🏗️",
  Performance: "🚀",
  Api:         "🌐",
}

function col(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map(w => ({ wch: w }))
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const record = await db.testRunnerImport.findFirst({ orderBy: { importedAt: "desc" } })
  if (!record) return NextResponse.json({ error: "No import data found" }, { status: 404 })

  const summaryRows = record.summaryRows as any[]
  const rows        = record.rows        as any[]
  const sheets      = record.sheets      as any[]

  const wb = XLSX.utils.book_new()
  const importedAt = new Date(record.importedAt).toLocaleString()

  // ── 📋 Summary sheet ──
  const summaryHeaders = [
    "Module",
    "⚡ Functional Files", "⚡ Pass", "⚡ Fail",
    "🔗 Integration Files", "🔗 Pass", "🔗 Fail",
    "🧩 Unit Files", "🧩 Pass", "🧩 Fail",
    "🏗️ Structural Files", "🏗️ Pass", "🏗️ Fail",
    "🚀 Performance Files", "🚀 Pass", "🚀 Fail",
    "🌐 API Files", "🌐 Pass", "🌐 Fail",
    "Total Files", "Total Pass", "Total Fail", "Pass %",
    "Test Item Status", "DB Items Updated",
  ]

  const summaryData = [
    [`Test Runner Results — Exported ${importedAt}`, ...Array(summaryHeaders.length - 1).fill("")],
    summaryHeaders,
    ...summaryRows.map((m: any) => [
      m.module,
      m.functional?.files  ?? 0, m.functional?.pass  ?? 0, m.functional?.fail  ?? 0,
      m.integration?.files ?? 0, m.integration?.pass ?? 0, m.integration?.fail ?? 0,
      m.unit?.files        ?? 0, m.unit?.pass        ?? 0, m.unit?.fail        ?? 0,
      m.structural?.files  ?? 0, m.structural?.pass  ?? 0, m.structural?.fail  ?? 0,
      m.performance?.files ?? 0, m.performance?.pass ?? 0, m.performance?.fail ?? 0,
      m.api?.files         ?? 0, m.api?.pass         ?? 0, m.api?.fail         ?? 0,
      m.totalFiles ?? 0,
      m.totalPass  ?? 0,
      m.totalFail  ?? 0,
      m.pct        ?? "—",
      m.testItemStatus   ?? "—",
      m.testItemsUpdated ?? 0,
    ]),
    // Totals row
    (() => {
      const t = { files: 0, pass: 0, fail: 0 }
      for (const m of summaryRows) { t.files += m.totalFiles ?? 0; t.pass += m.totalPass ?? 0; t.fail += m.totalFail ?? 0 }
      const pct = t.files > 0 ? `${Math.round(t.pass / t.files * 100)}%` : "—"
      return ["TOTAL", ...Array(18).fill(""), t.files, t.pass, t.fail, pct, "", ""]
    })(),
  ]

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  col(summaryWs, [24, 16,8,8, 16,8,8, 10,8,8, 14,8,8, 14,8,8, 12,8,8, 12,12,12,8, 16,16])
  XLSX.utils.book_append_sheet(wb, summaryWs, "📋 Summary")

  // ── Per-sheet tabs ──
  const sheetLabels = sheets.map((s: any) => s.label as string)

  for (const label of sheetLabels) {
    const sheetRows = rows.filter((r: any) => r.sheet === label)
    const emoji = SHEET_EMOJI[label] ?? "📄"
    const sheetObj = sheets.find((s: any) => s.label === label)

    const pct   = sheetObj?.pct   ?? 0
    const pass  = sheetObj?.pass  ?? 0
    const fail  = sheetObj?.fail  ?? 0
    const files = sheetObj?.files ?? sheetRows.length
    const title = `${emoji} ${label} — ${files} files · ${pass} pass · ${fail} fail · ${pct}%`

    const dataRows = [
      [title, "", "", "", "", "", "", ""],
      ["#", "Module", "Test File", "Status", "Cases Pass", "Cases Fail", "Duration", "Failed Tests"],
      ...sheetRows.map((r: any, i: number) => [
        i + 1,
        r.module,
        r.testFile,
        r.status,
        r.casesPass,
        r.casesFail,
        r.duration,
        r.failedTests,
      ]),
    ]

    const ws = XLSX.utils.aoa_to_sheet(dataRows)
    col(ws, [4, 22, 40, 8, 12, 12, 12, 40])
    XLSX.utils.book_append_sheet(wb, ws, `${emoji} ${label}`)
  }

  const buf      = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  const dateStr  = new Date(record.importedAt).toISOString().slice(0, 10)
  const filename = `Test_Runner_Results_${dateStr}.xlsx`

  return new NextResponse(buf, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
