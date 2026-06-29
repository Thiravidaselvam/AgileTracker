import * as XLSX from "xlsx"
import { format } from "date-fns"

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: any): string {
  if (!d) return "—"
  try { return format(new Date(d), "dd-MMM-yyyy") } catch { return "—" }
}

function blank(n: number): string[] { return Array(n).fill("") }

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

function countStatuses(items: any[]): string {
  const counts: Record<string, number> = {}
  items.forEach(i => { const s = i.status ?? "—"; counts[s] = (counts[s] ?? 0) + 1 })
  return Object.entries(counts).map(([s, c]) => `${s}: ${c}`).join("  |  ")
}

function ws(rows: any[][], widths: number[], merges?: { s: { r: number; c: number }; e: { r: number; c: number } }[]): XLSX.WorkSheet {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet["!cols"] = widths.map(w => ({ wch: w }))
  if (merges) sheet["!merges"] = merges
  return sheet
}

function save(wb: XLSX.WorkBook, name: string) {
  XLSX.writeFile(wb, name)
}

// ── owner grouping (shared with progress page logic) ─────────────────────────

function buildOwnerGroups(report: any) {
  const map = new Map<string, { reqs: any[]; issues: any[]; support: any[]; actions: any[] }>()
  const init = () => ({ reqs: [] as any[], issues: [] as any[], support: [] as any[], actions: [] as any[] })

  const add = (items: any[], field: "reqs" | "issues" | "support" | "actions", nameOf: (r: any) => string) =>
    (items ?? []).forEach(r => {
      const k = nameOf(r)
      if (!map.has(k)) map.set(k, init())
      ;(map.get(k)! as any)[field].push(r)
    })

  add(report.requirements   ?? [], "reqs",    r => r.owner?.name ?? "Unassigned")
  add(report.issues         ?? [], "issues",  r => r.owner?.name ?? "Unassigned")
  add(report.supportTickets ?? [], "support", r => r.owner?.name ?? "Unassigned")
  add(report.actionItems    ?? [], "actions", r => r.owner?.name ?? "Unassigned")

  return [...map.entries()]
    .map(([name, d]) => ({ name, ...d, total: d.reqs.length + d.issues.length + d.support.length + d.actions.length }))
    .filter(o => o.total > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ── Progress Report ──────────────────────────────────────────────────────────

export function exportProgressXLSX(report: any) {
  const wb = XLSX.utils.book_new()
  const C  = 8  // max columns

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const summaryRows: any[][] = [
    [`  Agile Progress Report   |   ${report.period}`, ...blank(C - 1)],
    [`  Module Status Summary + Period KPIs`, ...blank(C - 1)],
    blank(C),
    [`── KPI SUMMARY  (${report.period})`, ...blank(C - 1)],
    ["Issues Opened", "Issues Resolved", "Reqs Opened", "Reqs Closed", "Open Support", "At Risk", "Test Items", "Avg Velocity %"],
    [
      report.summary.openedIssues,
      report.summary.resolvedIssues,
      report.summary.openedReqs,
      report.summary.closedReqs,
      report.summary.openSupport,
      report.summary.atRiskCount,
      report.summary.totalTestItems,
      report.summary.avgVelocity,
    ],
    blank(C),
    [`── MODULE STATUS BREAKDOWN  (all-time)`, ...blank(C - 1)],
    ["Module", "Status", "Count", ...blank(C - 3)],
  ]

  const mods: [string, string][] = [
    ["Requirements", "requirements"],
    ["Issues", "issues"],
    ["Test Items", "testItems"],
    ["Support Tickets", "supportTickets"],
    ["Action Items", "actionItems"],
    ["Sprints", "sprints"],
  ]
  mods.forEach(([label, key]) => {
    const counts = report.statusSummary?.[key] ?? {}
    const entries = Object.entries(counts) as [string, number][]
    if (!entries.length) { summaryRows.push([label, "—", 0, ...blank(C - 3)]); return }
    entries.forEach(([status, count], i) => {
      summaryRows.push([i === 0 ? label : "", status, count, ...blank(C - 3)])
    })
    summaryRows.push(blank(C))
  })

  XLSX.utils.book_append_sheet(wb, ws(summaryRows,
    [30, 22, 10, 15, 15, 10, 12, 15],
    [
      { s: { r: 0, c: 0 }, e: { r: 0, c: C - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: C - 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: C - 1 } },
      { s: { r: 7, c: 0 }, e: { r: 7, c: C - 1 } },
    ]
  ), "Summary")

  // ── Sheet 2: Owner Progress ───────────────────────────────────────────────
  const ownerGroups = buildOwnerGroups(report)
  const ownerRows: any[][] = [
    [`  Owner-wise Progress   |   ${report.period}`, ...blank(5)],
    [`  Items created within the date range  —  ${ownerGroups.length} owners`, ...blank(5)],
    blank(6),
  ]
  ownerGroups.forEach(owner => {
    ownerRows.push([`  ${owner.name}  —  ${owner.total} items`, ...blank(5)])
    ownerRows.push(["Module", "Count", "Status Breakdown", ...blank(3)])
    if (owner.reqs.length)    ownerRows.push(["Requirements", owner.reqs.length,    countStatuses(owner.reqs),    ...blank(3)])
    if (owner.issues.length)  ownerRows.push(["Issues",       owner.issues.length,  countStatuses(owner.issues),  ...blank(3)])
    if (owner.support.length) ownerRows.push(["Support",      owner.support.length, countStatuses(owner.support), ...blank(3)])
    if (owner.actions.length) ownerRows.push(["Action Items", owner.actions.length, countStatuses(owner.actions), ...blank(3)])
    ownerRows.push(blank(6))
  })

  XLSX.utils.book_append_sheet(wb, ws(ownerRows, [32, 10, 60, 14, 14, 14]), "Owner Progress")

  // ── Sheet 3: Issues ───────────────────────────────────────────────────────
  const issuesByOwner = groupBy(report.issues ?? [], (i: any) => i.owner?.name ?? "Unassigned")
  const issueRows: any[][] = [
    [`  Issues in Period   |   ${report.period}`, ...blank(8)],
    [`  ${(report.issues ?? []).length} issues raised`, ...blank(8)],
    blank(9),
    ["", "ID", "Owner", "Reported By", "Description", "Severity", "Status", "Open Date", "Due Date"],
  ]
  Object.entries(issuesByOwner).forEach(([owner, items]) => {
    const fixed = items.filter(i => ["completed","closed","resolved"].includes((i.status ?? "").toLowerCase()))
    const open  = items.filter(i => !["completed","closed","resolved"].includes((i.status ?? "").toLowerCase()))
    issueRows.push(["", `  ${owner}  —  ${items.length} issues  |  ✅ ${fixed.length} Fixed  |  ⚠ ${open.length} Open`, ...blank(7)])
    items.forEach((i, idx) => {
      issueRows.push(["", `#${idx + 1}`, owner, i.reportedBy ?? "—", i.description, i.severity, i.status, fmtDate(i.openDate), fmtDate(i.dueDate)])
    })
    issueRows.push(blank(9))
  })

  XLSX.utils.book_append_sheet(wb, ws(issueRows,
    [3, 8, 18, 18, 55, 10, 14, 14, 14]
  ), "Issues")

  // ── Sheet 4: Requirements ─────────────────────────────────────────────────
  const reqRows: any[][] = [
    [`  Requirements in Period   |   ${report.period}`, ...blank(7)],
    [`  ${(report.requirements ?? []).length} requirements`, ...blank(7)],
    blank(8),
    ["Req ID", "Module", "Requirement", "Requestor", "Priority", "Status", "Owner", "Target Date"],
  ]
  ;(report.requirements ?? []).forEach((r: any) => {
    reqRows.push([r.reqId, r.module, r.requirement, r.requestor ?? "—", r.priority, r.status, r.owner?.name ?? "—", fmtDate(r.targetDate)])
  })
  XLSX.utils.book_append_sheet(wb, ws(reqRows, [12, 22, 55, 18, 10, 14, 18, 14]), "Requirements")

  // ── Sheet 5: Test Items ───────────────────────────────────────────────────
  const testRows: any[][] = [
    [`  Test Items in Period   |   ${report.period}`, ...blank(8)],
    [`  ${(report.testItems ?? []).length} test items`, ...blank(8)],
    blank(9),
    ["Test ID", "Module", "Sub Module", "Issue Title", "Tested By", "Priority", "Status", "Owner", "Target Date"],
  ]
  ;(report.testItems ?? []).forEach((t: any) => {
    testRows.push([t.testId, t.module, t.subModule ?? "—", t.issueTitle, t.testedBy ?? "—", t.priority, t.status, t.owner?.name ?? "—", fmtDate(t.targetDate)])
  })
  XLSX.utils.book_append_sheet(wb, ws(testRows, [12, 20, 16, 45, 18, 10, 14, 18, 14]), "Test Items")

  // ── Sheet 6: Support ──────────────────────────────────────────────────────
  const suppRows: any[][] = [
    [`  Support Tickets in Period   |   ${report.period}`, ...blank(7)],
    [`  ${(report.supportTickets ?? []).length} tickets`, ...blank(7)],
    blank(8),
    ["Customer", "Product", "Requirement", "Requestor", "Priority", "Status", "Owner", "Target Date"],
  ]
  ;(report.supportTickets ?? []).forEach((t: any) => {
    suppRows.push([t.customer, t.product, t.requirement, t.requestor ?? "—", t.priority, t.status, t.owner?.name ?? "—", fmtDate(t.targetDate)])
  })
  XLSX.utils.book_append_sheet(wb, ws(suppRows, [20, 20, 50, 18, 10, 14, 18, 14]), "Support")

  // ── Sheet 7: Action Items ─────────────────────────────────────────────────
  const actionRows: any[][] = [
    [`  Action Items in Period   |   ${report.period}`, ...blank(4)],
    [`  ${(report.actionItems ?? []).length} action items`, ...blank(4)],
    blank(5),
    ["Type", "Description", "Status", "Owner", "Due Date"],
  ]
  ;(report.actionItems ?? []).forEach((a: any) => {
    actionRows.push([a.type, a.description, a.status, a.owner?.name ?? "—", fmtDate(a.dueDate)])
  })
  XLSX.utils.book_append_sheet(wb, ws(actionRows, [20, 60, 14, 18, 14]), "Action Items")

  // ── Sheet 8: Sprints ──────────────────────────────────────────────────────
  const sprintRows: any[][] = [
    [`  Sprints in Period   |   ${report.period}`, ...blank(6)],
    blank(7),
    ["Sprint", "Start Date", "End Date", "Planned", "Completed", "Velocity %", "Status"],
  ]
  ;(report.sprints ?? []).forEach((s: any) => {
    sprintRows.push([s.sprintName, fmtDate(s.startDate), fmtDate(s.endDate), s.plannedStories, s.completedStories, `${Number(s.velocityPct).toFixed(0)}%`, s.sprintStatus])
  })
  XLSX.utils.book_append_sheet(wb, ws(sprintRows, [20, 14, 14, 10, 12, 12, 14]), "Sprints")

  save(wb, `Progress-Report-${(report.period ?? "").replace(/[^a-z0-9]/gi, "-")}.xlsx`)
}

// ── Daily Report ─────────────────────────────────────────────────────────────

export function exportDailyXLSX(report: any) {
  const wb   = XLSX.utils.book_new()
  const date = report.date ?? format(new Date(), "dd MMM yyyy")
  const generated = format(new Date(), "dd-MMM-yyyy HH:mm")

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const C = 6
  XLSX.utils.book_append_sheet(wb, ws([
    [`DAILY PROGRESS REPORT   |   ${date}`, ...blank(C - 1)],
    [`Generated: ${generated}`,             ...blank(C - 1)],
    blank(C),
    ["KPI SUMMARY",                         ...blank(C - 1)],
    ["Issues Updated", "Reqs Updated", "Tests Updated", "New Issues", "New Requirements", "Overdue Issues"],
    [
      report.summary.issuesUpdated  ?? 0,
      report.summary.reqsUpdated    ?? 0,
      report.summary.testsUpdated   ?? 0,
      report.summary.newIssues      ?? 0,
      report.summary.newRequirements?? 0,
      report.summary.overdueIssues  ?? 0,
    ],
  ], [22, 16, 16, 14, 20, 16],
  [
    { s: { r: 0, c: 0 }, e: { r: 0, c: C - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: C - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: C - 1 } },
  ]), "Summary")

  // ── Sheet 2: Issues Updated ───────────────────────────────────────────────
  const updIssues = report.details?.updatedIssues ?? []
  XLSX.utils.book_append_sheet(wb, ws([
    [`ISSUES UPDATED TODAY   |   ${date}`, ...blank(7)],
    [`Total: ${updIssues.length} issue${updIssues.length !== 1 ? "s" : ""}`, ...blank(7)],
    blank(8),
    ["#", "Issue ID", "Module", "Description", "Owner", "Status", "Severity", "Open Date", "Due Date"],
    ...updIssues.map((i: any, idx: number) => [
      idx + 1,
      i.issueId    ?? "—",
      i.module     ?? "—",
      i.description,
      i.owner?.name ?? "—",
      i.status,
      i.severity,
      fmtDate(i.openDate),
      fmtDate(i.dueDate),
    ]),
  ], [5, 12, 18, 55, 18, 14, 10, 14, 14],
  [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
  ]), "Issues Updated")

  // ── Sheet 3: Requirements Updated ─────────────────────────────────────────
  const updReqs = report.details?.updatedReqs ?? []
  XLSX.utils.book_append_sheet(wb, ws([
    [`REQUIREMENTS UPDATED TODAY   |   ${date}`, ...blank(6)],
    [`Total: ${updReqs.length} requirement${updReqs.length !== 1 ? "s" : ""}`, ...blank(6)],
    blank(7),
    ["#", "Req ID", "Module", "Requirement", "Owner", "Status", "Priority", "Target Date"],
    ...updReqs.map((r: any, idx: number) => [
      idx + 1,
      r.reqId    ?? "—",
      r.module   ?? "—",
      r.requirement,
      r.owner?.name ?? "—",
      r.status,
      r.priority ?? "—",
      fmtDate(r.targetDate),
    ]),
  ], [5, 12, 18, 55, 18, 14, 10, 14],
  [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
  ]), "Requirements Updated")

  // ── Sheet 4: Tests Updated ────────────────────────────────────────────────
  const updTests = report.details?.updatedTests ?? []
  XLSX.utils.book_append_sheet(wb, ws([
    [`TESTS UPDATED TODAY   |   ${date}`, ...blank(7)],
    [`Total: ${updTests.length} test item${updTests.length !== 1 ? "s" : ""}`, ...blank(7)],
    blank(8),
    ["#", "Test ID", "Module", "Issue Title", "Tested By", "Owner", "Status", "Priority", "Target Date"],
    ...updTests.map((t: any, idx: number) => [
      idx + 1,
      t.testId      ?? "—",
      t.module      ?? "—",
      t.issueTitle  ?? "—",
      t.testedBy    ?? "—",
      t.owner?.name ?? "—",
      t.status,
      t.priority    ?? "—",
      fmtDate(t.targetDate),
    ]),
  ], [5, 12, 18, 40, 18, 18, 14, 10, 14],
  [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
  ]), "Tests Updated")

  // ── Sheet 5: Overdue Issues ───────────────────────────────────────────────
  const overdue = report.details?.overdueIssues ?? []
  XLSX.utils.book_append_sheet(wb, ws([
    [`OVERDUE ISSUES   |   ${date}`, ...blank(7)],
    [`Total: ${overdue.length} overdue item${overdue.length !== 1 ? "s" : ""}`, ...blank(7)],
    blank(8),
    ["#", "Issue ID", "Module", "Description", "Severity", "Owner", "Status", "Open Date", "Due Date"],
    ...overdue.map((i: any, idx: number) => [
      idx + 1,
      i.issueId    ?? "—",
      i.module     ?? "—",
      i.description,
      i.severity,
      i.owner?.name ?? "—",
      i.status,
      fmtDate(i.openDate),
      fmtDate(i.dueDate),
    ]),
  ], [5, 12, 18, 50, 10, 18, 14, 14, 14],
  [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
  ]), "Overdue Issues")

  save(wb, `Daily-Report-${date.replace(/\s/g, "-")}.xlsx`)
}

// ── Weekly Report ─────────────────────────────────────────────────────────────

export function exportWeeklyXLSX(report: any) {
  const wb = XLSX.utils.book_new()
  const C  = 6

  XLSX.utils.book_append_sheet(wb, ws([
    [`  Weekly Progress Report   |   ${report.period}`, ...blank(C - 1)],
    blank(C),
    [`── KPI SUMMARY`, ...blank(C - 1)],
    ["Issues Opened", "Issues Resolved", "Reqs Opened", "Reqs Closed", "Open Support", "At Risk"],
    [report.summary.openedIssues, report.summary.resolvedIssues, report.summary.openedReqs,
     report.summary.closedReqs, report.summary.openSupport, report.summary.atRiskCount],
  ], [20, 18, 14, 14, 14, 10],
  [{ s: { r: 0, c: 0 }, e: { r: 0, c: C - 1 } }, { s: { r: 2, c: 0 }, e: { r: 2, c: C - 1 } }]
  ), "Weekly Summary")

  const sprints = report.sprints ?? []
  XLSX.utils.book_append_sheet(wb, ws([
    [`  Sprints This Week   |   ${report.period}`, ...blank(6)],
    blank(7),
    ["Sprint", "Start Date", "End Date", "Planned", "Completed", "Velocity %", "Status"],
    ...sprints.map((s: any) => [s.sprintName, fmtDate(s.startDate), fmtDate(s.endDate), s.plannedStories, s.completedStories, `${Number(s.velocityPct).toFixed(0)}%`, s.sprintStatus]),
  ], [20, 14, 14, 10, 12, 12, 14]), "Sprints")

  const atRisk = report.atRisk ?? []
  XLSX.utils.book_append_sheet(wb, ws([
    [`  At-Risk Issues   |   ${report.period}`, ...blank(2)],
    [`  ${atRisk.length} at-risk items`, ...blank(2)],
    blank(3),
    ["Severity", "Days Open", "Status"],
    ...atRisk.map((i: any) => [i.severity, i.daysOpen, i.status]),
  ], [14, 12, 14]), "At Risk")

  save(wb, `Weekly-Report-${(report.period ?? "").replace(/[^a-z0-9]/gi, "-")}.xlsx`)
}

// ── Monthly Report ────────────────────────────────────────────────────────────

export function exportMonthlyXLSX(report: any) {
  const wb = XLSX.utils.book_new()
  const C  = 6

  XLSX.utils.book_append_sheet(wb, ws([
    [`  Monthly Progress Report   |   ${report.period}`, ...blank(C - 1)],
    blank(C),
    [`── KPI SUMMARY`, ...blank(C - 1)],
    ["Issues Raised", "Issues Resolved", "Resolution Rate", "Reqs Opened", "Reqs Completed", "Avg Sprint Velocity"],
    [report.summary.totalIssues, report.summary.resolvedIssues, `${report.summary.resolutionRate}%`,
     report.summary.openedReqs, report.summary.closedReqs, `${report.summary.avgVelocity}%`],
  ], [20, 18, 16, 14, 18, 20],
  [{ s: { r: 0, c: 0 }, e: { r: 0, c: C - 1 } }, { s: { r: 2, c: 0 }, e: { r: 2, c: C - 1 } }]
  ), "Monthly Summary")

  const sprints = report.sprints ?? []
  XLSX.utils.book_append_sheet(wb, ws([
    [`  Sprint Summary   |   ${report.period}`, ...blank(4)],
    blank(5),
    ["Sprint", "Planned", "Completed", "Velocity %", "Status"],
    ...sprints.map((s: any) => [s.sprintName, s.plannedStories, s.completedStories, `${Number(s.velocityPct).toFixed(0)}%`, s.sprintStatus]),
  ], [24, 10, 12, 12, 14]), "Sprints")

  const tickets = report.supportTickets ?? []
  XLSX.utils.book_append_sheet(wb, ws([
    [`  Support Tickets This Month   |   ${report.period}`, ...blank(4)],
    [`  ${tickets.length} tickets`, ...blank(4)],
    blank(5),
    ["Customer", "Product", "Requirement", "Owner", "Status"],
    ...tickets.map((t: any) => [t.customer, t.product, t.requirement, t.owner?.name ?? "—", t.status]),
  ], [20, 20, 50, 18, 14]), "Support Tickets")

  save(wb, `Monthly-Report-${(report.period ?? "").replace(/[^a-z0-9]/gi, "-")}.xlsx`)
}

// NOTE: exportManagerSummaryXLSX is in export-xlsx-styled.ts (uses ExcelJS for borders/colours)
// ── Manager Summary Report (legacy un-styled — kept for reference, not exported) ──
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _exportManagerSummaryUnstyledLegacy

(report: any, preparedBy = "Project Team") {
  const wb   = XLSX.utils.book_new()
  const period: string = report.period ?? ""

  // Normalise the period string into a short date label (first date only)
  // e.g. "18 Jun 2026 – 18 Jun 2026" → "18 Jun 2026"
  const dateLabel = period.split("–")[0].trim()
  const titleDate = dateLabel.toUpperCase()   // "18 JUN 2026"

  // ── helpers ──────────────────────────────────────────────────────────────────
  const DONE_LC = ["completed","closed","resolved","fixed","done","passed","implemented"]
  const isDone  = (s: string) => DONE_LC.includes((s ?? "").toLowerCase())

  const issues   : any[] = report.issues          ?? []
  const resolved : any[] = report.resolvedIssues  ?? []
  const reqs     : any[] = report.requirements    ?? []
  const closedR  : any[] = report.closedReqs      ?? []
  const testItems: any[] = report.testItems        ?? []
  const support  : any[] = report.supportTickets   ?? []
  const sum      : any   = report.summary          ?? {}

  // ── Team Delivery Summary ────────────────────────────────────────────────────
  // Collect unique owner names across all modules
  const ownerSet = new Set<string>()
  const addNames = (items: any[], nameOf: (r: any) => string) =>
    items.forEach(r => { const n = nameOf(r); if (n && n !== "Unassigned") ownerSet.add(n) })

  addNames(resolved,               r => r.owner?.name ?? "")
  addNames(closedR,                r => r.owner?.name ?? "")
  addNames(testItems.filter(t => isDone(t.status)), r => r.testedBy ?? "")
  addNames(support.filter(t => isDone(t.status)),   r => r.owner?.name ?? "")

  const teamRows: any[][] = []
  ;[...ownerSet].sort().forEach(name => {
    const bugsFixed   = resolved.filter(i  => i.owner?.name === name).length
    const reqsDone    = closedR.filter(r   => r.owner?.name === name).length
    const testsDone   = testItems.filter(t => isDone(t.status) && t.testedBy === name).length
    const suppDone    = support.filter(t   => isDone(t.status) && t.owner?.name === name).length
    const delivered   = bugsFixed + reqsDone + testsDone + suppDone

    // Unique modules this owner touched
    const modSet = new Set<string>()
    issues.filter(i  => i.owner?.name === name).forEach(i  => i.module  && modSet.add(i.module))
    resolved.filter(i => i.owner?.name === name).forEach(i  => i.module  && modSet.add(i.module))
    reqs.filter(r    => r.owner?.name === name).forEach(r  => r.module  && modSet.add(r.module))
    closedR.filter(r => r.owner?.name === name).forEach(r  => r.module  && modSet.add(r.module))
    testItems.filter(t => t.testedBy === name).forEach(t   => t.module  && modSet.add(t.module))

    teamRows.push([name, delivered, bugsFixed, reqsDone, testsDone, [...modSet].join(", ")])
  })

  // ── Risk notes ───────────────────────────────────────────────────────────────
  // 1) Test items with "BLOCKING" or "blocked" in description that are still open
  const blockingTests = testItems.filter(t =>
    !isDone(t.status) && /(blocking|blocked)/i.test(t.description ?? "")
  )
  // 2) HIGH severity open issues as fallback
  const highOpenIssues = issues.filter(i =>
    !isDone(i.status) && (i.severity ?? "").toUpperCase() === "HIGH"
  )
  const riskItems = blockingTests.length > 0 ? blockingTests : highOpenIssues

  const riskLines = riskItems.length > 0
    ? riskItems.map((item: any) => {
        const id   = item.testId ?? item.issueId ?? ""
        const mod  = item.module ?? ""
        const desc = (item.description ?? "").replace(/^BLOCKING:\s*/i, "").trim()
        return `RISK: ${mod} — ${desc} (${id}). Escalation required.`
      }).join("  |  ")
    : "No escalations required."

  // ── Sheet 1: Summary ────────────────────────────────────────────────────────
  const C = 6
  const summaryRows: any[][] = [
    [`AGILE PROGRESS REPORT — ${titleDate}`, ...blank(C - 1)],
    [`Period: ${period}     |     Prepared by: ${preparedBy}`,  ...blank(C - 1)],
    blank(C),
    ["KPI SNAPSHOT", ...blank(C - 1)],
    ["Issues Opened", "Issues Resolved", "Reqs Opened", "Reqs Closed", "Open Support", "At-Risk Items"],
    [sum.openedIssues ?? 0, sum.resolvedIssues ?? 0, sum.openedReqs ?? 0, sum.closedReqs ?? 0, sum.openSupport ?? 0, sum.atRiskCount ?? 0],
    blank(C),
    ["TEAM DELIVERY SUMMARY", ...blank(C - 1)],
    ["Owner", "Items Delivered", "Bugs Fixed", "Reqs Done", "Tests Fixed", "Modules"],
    ...teamRows,
    blank(C),
    [riskLines, ...blank(C - 1)],
  ]

  const riskRow = summaryRows.length - 1
  XLSX.utils.book_append_sheet(wb, ws(
    summaryRows,
    [28, 16, 12, 12, 14, 38],
    [
      { s: { r: 0, c: 0 }, e: { r: 0, c: C - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: C - 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: C - 1 } },
      { s: { r: 7, c: 0 }, e: { r: 7, c: C - 1 } },
      { s: { r: riskRow, c: 0 }, e: { r: riskRow, c: C - 1 } },
    ]
  ), "Summary")

  // ── Sheet 2: Issues ──────────────────────────────────────────────────────────
  const C2 = 7
  XLSX.utils.book_append_sheet(wb, ws([
    [`ISSUES — ${dateLabel}  (${issues.length} Raised | ${resolved.length} Resolved)`, ...blank(C2 - 1)],
    ["ID", "Owner", "Reported By", "Description", "Severity", "Status", "Open Date"],
    ...issues.map((i: any, idx: number) => [
      `#${idx + 1}`,
      i.owner?.name  ?? "—",
      i.reportedBy   ?? "—",
      i.description,
      i.severity,
      i.status,
      fmtDate(i.openDate),
    ]),
  ], [8, 18, 18, 65, 10, 14, 14],
  [{ s: { r: 0, c: 0 }, e: { r: 0, c: C2 - 1 } }]
  ), "Issues")

  // ── Sheet 3: Requirements ────────────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb, ws([
    [`REQUIREMENTS — ${dateLabel}  (${reqs.length} Opened | ${closedR.length} Done)`, ...blank(C2 - 1)],
    ["Req ID", "Module", "Description", "Requestor", "Priority", "Status", "Owner"],
    ...reqs.map((r: any) => [
      r.reqId,
      r.module,
      r.requirement,
      r.requestor ?? "—",
      r.priority,
      r.status,
      r.owner?.name ?? "—",
    ]),
  ], [12, 24, 65, 18, 10, 14, 18],
  [{ s: { r: 0, c: 0 }, e: { r: 0, c: C2 - 1 } }]
  ), "Requirements")

  // ── Sheet 4: Test Items ──────────────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb, ws([
    [`TEST ITEMS — ${dateLabel}  (${testItems.length} Active)`, ...blank(C2 - 1)],
    ["Test ID", "Module", "Sub Module", "Description", "Owner", "Priority", "Status"],
    ...testItems.map((t: any) => [
      t.testId,
      t.module,
      t.subModule ?? "—",
      t.description,
      t.testedBy  ?? "—",
      t.priority,
      t.status,
    ]),
  ], [16, 22, 28, 60, 18, 10, 14],
  [{ s: { r: 0, c: 0 }, e: { r: 0, c: C2 - 1 } }]
  ), "Test Items")

  // ── Sheet 5: Support ─────────────────────────────────────────────────────────
  const allClosed = support.every(t => isDone(t.status))
  const suppTitle = support.length === 0
    ? `SUPPORT TICKETS — ${dateLabel}  (0 Tickets)`
    : `SUPPORT TICKETS — ${dateLabel}  (${support.length} Ticket${support.length > 1 ? "s" : ""} | ${allClosed ? "All Closed" : `${support.filter(t => isDone(t.status)).length} Closed`})`

  XLSX.utils.book_append_sheet(wb, ws([
    [suppTitle, ...blank(C2 - 1)],
    ["Customer", "Product", "Requirement", "Requestor", "Priority", "Status", "Owner"],
    ...support.map((t: any) => [
      t.customer,
      t.product,
      t.requirement,
      t.requestor  ?? "—",
      t.priority,
      t.status,
      t.owner?.name ?? "—",
    ]),
  ], [18, 18, 55, 18, 10, 14, 18],
  [{ s: { r: 0, c: 0 }, e: { r: 0, c: C2 - 1 } }]
  ), "Support")

  save(wb, `Manager-Summary-Report-${dateLabel.replace(/\s/g, "-")}.xlsx`)
}
