import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as XLSX from "xlsx"

// Safely convert any Excel date value to a JS Date (or null)
function parseDate(val: unknown): Date | null {
  if (!val && val !== 0) return null

  // Excel serial number (e.g. 46178)
  if (typeof val === "number" && val > 0) {
    // Excel epoch = Dec 30 1899; Unix epoch is 25569 days later
    const d = new Date(Math.round((val - 25569) * 86400000))
    return isNaN(d.getTime()) ? null : d
  }

  if (typeof val === "string") {
    const s = val.trim()
    if (!s) return null

    // dd.mm.yy / dd.mm.yyyy / dd/mm/yy / dd/mm/yyyy / dd-mm-yy …
    const m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/)
    if (m) {
      const year = m[3].length === 2 ? `20${m[3]}` : m[3]
      const d = new Date(`${year}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`)
      return isNaN(d.getTime()) ? null : d
    }

    // ISO / standard formats (yyyy-mm-dd, etc.)
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }

  return null
}

function normaliseStatus(raw: unknown): string {
  const s = String(raw ?? "").trim()
  if (!s) return "Pending"
  const l = s.toLowerCase()
  if (l.includes("approved")) return "Approved"
  if (l.includes("review"))   return "In Review"
  if (l.includes("reject"))   return "Rejected"
  if (l.includes("defer"))    return "Deferred"
  if (l.includes("pending"))  return "Pending"
  return s || "Pending"
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  const defaultApprovedBy = (formData.get("defaultApprovedBy") as string | null)?.trim() || null

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb     = XLSX.read(buffer, { type: "buffer" })

  // Use the first non-Summary sheet
  const sheetName = wb.SheetNames.find((n) => !n.toLowerCase().includes("summary")) ?? wb.SheetNames[0]
  const ws   = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" })

  // Header rows
  const headerTitle   = String(rows[0]?.[0] ?? "").trim() || file.name.replace(/\.xlsx?$/i, "")
  const headerProject = String(rows[1]?.[0] ?? "").trim()

  // Find the column-header row (contains "S.No" or "Section")
  const colRow: any[] | undefined = rows.find((r: any[]) =>
    String(r[0]).toLowerCase().includes("s.no") ||
    String(r[1]).toLowerCase().includes("section")
  )

  const colIdx = (label: string, exact = false): number => {
    if (!colRow) return -1
    return colRow.findIndex((c: any) => {
      const cell = String(c).toLowerCase().trim()
      return exact ? cell === label.toLowerCase() : cell.includes(label.toLowerCase())
    })
  }

  // Find standalone "Remarks" (not "Remarks / Module Description")
  const pureRemarksCol = (() => {
    if (!colRow) return -1
    let last = -1
    for (let i = 0; i < colRow.length; i++) {
      const cell = String(colRow[i]).toLowerCase().trim()
      if (cell.includes("remarks") && !cell.includes("module") && !cell.includes("description")) {
        last = i
      }
    }
    return last
  })()

  const snoCol    = 0
  const secCol    = colIdx("section") !== -1   ? colIdx("section") : 1
  const itemCol   = colIdx("module")  !== -1   ? colIdx("module")  : colIdx("menu") !== -1 ? colIdx("menu") : 2
  const descCol   = colIdx("description") !== -1
                    ? colIdx("description")
                    : colIdx("remarks / module") !== -1
                      ? colIdx("remarks / module")
                      : 3
  const statCol   = colIdx("status") !== -1    ? colIdx("status") : 4
  const appByCol  = colIdx("approved by") !== -1 ? colIdx("approved by") : -1
  const dateCol   = colIdx("sign-off") !== -1  ? colIdx("sign-off") : colIdx("date") !== -1 ? colIdx("date") : 5
  const remCol    = pureRemarksCol !== -1 && pureRemarksCol !== descCol ? pureRemarksCol : -1

  // Generate doc ID
  const count = await db.signOffDocument.count()
  const docId = `SOD-${String(count + 1).padStart(4, "0")}`

  const projectMatch = headerProject.match(/Project[:\s]+([^|]+)/i)
  const project = projectMatch ? projectMatch[1].trim() : headerTitle

  const doc = await db.signOffDocument.create({
    data: {
      docId,
      title:       headerTitle,
      project,
      module:      sheetName !== "Sheet1" ? sheetName : null,
      description: headerProject || null,
      status:      "In Progress",
      createdById: (session.user as any).id ?? null,
    },
  })

  // Parse items
  let currentSection = ""
  let sno = 0
  const items: any[] = []

  for (let i = 3; i < rows.length; i++) {
    const row    = rows[i] as any[]
    const rawSno  = row[snoCol]
    const rawSec  = String(row[secCol]  ?? "").trim()
    const rawItem = String(row[itemCol] ?? "").trim()

    // Section-divider row: string in first col, empty section & item cols
    if (typeof rawSno === "string" && rawSno.trim() && !rawSec && !rawItem) {
      currentSection = rawSno.trim()
      continue
    }

    if (rawSec)   currentSection = rawSec
    if (!rawItem) continue

    sno++
    items.push({
      documentId:  doc.id,
      sno:         typeof rawSno === "number" ? rawSno : sno,
      section:     currentSection || "General",
      menuItem:    rawItem,
      description: descCol >= 0 ? String(row[descCol] ?? "").trim() || null : null,
      status:      normaliseStatus(row[statCol]),
      approvedBy:  appByCol >= 0 ? (String(row[appByCol] ?? "").trim() || defaultApprovedBy) : defaultApprovedBy,
      signOffDate: dateCol >= 0 ? parseDate(row[dateCol]) : null,
      remarks:     remCol  >= 0 ? String(row[remCol]  ?? "").trim() || null : null,
    })
  }

  if (items.length > 0) {
    await db.signOffItem.createMany({ data: items })
  }

  const allApproved = items.length > 0 && items.every((it) => it.status === "Approved")
  if (allApproved) {
    await db.signOffDocument.update({ where: { id: doc.id }, data: { status: "Completed" } })
  }

  return NextResponse.json({ docId: doc.docId, id: doc.id, itemsImported: items.length }, { status: 201 })
}
