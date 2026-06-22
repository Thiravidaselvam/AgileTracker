// Styled Excel export using ExcelJS (borders, fill colours, fonts).
// Used for the Manager Summary report sent to managers.

import { format } from "date-fns"

// ── colour palette ────────────────────────────────────────────────────────────
const C = {
  navyBg:    "FF1E3A5F",  // dark navy  – title rows
  blueBg:    "FF3B5BDB",  // indigo     – section headers / col headers
  lightBlue: "FFDBEAFE",  // pale blue  – KPI values row
  greenBg:   "FF166534",  // dark green – team delivery header
  lightGreen:"FFDCFCE7",  // pale green – team KPI labels
  redBg:     "FFFEF2F2",  // pale red   – risk row bg
  redText:   "FF991B1B",  // dark red   – risk row text
  white:     "FFFFFFFF",
  offWhite:  "FFF8FAFC",  // alternate row bg
  bodyText:  "FF1A1A1A",
  subText:   "FF374151",
  border:    "FFD1D5DB",  // thin border colour
  headerBd:  "FF1E3A5F",  // border around header cells
}

// ── border helpers ────────────────────────────────────────────────────────────

function thinBorder(color = C.border) {
  const s = { style: "thin" as const, color: { argb: color } }
  return { top: s, left: s, bottom: s, right: s }
}

function thickBorder() {
  const s = { style: "medium" as const, color: { argb: C.navyBg } }
  return { top: s, left: s, bottom: s, right: s }
}

// ── cell style factories ──────────────────────────────────────────────────────

function titleStyle() {
  return {
    font:      { name: "Calibri", bold: true, size: 14, color: { argb: C.white } },
    fill:      { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: C.navyBg } },
    alignment: { vertical: "middle" as const, horizontal: "left" as const, wrapText: false },
  }
}

function subTitleStyle() {
  return {
    font:      { name: "Calibri", size: 10, color: { argb: C.white } },
    fill:      { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: C.blueBg } },
    alignment: { vertical: "middle" as const, horizontal: "left" as const },
  }
}

function sectionHeaderStyle(fgColor = C.blueBg) {
  return {
    font:      { name: "Calibri", bold: true, size: 10, color: { argb: C.white } },
    fill:      { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: fgColor } },
    alignment: { vertical: "middle" as const, horizontal: "left" as const },
    border:    thinBorder(C.white),
  }
}

function colHeaderStyle(fgColor = C.navyBg) {
  return {
    font:      { name: "Calibri", bold: true, size: 9, color: { argb: C.white } },
    fill:      { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: fgColor } },
    alignment: { vertical: "middle" as const, horizontal: "center" as const, wrapText: true },
    border:    thinBorder(C.white),
  }
}

function kpiValueStyle() {
  return {
    font:      { name: "Calibri", bold: true, size: 13, color: { argb: C.navyBg } },
    fill:      { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: C.lightBlue } },
    alignment: { vertical: "middle" as const, horizontal: "center" as const },
    border:    thinBorder(C.border),
  }
}

function dataStyle(even = false, align: "left" | "center" | "right" = "left") {
  return {
    font:      { name: "Calibri", size: 9, color: { argb: C.bodyText } },
    fill:      { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: even ? C.offWhite : C.white } },
    alignment: { vertical: "top" as const, horizontal: align, wrapText: true },
    border:    thinBorder(C.border),
  }
}

function boldDataStyle(even = false) {
  return {
    font:      { name: "Calibri", bold: true, size: 9, color: { argb: C.navyBg } },
    fill:      { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: even ? C.offWhite : C.white } },
    alignment: { vertical: "middle" as const, horizontal: "center" as const, wrapText: true },
    border:    thinBorder(C.border),
  }
}

function riskStyle() {
  return {
    font:      { name: "Calibri", bold: true, italic: true, size: 9, color: { argb: C.redText } },
    fill:      { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: C.redBg } },
    alignment: { vertical: "middle" as const, horizontal: "left" as const, wrapText: true },
    border:    thinBorder("FFFCA5A5"),
  }
}

// ── apply style to a range of cells in a row ─────────────────────────────────

function styleRow(ws: any, rowNum: number, cols: number, style: any) {
  for (let c = 1; c <= cols; c++) {
    const cell = ws.getCell(rowNum, c)
    Object.assign(cell, style)
    if (style.font)      cell.font      = style.font
    if (style.fill)      cell.fill      = style.fill
    if (style.alignment) cell.alignment = style.alignment
    if (style.border)    cell.border    = style.border
  }
}

