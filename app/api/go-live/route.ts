import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const checklists = await db.goLiveChecklist.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: { select: { status: true, priority: true } },
    },
  })

  const data = checklists.map((c) => {
    const total    = c.items.length
    const done     = c.items.filter((i) => i.status === "Done").length
    const blocked  = c.items.filter((i) => i.status === "Blocked").length
    const critical = c.items.filter((i) => i.priority === "Critical" && i.status !== "Done").length
    return {
      id: c.id, checklistId: c.checklistId, title: c.title, project: c.project,
      goLiveDate: c.goLiveDate, description: c.description, status: c.status,
      createdAt: c.createdAt,
      stats: { total, done, blocked, critical, pct: total > 0 ? Math.round((done / total) * 100) : 0 },
    }
  })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, project, goLiveDate, description } = body
  if (!title || !project || !goLiveDate) {
    return NextResponse.json({ error: "title, project, goLiveDate required" }, { status: 400 })
  }

  const count = await db.goLiveChecklist.count()
  const checklistId = `GLC-${String(count + 1).padStart(4, "0")}`

  const checklist = await db.goLiveChecklist.create({
    data: {
      checklistId,
      title,
      project,
      goLiveDate: new Date(goLiveDate),
      description: description || null,
      status: "Planning",
      createdById: (session.user as any).id ?? null,
    },
  })

  return NextResponse.json(checklist, { status: 201 })
}
