import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const status = searchParams.get("status")

  const where: any = {}
  if (status) where.status = status
  if (search) where.OR = [
    { title:   { contains: search, mode: "insensitive" } },
    { project: { contains: search, mode: "insensitive" } },
    { module:  { contains: search, mode: "insensitive" } },
  ]

  const docs = await db.signOffDocument.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true } },
      items: { select: { id: true, status: true, section: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const enriched = docs.map((d: { items: { status: string; section: string }[] } & Record<string, unknown>) => {
    const total    = d.items.length
    const approved = d.items.filter((i: { status: string; section: string }) => i.status === "Approved").length
    const sections = [...new Set(d.items.map((i: { status: string; section: string }) => i.section))].length
    return { ...d, total, approved, sections, progress: total > 0 ? Math.round((approved / total) * 100) : 0 }
  })

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  if (!body.docId) {
    const count = await db.signOffDocument.count()
    body.docId = `SOD-${String(count + 1).padStart(4, "0")}`
  }

  const doc = await db.signOffDocument.create({
    data: {
      docId:       body.docId,
      title:       body.title,
      project:     body.project,
      module:      body.module      ?? null,
      docDate:     body.docDate     ? new Date(body.docDate) : null,
      description: body.description ?? null,
      status:      body.status      ?? "Draft",
      createdById: (session.user as any).id ?? null,
    },
    include: { createdBy: { select: { id: true, name: true } }, items: true },
  })

  return NextResponse.json(doc, { status: 201 })
}