function styleCell(ws: any, rowNum: number, col: number, style: any) {
  const cell = ws.getCell(rowNum, col)
  if (style.font)      cell.font      = style.font
  if (style.fill)      cell.fill      = style.fill
  if (style.alignment) cell.alignment = style.alignment
  if (style.border)    cell.border    = style.border
}

// ── date formatter ────────────────────────────────────────────────────────────

function fd(d: any): string {
  if (!d) return "—"
  try { return format(new Date(d), "dd-MMM-yyyy") } catch { return "—" }
}

// ── trigger browser download ──────────────────────────────────────────────────

async function downloadXLSX(wb: any, filename: string) {
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const a   = document.createElement("a")
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Manager Summary Report ────────────────────────────────────────────────────

export async function exportManagerSummaryXLSX(report: any, preparedBy = "Project Team") {
  const ExcelJS = (await import("exceljs")).default

  const wb     = new ExcelJS.Workbook()
  wb.creator   = preparedBy
  wb.created   = new Date()

  const period    : string = report.period ?? ""
  const dateLabel : string = period.split("–")[0].trim()         // "18 Jun 2026"
  const titleDate : string = dateLabel.toUpperCase()             // "18 JUN 2026"

  const DONE_LC = ["completed","closed","resolved","fixed","done","passed","implemented"]
  const isDone  = (s: string) => DONE_LC.includes((s ?? "").toLowerCase())

  const issues   : any[] = report.issues         ?? []
  const resolved : any[] = report.resolvedIssues ?? []
  const reqs     : any[] = report.requirements   ?? []
  const closedR  : any[] = report.closedReqs     ?? []
  const testItems: any[] = report.testItems       ?? []
  const support  : any[] = report.supportTickets  ?? []
  const sum      : any   = report.summary         ?? {}

  // ── Team Delivery computation ─────────────────────────────────────────────
  // Source of truth = only items whose CREATION/OPEN date falls within the
  // selected date range (same data the individual sheets display).
  // "Done" means the item exists in the period AND its current status is a
  // completed state — NOT items closed from all-time that happened to be
  // updated this period (that would inflate counts from previous work).

  const ownerSet = new Set<string>()
  const addNames = (items: any[], nameOf: (r: any) => string) =>
    items.forEach(r => { const n = nameOf(r); if (n) ownerSet.add(n) })

  addNames(issues,    r => r.owner?.name ?? "")
  addNames(reqs,      r => r.owner?.name ?? "")
  addNames(testItems, r => r.testedBy    ?? "")
  addNames(support,   r => r.owner?.name ?? "")

  const teamRows = [...ownerSet].filter(Boolean).sort().map(name => {
    // Count only items OPENED/CREATED in the period that are now in a done state
    const bugsFixed = issues.filter(i    => i.owner?.name === name && isDone(i.status)).length
    const reqsDone  = reqs.filter(r      => r.owner?.name === name && isDone(r.status)).length
    const testsDone = testItems.filter(t => t.testedBy    === name && isDone(t.status)).length
    const suppDone  = support.filter(t   => t.owner?.name === name && isDone(t.status)).length
    const delivered = bugsFixed + reqsDone + testsDone + suppDone

    // Modules: unique modules from items created in the period for this owner
    const modSet = new Set<string>()
    issues.filter(i    => i.owner?.name === name).forEach(i => i.module && modSet.add(i.module))
    reqs.filter(r      => r.owner?.name === name).forEach(r => r.module && modSet.add(r.module))
    testItems.filter(t => t.testedBy    === name).forEach(t => t.module && modSet.add(t.module))
    support.filter(t   => t.owner?.name === name).forEach(t => t.product && modSet.add(t.product))

    return [name, delivered, bugsFixed, reqsDone, testsDone, [...modSet].join(", ")]
  })

  // ── Risk notes ───────────────────────────────────────────────────────────
  const blockingTests  = testItems.filter(t => !isDone(t.status) && /(blocking|blocked)/i.test(t.description ?? ""))
  const highOpenIssues = issues.filter(i  => !isDone(i.status) && (i.severity ?? "").toUpperCase() === "HIGH")
  const riskItems      = blockingTests.length ? blockingTests : highOpenIssues

  const riskText = riskItems.length
    ? riskItems.map((item: any) => {
        const id   = item.testId ?? item.issueId ?? ""
        const mod  = item.module ?? ""
        const desc = (item.description ?? "").replace(/^BLOCKING:\s*/i, "").trim()
        return `RISK: ${mod} — ${desc} (${id}). Escalation required.`
      }).join("  |  ")
    : "No escalations required."

  // ── KPI Snapshot — derived from the same in-period arrays used by each sheet ──
  // "Resolved / Closed" means: items OPENED in this period whose status is now done.
  // This is consistent with what the Issues / Requirements sheets display.
  // At-Risk is intentionally global (issues past due date across all time).
  const kpi = {
    issuesOpened  : issues.length,
    issuesResolved: issues.filter(i => isDone(i.status)).length,
    reqsOpened    : reqs.length,
    reqsClosed    : reqs.filter(r  => isDone(r.status)).length,
    openSupport   : support.filter(t => !isDone(t.status)).length,
    atRisk        : sum.atRiskCount ?? 0,
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 1 — Summary
  // ══════════════════════════════════════════════════════════════════════════
  {
    const ws = wb.addWorksheet("Summary")
    ws.columns = [
      { width: 26 }, { width: 16 }, { width: 13 },
      { width: 13 }, { width: 14 }, { width: 40 },
    ]
    const COLS = 6

    // Row 1 — main title
    ws.addRow([`AGILE PROGRESS REPORT — ${titleDate}`])
    ws.mergeCells(1, 1, 1, COLS)
    styleRow(ws, 1, COLS, titleStyle())
    ws.getRow(1).height = 32

    // Row 2 — period / prepared by
    ws.addRow([`Period: ${period}     |     Prepared by: ${preparedBy}`])
    ws.mergeCells(2, 1, 2, COLS)
    styleRow(ws, 2, COLS, subTitleStyle())
    ws.getRow(2).height = 18

    // Row 3 — spacer
    ws.addRow([])
    ws.getRow(3).height = 6

    // Row 4 — KPI section header
    ws.addRow(["KPI SNAPSHOT"])
    ws.mergeCells(4, 1, 4, COLS)
    styleRow(ws, 4, COLS, sectionHeaderStyle(C.blueBg))
    ws.getRow(4).height = 18

    // Row 5 — KPI column headers
    ws.addRow(["Issues Opened", "Issues Resolved", "Reqs Opened", "Reqs Closed", "Open Support", "At-Risk Items"])
    styleRow(ws, 5, COLS, colHeaderStyle())
    ws.getRow(5).height = 24

    // Row 6 — KPI values (all from in-period data, consistent with each sheet)
    ws.addRow([
      kpi.issuesOpened, kpi.issuesResolved,
      kpi.reqsOpened,   kpi.reqsClosed,
      kpi.openSupport,  kpi.atRisk,
    ])
    styleRow(ws, 6, COLS, kpiValueStyle())
    ws.getRow(6).height = 28

    // Row 7 — spacer
    ws.addRow([])
    ws.getRow(7).height = 8

    // Row 8 — Team Delivery section header
    ws.addRow(["TEAM DELIVERY SUMMARY"])
    ws.mergeCells(8, 1, 8, COLS)
    styleRow(ws, 8, COLS, sectionHeaderStyle(C.greenBg))
    ws.getRow(8).height = 18

    // Row 9 — Team column headers
    ws.addRow(["Owner", "Items Delivered", "Bugs Fixed", "Reqs Done", "Tests Fixed", "Modules"])
    styleRow(ws, 9, COLS, colHeaderStyle(C.greenBg))
    ws.getRow(9).height = 22

    // Rows 10+ — Team data
    teamRows.forEach((row, i) => {
      const r = ws.addRow(row)
      const even = i % 2 === 1
      r.height = 18
      // Owner col — bold left
      styleCell(ws, r.number, 1, boldDataStyle(even))
      ws.getCell(r.number, 1).alignment = { vertical: "middle", horizontal: "left" }
      // Numeric cols
      for (let c = 2; c <= 5; c++) styleCell(ws, r.number, c, boldDataStyle(even))
      // Modules col — normal left
      styleCell(ws, r.number, 6, dataStyle(even))
    })

    // Spacer row
    ws.addRow([])

    // Risk row
    const riskRowNum = ws.lastRow!.number + 1
    ws.addRow([riskText])
    ws.mergeCells(riskRowNum, 1, riskRowNum, COLS)
    styleRow(ws, riskRowNum, COLS, riskStyle())
    ws.getRow(riskRowNum).height = 22
  }

  // ══════════════════════════════════════════════════════════════════════════
  // helper: build a data sheet (Issues / Requirements / Test Items / Support)
  // ══════════════════════════════════════════════════════════════════════════

  function addDataSheet(
    name: string,
    title: string,
    headers: string[],
    rows: any[][],
    colWidths: number[],
  ) {
    const ws   = wb.addWorksheet(name)
    const COLS = headers.length
    ws.columns = colWidths.map(w => ({ width: w }))

    // Row 1 — title (merged)
    ws.addRow([title])
    ws.mergeCells(1, 1, 1, COLS)
    styleRow(ws, 1, COLS, titleStyle())
    ws.getRow(1).height = 26

    // Row 2 — column headers
    ws.addRow(headers)
    styleRow(ws, 2, COLS, colHeaderStyle())
    ws.getRow(2).height = 22

    // Data rows
    rows.forEach((rowData, i) => {
      const r    = ws.addRow(rowData)
      const even = i % 2 === 1
      r.height   = 15
      for (let c = 1; c <= COLS; c++) {
        styleCell(ws, r.number, c, dataStyle(even))
      }
    })

    // Freeze panes: keep header visible
    ws.views = [{ state: "frozen", ySplit: 2 }]
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 2 — Issues
  // ══════════════════════════════════════════════════════════════════════════
  addDataSheet(
    "Issues",
    `ISSUES — ${dateLabel}  (${issues.length} Raised | ${resolved.length} Resolved)`,
    ["ID", "Owner", "Reported By", "Description", "Severity", "Status", "Open Date"],
    issues.map((i: any, idx: number) => [
      `#${idx + 1}`,
      i.owner?.name ?? "—",
      i.reportedBy  ?? "—",
      i.description,
      i.severity,
      i.status,
      fd(i.openDate),
    ]),
    [8, 18, 18, 65, 10, 14, 14],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 3 — Requirements
  // ══════════════════════════════════════════════════════════════════════════
  addDataSheet(
    "Requirements",
    `REQUIREMENTS — ${dateLabel}  (${reqs.length} Opened | ${closedR.length} Done)`,
    ["Req ID", "Module", "Description", "Requestor", "Priority", "Status", "Owner"],
    reqs.map((r: any) => [
      r.reqId,
      r.module,
      r.requirement,
      r.requestor   ?? "—",
      r.priority,
      r.status,
      r.owner?.name ?? "—",
    ]),
    [12, 24, 65, 18, 10, 14, 18],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 4 — Test Items
  // ══════════════════════════════════════════════════════════════════════════
  addDataSheet(
    "Test Items",
    `TEST ITEMS — ${dateLabel}  (${testItems.length} Active)`,
    ["Test ID", "Module", "Sub Module", "Description", "Owner", "Priority", "Status"],
    testItems.map((t: any) => [
      t.testId,
      t.module,
      t.subModule ?? "—",
      t.description,
      t.testedBy  ?? "—",
      t.priority,
      t.status,
    ]),
    [16, 22, 28, 60, 18, 10, 14],
  )

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 5 — Support
  // ══════════════════════════════════════════════════════════════════════════
  const allClosed  = support.every(t => isDone(t.status))
  const suppStatus = support.length === 0
    ? "0 Tickets"
    : `${support.length} Ticket${support.length > 1 ? "s" : ""} | ${allClosed ? "All Closed" : `${support.filter(t => isDone(t.status)).length} Closed`}`

  addDataSheet(
    "Support",
    `SUPPORT TICKETS — ${dateLabel}  (${suppStatus})`,
    ["Customer", "Product", "Requirement", "Requestor", "Priority", "Status", "Owner"],
    support.map((t: any) => [
      t.customer,
      t.product,
      t.requirement,
      t.requestor   ?? "—",
      t.priority,
      t.status,
      t.owner?.name ?? "—",
    ]),
    [18, 18, 55, 18, 10, 14, 18],
  )

  // ── download ──────────────────────────────────────────────────────────────
  await downloadXLSX(wb, `Manager-Summary-Report-${dateLabel.replace(/\s/g, "-")}.xlsx`)
}
