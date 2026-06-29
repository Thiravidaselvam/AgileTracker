import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const doc = await db.signOffDocument.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      items: { orderBy: [{ section: "asc" }, { sno: "asc" }] },
    },
  })

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(doc)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const doc = await db.signOffDocument.update({
    where: { id },
    data: {
      title:       body.title,
      project:     body.project,
      module:      body.module      ?? null,
      docDate:     body.docDate     ? new Date(body.docDate) : null,
      description: body.description ?? null,
      status:      body.status,
    },
    include: { createdBy: { select: { id: true, name: true } }, items: true },
  })

  return NextResponse.json(doc)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.signOffDocument.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
