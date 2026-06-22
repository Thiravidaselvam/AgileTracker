// Generates a clean standalone HTML document and opens browser print dialog.
// Nothing from the React UI appears — only the report data.

function esc(v: any): string {
  if (v == null) return "—"
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function fmtD(d: any): string {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  } catch { return "—" }
}

function badge(text: string, cls: string) {
  return `<span class="badge ${cls}">${esc(text)}</span>`
}

function statusBadge(s: string) {
  const v = (s || "").toLowerCase()
  const cls = ["completed","closed","resolved","fixed","passed","done"].includes(v) ? "green"
    : v === "open" ? "blue"
    : ["in progress","active","planning"].includes(v) ? "yellow"
    : "gray"
  return badge(s, cls)
}

function severityBadge(s: string) {
  const v = (s || "").toUpperCase()
  return badge(s, v === "HIGH" ? "red" : v === "LOW" ? "green" : "yellow")
}

function priorityBadge(p: string) {
  const v = (p || "").toUpperCase()
  return badge(p, v === "HIGH" ? "red" : v === "LOW" ? "green" : "yellow")
}

// ── shared CSS ────────────────────────────────────────────────────────────────

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9.5pt;
  color: #1a1a1a;
  background: white;
}
.page { padding: 14mm 16mm; }
.report-title { font-size: 18pt; font-weight: 700; color: #1e3a5f; }
.report-sub { font-size: 10pt; color: #555; margin-top: 3pt; }
.meta { font-size: 8pt; color: #888; margin-top: 2pt; }
.divider { border: none; border-top: 2px solid #1e3a5f; margin: 10pt 0 14pt; }

/* Section headings */
h2 {
  font-size: 11pt; font-weight: 700; color: #1e3a5f;
  margin: 16pt 0 7pt;
  padding: 4pt 8pt;
  background: #eef2ff;
  border-left: 4px solid #3b5bdb;
}
h3 { font-size: 10pt; font-weight: 700; margin: 12pt 0 5pt; color: #374151; }

/* KPI grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8pt;
  margin-bottom: 14pt;
}
.kpi-card {
  border: 1px solid #d1d5db;
  border-radius: 5pt;
  padding: 8pt 10pt;
  text-align: center;
}
.kpi-value { font-size: 20pt; font-weight: 800; color: #1e3a5f; line-height: 1; }
.kpi-label { font-size: 7.5pt; color: #6b7280; margin-top: 3pt; }
.kpi-card.danger { border-color: #fca5a5; }
.kpi-card.danger .kpi-value { color: #dc2626; }

/* Tables */
table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; font-size: 8.5pt; }
thead tr { background: #1e3a5f; color: white; }
th { padding: 5pt 7pt; text-align: left; font-weight: 600; font-size: 8pt; }
td { padding: 4pt 7pt; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
tbody tr:nth-child(even) td { background: #f9fafb; }
tbody tr:last-child td { border-bottom: none; }
td.num { text-align: center; font-weight: 600; }
td.mono { font-family: monospace; font-size: 8pt; }

/* Badges */
.badge { display: inline-block; padding: 1.5pt 6pt; border-radius: 10pt; font-size: 7.5pt; font-weight: 700; white-space: nowrap; }
.badge.green  { background: #dcfce7; color: #166534; }
.badge.blue   { background: #dbeafe; color: #1e40af; }
.badge.yellow { background: #fef9c3; color: #854d0e; }
.badge.red    { background: #fee2e2; color: #991b1b; }
.badge.gray   { background: #f3f4f6; color: #374151; }

/* Alert box for overdue */
.alert-box { background: #fff7f7; border: 1px solid #fca5a5; border-radius: 4pt; padding: 4pt 8pt; margin-bottom: 10pt; }
.alert-box p { margin: 2pt 0; }

/* Owner card */
.owner-card { border: 1px solid #e5e7eb; border-radius: 5pt; padding: 8pt 10pt; margin-bottom: 8pt; page-break-inside: avoid; }
.owner-name { font-size: 10pt; font-weight: 700; color: #1e3a5f; margin-bottom: 4pt; }
.owner-total { font-size: 8pt; color: #6b7280; font-weight: normal; }

/* Empty state */
.empty { font-size: 8.5pt; color: #9ca3af; font-style: italic; margin: 4pt 0 12pt; }

/* Status pills row */
.pills { display: flex; flex-wrap: wrap; gap: 4pt; }

/* Page layout */
@page { margin: 0; size: A4 portrait; }
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-break { page-break-inside: avoid; }
  .page-break { page-break-before: always; }
}
`

// ── open print window ─────────────────────────────────────────────────────────

function openPrint(titleStr: string, body: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(titleStr)}</title>
  <style>${CSS}</style>
</head>
<body>
<div class="page">
${body}
</div>
<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  };
<\/script>
</body>
</html>`

  const win = window.open("", "_blank", "width=900,height=750,scrollbars=yes")
  if (!win) { alert("Please allow pop-ups to print reports."); return }
  win.document.write(html)
  win.document.close()
}

// ── helpers ───────────────────────────────────────────────────────────────────

function tableHead(...cols: string[]) {
  return `<thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead>`
}

function noData(msg = "No records in this period.") {
  return `<p class="empty">${msg}</p>`
}

function statusCount(items: any[]): string {
  const map: Record<string, number> = {}
  items.forEach(i => { const s = i.status || "—"; map[s] = (map[s] ?? 0) + 1 })
  return Object.entries(map).map(([s, c]) => `<span class="badge ${statusBadge(s).match(/class="badge (\w+)"/)?.[1] ?? "gray"}">${esc(s)} ${c}</span>`).join(" ")
}

// ── Daily Report ──────────────────────────────────────────────────────────────

export function printDailyReport(report: any) {
  const date      = report.date ?? new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  const generated = new Date().toLocaleString("en-GB")
  const s         = report.summary ?? {}
  const issues    = report.details?.updatedIssues  ?? []
  const reqs      = report.details?.updatedReqs    ?? []
  const tests     = report.details?.updatedTests   ?? []
  const overdue   = report.details?.overdueIssues  ?? []

  let body = `
    <div class="report-title">Daily Progress Report</div>
    <div class="report-sub">Date: ${esc(date)}</div>
    <div class="meta">Generated: ${esc(generated)}</div>
    <hr class="divider">

    <h2>KPI Summary</h2>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-value">${s.issuesUpdated ?? 0}</div><div class="kpi-label">Issues Updated</div></div>
      <div class="kpi-card"><div class="kpi-value">${s.reqsUpdated ?? 0}</div><div class="kpi-label">Requirements Updated</div></div>
      <div class="kpi-card"><div class="kpi-value">${s.testsUpdated ?? 0}</div><div class="kpi-label">Tests Updated</div></div>
      <div class="kpi-card"><div class="kpi-value">${s.newIssues ?? 0}</div><div class="kpi-label">New Issues</div></div>
      <div class="kpi-card"><div class="kpi-value">${s.newRequirements ?? 0}</div><div class="kpi-label">New Requirements</div></div>
      <div class="kpi-card danger"><div class="kpi-value">${s.overdueIssues ?? 0}</div><div class="kpi-label">Overdue Issues</div></div>
    </div>
  `

  // Issues updated
  body += `<h2>Issues Updated Today <span style="font-weight:400;font-size:9pt">(${issues.length})</span></h2>`
  if (!issues.length) {
    body += noData("No issues updated today.")
  } else {
    body += `<table>${tableHead("#", "Issue ID", "Module", "Description", "Owner", "Status", "Severity", "Open Date", "Due Date")}<tbody>`
    issues.forEach((i: any, n: number) => {
      body += `<tr>
        <td class="num">${n + 1}</td>
        <td class="mono">${esc(i.issueId)}</td>
        <td>${esc(i.module)}</td>
        <td>${esc(i.description)}</td>
        <td>${esc(i.owner?.name)}</td>
        <td>${statusBadge(i.status)}</td>
        <td>${severityBadge(i.severity)}</td>
        <td>${fmtD(i.openDate)}</td>
        <td>${fmtD(i.dueDate)}</td>
      </tr>`
    })
    body += `</tbody></table>`
  }

  // Requirements updated
  body += `<h2>Requirements Updated Today <span style="font-weight:400;font-size:9pt">(${reqs.length})</span></h2>`
  if (!reqs.length) {
    body += noData("No requirements updated today.")
  } else {
    body += `<table>${tableHead("#", "Req ID", "Module", "Requirement", "Owner", "Status", "Priority", "Target Date")}<tbody>`
    reqs.forEach((r: any, n: number) => {
      body += `<tr>
        <td class="num">${n + 1}</td>
        <td class="mono">${esc(r.reqId)}</td>
        <td>${esc(r.module)}</td>
        <td>${esc(r.requirement)}</td>
        <td>${esc(r.owner?.name)}</td>
        <td>${statusBadge(r.status)}</td>
        <td>${priorityBadge(r.priority)}</td>
        <td>${fmtD(r.targetDate)}</td>
      </tr>`
    })
    body += `</tbody></table>`
  }

  // Tests updated
  body += `<h2>Tests Updated Today <span style="font-weight:400;font-size:9pt">(${tests.length})</span></h2>`
  if (!tests.length) {
    body += noData("No test items updated today.")
  } else {
    body += `<table>${tableHead("#", "Test ID", "Module", "Issue Title", "Tested By", "Owner", "Status", "Priority")}<tbody>`
    tests.forEach((t: any, n: number) => {
      body += `<tr>
        <td class="num">${n + 1}</td>
        <td class="mono">${esc(t.testId)}</td>
        <td>${esc(t.module)}</td>
        <td>${esc(t.issueTitle)}</td>
        <td>${esc(t.testedBy)}</td>
        <td>${esc(t.owner?.name)}</td>
        <td>${statusBadge(t.status)}</td>
        <td>${priorityBadge(t.priority)}</td>
      </tr>`
    })
    body += `</tbody></table>`
  }

  // Overdue issues
  body += `<h2 style="background:#fef2f2;border-left-color:#dc2626;color:#991b1b">⚠ Overdue Issues <span style="font-weight:400;font-size:9pt">(${overdue.length})</span></h2>`
  if (!overdue.length) {
    body += noData("No overdue issues.")
  } else {
    body += `<table>${tableHead("#", "Issue ID", "Module", "Description", "Severity", "Owner", "Status", "Open Date", "Due Date")}<tbody>`
    overdue.forEach((i: any, n: number) => {
      body += `<tr style="background:#fff7f7">
        <td class="num">${n + 1}</td>
        <td class="mono">${esc(i.issueId)}</td>
        <td>${esc(i.module)}</td>
        <td>${esc(i.description)}</td>
        <td>${severityBadge(i.severity)}</td>
        <td>${esc(i.owner?.name)}</td>
        <td>${statusBadge(i.status)}</td>
        <td>${fmtD(i.openDate)}</td>
        <td>${fmtD(i.dueDate)}</td>
      </tr>`
    })
    body += `</tbody></table>`
  }

  openPrint(`Daily Report – ${date}`, body)
}

// ── Range Report (Weekly / Monthly / Quarterly / Yearly) ──────────────────────

export function printRangeReport(report: any) {
  const period    = report.period ?? "—"
  const generated = new Date().toLocaleString("en-GB")
  const sum       = report.summary ?? {}

  // build owner groups
  const ownerMap = new Map<string, { reqs: any[]; issues: any[]; support: any[]; actions: any[] }>()
  const addToOwner = (items: any[], field: "reqs" | "issues" | "support" | "actions") => {
    ;(items ?? []).forEach((r: any) => {
      const k = r.owner?.name ?? "Unassigned"
      if (!ownerMap.has(k)) ownerMap.set(k, { reqs: [], issues: [], support: [], actions: [] })
      ownerMap.get(k)![field].push(r)
    })
  }
  addToOwner(report.requirements   ?? [], "reqs")
  addToOwner(report.issues         ?? [], "issues")
  addToOwner(report.supportTickets ?? [], "support")
  addToOwner(report.actionItems    ?? [], "actions")
  const ownerGroups = [...ownerMap.entries()]
    .map(([name, d]) => ({ name, ...d, total: d.reqs.length + d.issues.length + d.support.length + d.actions.length }))
    .filter(o => o.total > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  // tester groups
  const testerMap = new Map<string, any[]>()
  ;(report.testItems ?? []).forEach((t: any) => {
    const k = t.testedBy || "Unassigned"
    if (!testerMap.has(k)) testerMap.set(k, [])
    testerMap.get(k)!.push(t)
  })
  const testerGroups = [...testerMap.entries()]
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => a.name.localeCompare(b.name))

  let body = `
    <div class="report-title">Progress Report</div>
    <div class="report-sub">Period: ${esc(period)}</div>
    <div class="meta">Generated: ${esc(generated)}</div>
    <hr class="divider">
  `

  // KPI cards
  body += `<h2>Period Summary</h2>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-value">${sum.openedIssues ?? 0}</div><div class="kpi-label">Issues Opened</div></div>
    <div class="kpi-card"><div class="kpi-value">${sum.resolvedIssues ?? 0}</div><div class="kpi-label">Issues Resolved</div></div>
    <div class="kpi-card"><div class="kpi-value">${sum.openedReqs ?? 0}</div><div class="kpi-label">Requirements Opened</div></div>
    <div class="kpi-card"><div class="kpi-value">${sum.closedReqs ?? 0}</div><div class="kpi-label">Requirements Closed</div></div>
    <div class="kpi-card"><div class="kpi-value">${sum.openSupport ?? 0}</div><div class="kpi-label">Open Support</div></div>
    <div class="kpi-card danger"><div class="kpi-value">${sum.atRiskCount ?? 0}</div><div class="kpi-label">At Risk</div></div>
  </div>`

  // Module status summary
  const STATUS_MODULES: [string, string][] = [
    ["Requirements", "requirements"], ["Issues", "issues"],
    ["Test Items", "testItems"], ["Support Tickets", "supportTickets"],
    ["Action Items", "actionItems"], ["Sprints", "sprints"],
  ]
  body += `<h2>Module Status Summary <span style="font-weight:400;font-size:9pt">(all-time)</span></h2>
  <table>${tableHead("Module", "Status Breakdown", "Total")}<tbody>`
  STATUS_MODULES.forEach(([label, key]) => {
    const counts = (report.statusSummary ?? {})[key] ?? {}
    const total  = Object.values(counts).reduce((s: any, v: any) => s + v, 0)
    const pills  = Object.entries(counts).map(([st, c]) => `${statusBadge(st)} <strong>${c}</strong>`).join("  ")
    body += `<tr><td><strong>${esc(label)}</strong></td><td>${pills || "—"}</td><td class="num">${total}</td></tr>`
  })
  body += `</tbody></table>`

  // Owner-wise progress
  body += `<h2>Owner-wise Progress <span style="font-weight:400;font-size:9pt">(${ownerGroups.length} owners)</span></h2>`
  if (!ownerGroups.length) {
    body += noData("No owner-assigned items in this period.")
  } else {
    ownerGroups.forEach(owner => {
      body += `<div class="owner-card no-break">
        <div class="owner-name">${esc(owner.name)} <span class="owner-total">— ${owner.total} item${owner.total !== 1 ? "s" : ""}</span></div>
        <table>${tableHead("Module", "Count", "Status Breakdown")}<tbody>`
      const rows: [string, any[]][] = [["Requirements", owner.reqs], ["Issues", owner.issues], ["Support Tickets", owner.support], ["Action Items", owner.actions]]
      rows.filter(([, items]) => items.length > 0).forEach(([label, items]) => {
        body += `<tr><td><strong>${label}</strong></td><td class="num">${items.length}</td><td>${statusCount(items)}</td></tr>`
      })
      body += `</tbody></table></div>`
    })
  }

  // Tester-wise progress
  if (testerGroups.length > 0) {
    body += `<h2>Tester-wise Progress <span style="font-weight:400;font-size:9pt">(${testerGroups.length} testers)</span></h2>
    <table>${tableHead("Tester", "Count", "Status Breakdown")}<tbody>`
    testerGroups.forEach(({ name, items }) => {
      body += `<tr><td><strong>${esc(name)}</strong></td><td class="num">${items.length}</td><td>${statusCount(items)}</td></tr>`
    })
    body += `</tbody></table>`
  }

  // Sprint details
  if (report.sprints?.length > 0) {
    body += `<h2>Sprints in Period <span style="font-weight:400;font-size:9pt">(${report.sprints.length})</span></h2>
    <table>${tableHead("Sprint", "Start", "End", "Planned", "Completed", "Velocity", "Status")}<tbody>`
    report.sprints.forEach((sp: any) => {
      const vel = Number(sp.velocityPct ?? 0)
      const velColor = vel >= 80 ? "green" : vel >= 60 ? "yellow" : "red"
      body += `<tr>
        <td><strong>${esc(sp.sprintName)}</strong></td>
        <td>${fmtD(sp.startDate)}</td>
        <td>${fmtD(sp.endDate)}</td>
        <td class="num">${sp.plannedStories}</td>
        <td class="num">${sp.completedStories}</td>
        <td class="num"><span class="badge ${velColor}">${vel.toFixed(0)}%</span></td>
        <td>${statusBadge(sp.sprintStatus)}</td>
      </tr>`
    })
    body += `</tbody></table>`
  }

  // At-risk items
  if (report.atRisk?.length > 0) {
    body += `<h2 style="background:#fef9c3;border-left-color:#d97706;color:#92400e">⚠ At-Risk Items <span style="font-weight:400;font-size:9pt">(${report.atRisk.length})</span></h2>
    <table>${tableHead("Severity", "Status", "Days Open")}<tbody>`
    report.atRisk.forEach((i: any) => {
      body += `<tr style="background:#fffbeb">
        <td>${severityBadge(i.severity)}</td>
        <td>${statusBadge(i.status)}</td>
        <td class="num">${i.daysOpen ?? "—"}</td>
      </tr>`
    })
    body += `</tbody></table>`
  }

  openPrint(`Progress Report – ${period}`, body)
}

// ── Individual Change Request Document ───────────────────────────────────────

const CR_STATUS_COLOR: Record<string, string> = {
  "Submitted":    "#1d4ed8",
  "Under Review": "#92400e",
  "Approved":     "#166534",
  "Rejected":     "#991b1b",
  "In Progress":  "#6d28d9",
  "Implemented":  "#0f766e",
  "Deferred":     "#4b5563",
}

const CR_STATUS_BG: Record<string, string> = {
  "Submitted":    "#dbeafe",
  "Under Review": "#fef9c3",
  "Approved":     "#dcfce7",
  "Rejected":     "#fee2e2",
  "In Progress":  "#ede9fe",
  "Implemented":  "#ccfbf1",
  "Deferred":     "#f3f4f6",
}

const CR_PRIORITY_COLOR: Record<string, string> = {
  HIGH:   "#991b1b",
  MEDIUM: "#92400e",
  LOW:    "#166534",
}

const CR_PRIORITY_BG: Record<string, string> = {
  HIGH:   "#fee2e2",
  MEDIUM: "#fef9c3",
  LOW:    "#dcfce7",
}

// ── Change Request List (all CRs as a table) ─────────────────────────────────

export function printCRList(crs: any[]) {
  const generated = new Date().toLocaleString("en-GB")

  const PRIORITY_COLOR: Record<string, string> = { HIGH: "#991b1b", MEDIUM: "#92400e", LOW: "#166534" }
  const PRIORITY_BG:    Record<string, string> = { HIGH: "#fee2e2", MEDIUM: "#fef9c3", LOW: "#dcfce7"  }
  const STATUS_COLOR:   Record<string, string> = {
    "Submitted": "#1d4ed8", "Under Review": "#92400e", "Approved": "#166534",
    "Rejected": "#991b1b", "In Progress": "#6d28d9", "Implemented": "#0f766e", "Deferred": "#4b5563",
  }
  const STATUS_BG: Record<string, string> = {
    "Submitted": "#dbeafe", "Under Review": "#fef9c3", "Approved": "#dcfce7",
    "Rejected": "#fee2e2", "In Progress": "#ede9fe", "Implemented": "#ccfbf1", "Deferred": "#f3f4f6",
  }

  const rows = crs.map((cr, i) => {
    const sBg    = STATUS_BG[cr.status]       ?? "#f3f4f6"
    const sColor = STATUS_COLOR[cr.status]    ?? "#374151"
    const pBg    = PRIORITY_BG[cr.priority]   ?? "#f3f4f6"
    const pColor = PRIORITY_COLOR[cr.priority] ?? "#374151"
    return `<tr>
      <td class="num" style="font-size:8pt">${i + 1}</td>
      <td class="mono">${esc(cr.crId)}</td>
      <td style="max-width:200pt">${esc(cr.title)}</td>
      <td><span style="background:${pBg};color:${pColor};padding:2pt 7pt;border-radius:10pt;font-size:7.5pt;font-weight:700">${esc(cr.priority)}</span></td>
      <td><span style="background:${sBg};color:${sColor};padding:2pt 7pt;border-radius:10pt;font-size:7.5pt;font-weight:700">${esc(cr.status)}</span></td>
      <td>${esc(cr.requestedBy)}</td>
      <td>${esc(cr.owner?.name)}</td>
      <td>${fmtD(cr.targetDate)}</td>
      <td>${fmtD(cr.createdAt)}</td>
    </tr>`
  }).join("")

  const body = `
    <div style="border-bottom:3px solid #1e3a5f;padding-bottom:8pt;margin-bottom:14pt;display:flex;justify-content:space-between;align-items:flex-end">
      <div>
        <h1 style="font-size:16pt;font-weight:800;color:#1e3a5f">Change Request Register</h1>
        <p style="font-size:8pt;color:#9ca3af;margin-top:3pt">Generated: ${esc(generated)}</p>
      </div>
      <p style="font-size:9pt;font-weight:600;color:#374151">${crs.length} Change Request${crs.length !== 1 ? "s" : ""}</p>
    </div>

    <table>
      ${tableHead("#", "CR ID", "Title", "Priority", "Status", "Requested By", "Owner", "Target Date", "Raised On")}
      <tbody>${rows || `<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:16pt">No change requests found.</td></tr>`}</tbody>
    </table>

    <div style="border-top:1px solid #e5e7eb;padding-top:6pt;margin-top:8pt">
      <p style="font-size:7.5pt;color:#9ca3af;text-align:right">Agile Tracker · Change Request Register · ${esc(generated)}</p>
    </div>
  `

  openPrint("Change Request Register", body)
}

// ── Individual Change Request Document ───────────────────────────────────────

export function printCRDocument(cr: any) {
  const generated = new Date().toLocaleString("en-GB")
  const status     = cr.status   ?? "—"
  const priority   = cr.priority ?? "—"
  const sBg        = CR_STATUS_BG[status]     ?? "#f3f4f6"
  const sColor     = CR_STATUS_COLOR[status]  ?? "#374151"
  const pBg        = CR_PRIORITY_BG[priority]    ?? "#f3f4f6"
  const pColor     = CR_PRIORITY_COLOR[priority] ?? "#374151"

  const WORKFLOW = ["Submitted", "Under Review", "Approved", "In Progress", "Implemented"]

  function section(title: string, content: string, bg = "#f9fafb", border = "#e5e7eb") {
    return `
    <div style="margin-bottom:14pt">
      <p style="font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin-bottom:5pt">${title}</p>
      <div style="background:${bg};border:1px solid ${border};border-radius:4pt;padding:8pt 10pt;font-size:9pt;white-space:pre-wrap;line-height:1.5">${esc(content)}</div>
    </div>`
  }

  function fieldRow(label: string, value: string) {
    return `<tr>
      <td style="width:38%;padding:6pt 8pt;font-weight:600;font-size:8.5pt;color:#374151;background:#f9fafb;border:1px solid #e5e7eb">${label}</td>
      <td style="padding:6pt 8pt;font-size:9pt;border:1px solid #e5e7eb">${value}</td>
    </tr>`
  }

  const body = `
    <!-- Letterhead -->
    <div style="border-bottom:3px solid #1e3a5f;padding-bottom:10pt;margin-bottom:14pt;display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <p style="font-size:8pt;font-family:monospace;color:#6b7280;margin-bottom:3pt">${esc(cr.crId)}</p>
        <h1 style="font-size:15pt;font-weight:800;color:#1e3a5f;line-height:1.2;margin-bottom:4pt">${esc(cr.title)}</h1>
        <p style="font-size:8pt;color:#9ca3af">Raised: ${fmtD(cr.createdAt)} &nbsp;·&nbsp; Last updated: ${fmtD(cr.updatedAt)}</p>
      </div>
      <div style="text-align:right;flex-shrink:0;margin-left:16pt">
        <span style="display:inline-block;background:${sBg};color:${sColor};padding:3pt 10pt;border-radius:10pt;font-size:8.5pt;font-weight:700;margin-bottom:4pt">${esc(status)}</span><br>
        <span style="display:inline-block;background:${pBg};color:${pColor};padding:3pt 10pt;border-radius:10pt;font-size:8.5pt;font-weight:700">${esc(priority)} Priority</span>
      </div>
    </div>

    <!-- Details table -->
    <h2 style="font-size:10pt;font-weight:700;color:#1e3a5f;background:#eef2ff;border-left:4px solid #3b5bdb;padding:4pt 8pt;margin-bottom:8pt">Change Request Details</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:14pt">
      <tbody>
        ${fieldRow("Requested By",      esc(cr.requestedBy))}
        ${fieldRow("Assigned Owner",    esc(cr.owner?.name))}
        ${fieldRow("Target Date",       fmtD(cr.targetDate))}
        ${fieldRow("Estimated Effort",  esc(cr.estimatedEffort))}
        ${fieldRow("Actual Completion", fmtD(cr.actualCompletion))}
      </tbody>
    </table>

    <!-- Content sections -->
    <h2 style="font-size:10pt;font-weight:700;color:#1e3a5f;background:#eef2ff;border-left:4px solid #3b5bdb;padding:4pt 8pt;margin-bottom:8pt">Content</h2>
    ${section("Description",          cr.description ?? "")}
    ${section("Reason / Justification", cr.reason    ?? "")}
    ${cr.impact  ? section("Impact Assessment",       cr.impact,  "#fffbeb", "#fde68a") : ""}
    ${cr.remarks ? section("Remarks / Review Notes",  cr.remarks, "#eff6ff", "#bfdbfe") : ""}

    <!-- Status workflow -->
    <h2 style="font-size:10pt;font-weight:700;color:#1e3a5f;background:#eef2ff;border-left:4px solid #3b5bdb;padding:4pt 8pt;margin:14pt 0 8pt">Status Workflow</h2>
    <div style="display:flex;align-items:center;gap:4pt;flex-wrap:wrap;margin-bottom:16pt">
      ${WORKFLOW.map((s, i) => {
        const active = s === status
        const bg     = active ? (CR_STATUS_BG[s]    ?? "#e5e7eb") : "#f3f4f6"
        const color  = active ? (CR_STATUS_COLOR[s] ?? "#374151") : "#9ca3af"
        const border = active ? `2px solid ${color}` : "2px solid transparent"
        return `<span style="background:${bg};color:${color};border:${border};padding:3pt 9pt;border-radius:10pt;font-size:8pt;font-weight:700">${s}</span>${i < WORKFLOW.length - 1 ? `<span style="color:#d1d5db;font-size:10pt">→</span>` : ""}`
      }).join("")}
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e5e7eb;padding-top:6pt;margin-top:4pt">
      <p style="font-size:7.5pt;color:#9ca3af;text-align:right">Printed: ${esc(generated)}</p>
    </div>
  `

  openPrint(`Change Request – ${cr.crId}`, body)
}
