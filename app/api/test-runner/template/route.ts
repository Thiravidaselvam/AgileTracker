import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

function makeTestSheet(title: string, rows: any[][]) {
  const headers = ["#", "Module", "Test File", "Status", "Cases Pass", "Cases Fail", "Duration", "Failed Tests"]
  const data = [
    [title, "", "", "", "", "", "", ""],
    headers,
    ...rows,
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws["!cols"] = [
    { wch: 4 }, { wch: 22 }, { wch: 40 }, { wch: 8 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 40 },
  ]
  return ws
}

export async function GET() {
  const wb = XLSX.utils.book_new()

  // ── 📋 Summary sheet ──
  const summaryHeaders = [
    "Module",
    "⚡ Functional\r\nFiles", "⚡ Pass", "⚡ Fail",
    "🔗 Integration\r\nFiles", "🔗 Pass", "🔗 Fail",
    "🧩 Unit\r\nFiles", "🧩 Pass", "🧩 Fail",
    "🏗️ Structural\r\nFiles",
    "🚀 Performance\r\nFiles",
    "🌐 API\r\nFiles",
    "Total Files", "Total Pass", "Total Fail", "Pass %",
  ]
  const summaryRows = [
    ["PapyrusBP — Test Suite Summary", ...Array(16).fill("")],
    summaryHeaders,
    ["Authentication", 3, 2, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 4, 3, 1, "75%"],
    ["Dashboard",      2, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 3, 3, 0, "100%"],
    ["Reports",        4, 3, 1, 1, 1, 0, 2, 2, 0, 0, 0, 0, 7, 6, 1, "86%"],
    ["TOTAL",          9, 7, 2, 1, 1, 0, 3, 3, 0, 1, 0, 0, 14, 12, 2, "86%"],
  ]
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows)
  summaryWs["!cols"] = [
    { wch: 22 },
    { wch: 12 }, { wch: 8 }, { wch: 8 },
    { wch: 12 }, { wch: 8 }, { wch: 8 },
    { wch: 10 }, { wch: 8 }, { wch: 8 },
    { wch: 14 }, { wch: 14 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
  ]
  XLSX.utils.book_append_sheet(wb, summaryWs, "📋 Summary")

  // ── ⚡ Functional ──
  XLSX.utils.book_append_sheet(wb, makeTestSheet(
    "⚡ Functional — 3 files · 2 pass · 1 fail · 67%",
    [
      [1, "Authentication", "login.test.ts",    "PASS", 5, 0, "120ms", ""],
      [2, "Authentication", "register.test.ts", "FAIL", 2, 1, "85ms",  "should validate email format"],
      [3, "Dashboard",      "dashboard.test.ts","PASS", 8, 0, "200ms", ""],
    ],
  ), "⚡ Functional")

  // ── 🔗 Integration ──
  XLSX.utils.book_append_sheet(wb, makeTestSheet(
    "🔗 Integration — 1 files · 1 pass · 0 fail · 100%",
    [
      [1, "Reports", "report-gen.test.ts", "PASS", 3, 0, "450ms", ""],
    ],
  ), "🔗 Integration")

  // ── 🧩 Unit ──
  XLSX.utils.book_append_sheet(wb, makeTestSheet(
    "🧩 Unit — 3 files · 3 pass · 0 fail · 100%",
    [
      [1, "Authentication", "auth.utils.test.ts",   "PASS", 12, 0, "30ms", ""],
      [2, "Dashboard",      "widget.unit.test.ts",  "PASS", 6,  0, "15ms", ""],
      [3, "Reports",        "formatter.test.ts",    "PASS", 9,  0, "25ms", ""],
    ],
  ), "🧩 Unit")

  // ── 🏗️ Structural ──
  XLSX.utils.book_append_sheet(wb, makeTestSheet(
    "🏗️ Structural — 1 files · 1 pass · 0 fail · 100%",
    [
      [1, "Dashboard", "dashboard.struct.test.ts", "PASS", 4, 0, "0ms", ""],
    ],
  ), "🏗️ Structural")

  // ── 🚀 Performance (no results) ──
  const perfWs = XLSX.utils.aoa_to_sheet([
    ["🚀 Performance — No Results"],
  ])
  XLSX.utils.book_append_sheet(wb, perfWs, "🚀 Performance")

  // ── 🌐 Api (no results) ──
  const apiWs = XLSX.utils.aoa_to_sheet([
    ["🌐 Api — No Results"],
  ])
  XLSX.utils.book_append_sheet(wb, apiWs, "🌐 Api")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buf, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Test Runner Template.xlsx"',
    },
  })
}
